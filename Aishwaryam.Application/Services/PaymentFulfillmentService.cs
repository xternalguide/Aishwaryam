using System;
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using Aishwaryam.Application.DTOs.Gold;
using Aishwaryam.Application.DTOs.Wallet;
using Aishwaryam.Application.Interfaces.Repositories;
using Aishwaryam.Application.Interfaces.Services;
using Aishwaryam.Domain.Entities;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;

namespace Aishwaryam.Application.Services
{
    public class PaymentFulfillmentService : IPaymentFulfillmentService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IGoldService _goldService;
        private readonly IWalletService _walletService;
        private readonly INotificationDispatcher _dispatcher;
        private readonly IAuthRepository _authRepository; // For IdempotencyKeys
        private readonly IBankingRepository _bankingRepository; // For Payments
        private readonly IGoldRepository _goldRepository; // For fetching already processed receipts
        private readonly ISchemeRepository _schemeRepository; // For fetching active user schemes
        private readonly IConfiguration _configuration; // For Razorpay key retrieval
        private readonly ILogger<PaymentFulfillmentService> _logger;

        public PaymentFulfillmentService(
            IUnitOfWork unitOfWork,
            IGoldService goldService,
            IWalletService walletService,
            INotificationDispatcher dispatcher,
            IAuthRepository authRepository,
            IBankingRepository bankingRepository,
            IGoldRepository goldRepository,
            ISchemeRepository schemeRepository,
            IConfiguration configuration,
            ILogger<PaymentFulfillmentService> logger)
        {
            _unitOfWork = unitOfWork;
            _goldService = goldService;
            _walletService = walletService;
            _dispatcher = dispatcher;
            _authRepository = authRepository;
            _bankingRepository = bankingRepository;
            _goldRepository = goldRepository;
            _schemeRepository = schemeRepository;
            _configuration = configuration;
            _logger = logger;
        }

        // Backward compatible constructor for unit tests
        public PaymentFulfillmentService(
            IUnitOfWork unitOfWork,
            IGoldService goldService,
            IWalletService walletService,
            INotificationDispatcher dispatcher,
            IAuthRepository authRepository,
            IBankingRepository bankingRepository,
            IGoldRepository goldRepository,
            ILogger<PaymentFulfillmentService> logger)
            : this(unitOfWork, goldService, walletService, dispatcher, authRepository, bankingRepository, goldRepository, null!, null!, logger)
        {
        }

        public async Task<GoldTransactionResponse> FulfillPaymentAsync(string razorpayOrderId, string razorpayPaymentId, string source, Guid? userId = null)
        {
            // 1. Double check idempotency
            var isAlreadyProcessed = await _authRepository.IsIdempotencyKeyUsedAsync(razorpayPaymentId);
            if (isAlreadyProcessed)
            {
                _logger.LogInformation("Payment {PaymentId} already fulfilled. Returning existing receipt details.", razorpayPaymentId);
                var existingTx = await _goldRepository.GetTransactionByPaymentIdAsync(razorpayPaymentId);
                if (existingTx != null)
                {
                    var userStatus = await _goldRepository.GetGoldStatusAsync(existingTx.UserId);
                    var invoice = existingTx.Invoice;
                    return new GoldTransactionResponse 
                    { 
                        Success = true, 
                        Message = "Already processed",
                        TransactionId = existingTx.Id.ToString(),
                        GoldWeightMg = existingTx.GoldWeightMg,
                        PricePerGmPaise = existingTx.PricePerGmPaise,
                        TotalAmountPaise = existingTx.TotalAmountPaise,
                        BaseAmountPaise = invoice?.BaseAmountPaise ?? (existingTx.TotalAmountPaise * 100 / 103),
                        GstAmountPaise = invoice?.GstAmountPaise ?? (existingTx.TotalAmountPaise - (existingTx.TotalAmountPaise * 100 / 103)),
                        BonusPercentage = invoice?.BonusPercentage ?? (existingTx.BonusGoldMg > 0 ? 10m : 0m),
                        BonusGoldMg = existingTx.BonusGoldMg,
                        BonusAmountPaise = existingTx.BonusAmountPaise,
                        TotalGoldCreditedMg = existingTx.GoldWeightMg + existingTx.BonusGoldMg,
                        NewWalletBalancePaise = 0,
                        NewGoldBalanceMg = await _goldRepository.CalculateGoldBalanceAsync(existingTx.UserId),
                        LockedGoldMg = userStatus.LockedMg,
                        RedeemableGoldMg = userStatus.RedeemableMg
                    };
                }
                return new GoldTransactionResponse { Success = true, Message = "Already processed" };
            }

            // 2. Start Atomic Transaction
            await _unitOfWork.BeginTransactionAsync();
            try
            {
                // Find the payment record
                var paymentRecord = await _bankingRepository.GetPaymentByOrderIdAsync(razorpayOrderId);
                if (paymentRecord == null)
                {
                    _logger.LogWarning("Payment record not found for OrderId: {OrderId}. Self-healing dynamic test payment entry.", razorpayOrderId);

                    // Resolve user ID
                    var resolvedUserId = userId ?? Guid.Empty;
                    if (resolvedUserId == Guid.Empty)
                    {
                        throw new Exception($"Payment record not found for OrderId: {razorpayOrderId} and no user context was provided to self-heal.");
                    }

                    // Resolve Amount from Razorpay API dynamically using key configuration
                    long amountPaise = 50000; // fallback default of ₹500
                    if (_configuration != null)
                    {
                        try
                        {
                            var rKey = _configuration["Razorpay:Key"];
                            var rSecret = _configuration["Razorpay:Secret"];
                            if (!string.IsNullOrEmpty(rKey) && !string.IsNullOrEmpty(rSecret) && !rKey.Contains("RAILWAY"))
                            {
                                var rClient = new Razorpay.Api.RazorpayClient(rKey, rSecret);
                                var order = rClient.Order.Fetch(razorpayOrderId);
                                if (order != null)
                                {
                                    amountPaise = Convert.ToInt64(order["amount"].ToString());
                                }
                            }
                        }
                        catch (Exception rpEx)
                        {
                            _logger.LogWarning(rpEx, "Failed to fetch amount from Razorpay API. Using default fallback amount.");
                        }
                    }

                    // Get active scheme to link
                    UserScheme? activeScheme = null;
                    if (_schemeRepository != null)
                    {
                        activeScheme = await _schemeRepository.GetActiveUserSchemeAsync(resolvedUserId);
                    }

                    paymentRecord = new Payment
                    {
                        Id = Guid.NewGuid(),
                        UserId = resolvedUserId,
                        UserSchemeId = activeScheme?.Id,
                        ProviderOrderId = razorpayOrderId,
                        ProviderPaymentId = razorpayPaymentId,
                        AmountPaise = amountPaise,
                        Status = "SUCCESS",
                        IpAddress = "127.0.0.1",
                        DeviceFingerprint = "self_healed",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    await _bankingRepository.AddPaymentAsync(paymentRecord);
                }

                if (paymentRecord.Status == "SUCCESS")
                {
                    _logger.LogInformation("Payment record already SUCCESS for order {OrderId}. Returning existing transaction details.", razorpayOrderId);
                    var existingTx = await _goldRepository.GetTransactionByPaymentIdAsync(razorpayPaymentId);
                    if (existingTx == null && !string.IsNullOrEmpty(paymentRecord.ProviderPaymentId))
                    {
                        existingTx = await _goldRepository.GetTransactionByPaymentIdAsync(paymentRecord.ProviderPaymentId);
                    }
                    if (existingTx != null)
                    {
                        var userStatus = await _goldRepository.GetGoldStatusAsync(paymentRecord.UserId);
                        var invoice = existingTx.Invoice;
                        return new GoldTransactionResponse 
                        { 
                            Success = true, 
                            Message = "Already SUCCESS",
                            TransactionId = existingTx.Id.ToString(),
                            GoldWeightMg = existingTx.GoldWeightMg,
                            PricePerGmPaise = existingTx.PricePerGmPaise,
                            TotalAmountPaise = existingTx.TotalAmountPaise,
                            BaseAmountPaise = invoice?.BaseAmountPaise ?? (existingTx.TotalAmountPaise * 100 / 103),
                            GstAmountPaise = invoice?.GstAmountPaise ?? (existingTx.TotalAmountPaise - (existingTx.TotalAmountPaise * 100 / 103)),
                            BonusPercentage = invoice?.BonusPercentage ?? (existingTx.BonusGoldMg > 0 ? 10m : 0m),
                            BonusGoldMg = existingTx.BonusGoldMg,
                            BonusAmountPaise = existingTx.BonusAmountPaise,
                            TotalGoldCreditedMg = existingTx.GoldWeightMg + existingTx.BonusGoldMg,
                            NewWalletBalancePaise = 0,
                            NewGoldBalanceMg = await _goldRepository.CalculateGoldBalanceAsync(paymentRecord.UserId),
                            LockedGoldMg = userStatus.LockedMg,
                            RedeemableGoldMg = userStatus.RedeemableMg
                        };
                    }
                    return new GoldTransactionResponse { Success = true, Message = "Already SUCCESS" };
                }

                // Update Status
                paymentRecord.Status = "SUCCESS";
                paymentRecord.ProviderPaymentId = razorpayPaymentId;
                paymentRecord.UpdatedAt = DateTime.UtcNow;

                // Record Idempotency Key
                await _authRepository.SaveIdempotencyKeyAsync(new IdempotencyKey
                {
                    Key = razorpayPaymentId,
                    UserId = paymentRecord.UserId,
                    Endpoint = "FulfillmentService",
                    ResponseBody = JsonDocument.Parse("{}"),
                    ResponseStatus = 200,
                    CreatedAt = DateTime.UtcNow
                });

                await _bankingRepository.UpdatePaymentAsync(paymentRecord);
                await _unitOfWork.SaveChangesAsync();

                // 3. Financial Core: Credit Wallet
                await _walletService.ProcessTransactionAsync(new WalletTransactionRequest
                {
                    UserId = paymentRecord.UserId,
                    TransactionType = "CREDIT",
                    AmountPaise = paymentRecord.AmountPaise,
                    ReferenceId = razorpayPaymentId,
                    Description = $"Razorpay Deposit ({source})",
                    IpAddress = paymentRecord.IpAddress,
                    DeviceFingerprint = paymentRecord.DeviceFingerprint
                });

                // 4. Financial Core: Buy Gold
                var receipt = await _goldService.BuyGoldAsync(new BuyGoldRequest
                {
                    UserId = paymentRecord.UserId,
                    UserSchemeId = paymentRecord.UserSchemeId,
                    TotalAmountPaise = paymentRecord.AmountPaise,
                    IpAddress = paymentRecord.IpAddress,
                    DeviceFingerprint = paymentRecord.DeviceFingerprint,
                    RazorpayPaymentId = razorpayPaymentId
                });

                if (!receipt.Success)
                {
                    throw new Exception($"Gold purchase failed during fulfillment: {receipt.Message}");
                }

                await _unitOfWork.CommitAsync();

                // Fetch User Details to send Email/SMS
                var user = await _authRepository.GetUserByIdAsync(paymentRecord.UserId);
                
                // 5. User Communication - Dispatch via Push, SMS and Email!
                var title = "Payment Successful! ✅";
                var body = $"Your payment of ₹{paymentRecord.AmountPaise / 100.0} was successful. {(receipt.GoldWeightMg / 1000.0):F4}g of gold added to your portfolio.";
                var pushData = new Dictionary<string, string>
                {
                    { "screen", "history" },
                    { "type", "PAYMENT_SUCCESS" },
                    { "entityId", receipt.TransactionId }
                };

                await _dispatcher.DispatchAsync(new NotificationPayload
                {
                    UserId = paymentRecord.UserId,
                    ToPhone = user?.PhoneNumber,
                    ToEmail = user?.Email,
                    ToName = user?.FullName ?? "Customer",
                    Title = title,
                    Body = body,
                    Type = "PAYMENT_SUCCESS",
                    SendPush = true,
                    PushData = pushData,
                    SendSms = true, // Configured for fallback Fast2SMS currently
                    SmsText = body,
                    SendEmail = true,
                    EmailTemplate = EmailTemplate.GoldPurchaseReceipt,
                    EmailData = new {
                        UserName = user?.FullName ?? "Customer",
                        TransactionId = receipt.TransactionId,
                        GoldWeightMg = receipt.GoldWeightMg.ToString(),
                        AmountPaid = (paymentRecord.AmountPaise / 100.0).ToString("F2"),
                        GoldRatePerGm = (receipt.PricePerGmPaise / 100.0).ToString("F2"),
                        GstAmount = (receipt.TotalAmountPaise * 0.03 / 100.0).ToString("F2"), // Simplified GST calc for email UI
                        BonusGoldMg = receipt.BonusGoldMg.ToString(),
                        BonusPercent = receipt.BonusAmountPaise > 0 ? "Bonus Applied" : "0",
                        NewGoldBalanceMg = "Check Portfolio", // Can't easily pull here without a query, will rely on app.
                        TransactionDate = DateTime.UtcNow.ToString("dd MMM yyyy, hh:mm tt")
                    }
                });

                return receipt;
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackAsync();
                _logger.LogError(ex, "Failed to fulfill payment {OrderId}", razorpayOrderId);
                throw;
            }
        }
    }
}
