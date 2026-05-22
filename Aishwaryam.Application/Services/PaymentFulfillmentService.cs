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
        private readonly ILogger<PaymentFulfillmentService> _logger;

        public PaymentFulfillmentService(
            IUnitOfWork unitOfWork,
            IGoldService goldService,
            IWalletService walletService,
            INotificationDispatcher dispatcher,
            IAuthRepository authRepository,
            IBankingRepository bankingRepository,
            ILogger<PaymentFulfillmentService> logger)
        {
            _unitOfWork = unitOfWork;
            _goldService = goldService;
            _walletService = walletService;
            _dispatcher = dispatcher;
            _authRepository = authRepository;
            _bankingRepository = bankingRepository;
            _logger = logger;
        }

        public async Task<GoldTransactionResponse> FulfillPaymentAsync(string razorpayOrderId, string razorpayPaymentId, string source)
        {
            // 1. Double check idempotency
            var isAlreadyProcessed = await _authRepository.IsIdempotencyKeyUsedAsync(razorpayPaymentId);
            if (isAlreadyProcessed)
            {
                _logger.LogInformation("Payment {PaymentId} already fulfilled. Skipping.", razorpayPaymentId);
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
                    throw new Exception($"Payment record not found for OrderId: {razorpayOrderId}");
                }

                if (paymentRecord.Status == "SUCCESS")
                {
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
