using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using Aishwaryam.Application.DTOs.Gold;
using Aishwaryam.Application.DTOs.Wallet;
using Aishwaryam.Application.Interfaces.Repositories;
using Aishwaryam.Application.Interfaces.Services;
using Aishwaryam.Domain.Entities;
using System.Linq;

namespace Aishwaryam.Application.Services
{
    public class GoldService : IGoldService
    {
        private readonly IGoldRepository _goldRepository;
        private readonly IWalletService _walletService;
        private readonly ISchemeRepository _schemeRepository;
        private readonly INotificationService _notificationService;
        private readonly IKycComplianceService _complianceService;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IMemoryCache _cache;
        private readonly IGoldPriceManager _priceManager;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IAuthRepository _authRepository;
        private readonly IEmailService _emailService;

        public GoldService(
            IGoldRepository goldRepository, 
            IWalletService walletService,
            ISchemeRepository schemeRepository,
            INotificationService notificationService,
            IKycComplianceService complianceService,
            IHttpClientFactory httpClientFactory,
            IMemoryCache cache,
            IGoldPriceManager priceManager,
            IUnitOfWork unitOfWork,
            IAuthRepository authRepository,
            IEmailService emailService)
        {
            _goldRepository = goldRepository;
            _walletService = walletService;
            _schemeRepository = schemeRepository;
            _notificationService = notificationService;
            _complianceService = complianceService;
            _httpClientFactory = httpClientFactory;
            _cache = cache;
            _priceManager = priceManager;
            _unitOfWork = unitOfWork;
            _authRepository = authRepository;
            _emailService = emailService;
        }

        public async Task<CurrentGoldPriceResponse> GetCurrentPriceAsync()
        {
            var price = await _priceManager.GetPriceAsync();
            return new CurrentGoldPriceResponse
            {
                BuyPricePaise = (long)(price.BuyPrice * 100),
                SellPricePaise = (long)(price.SellPrice * 100),
                Price24KPaise = (long)(price.Price24K * 100),
                Price22KPaise = (long)(price.Price22K * 100),
                PriceSilverPaise = (long)(price.PriceSilver * 100),
                UpdatedAt = price.Timestamp,
                Source = price.Source,
                IsFallback = price.Source == "StaticFallback"
            };
        }

        public async Task<GoldTransactionResponse> BuyGoldAsync(BuyGoldRequest request)
        {
            await _unitOfWork.BeginTransactionAsync();
            try
            {
                // 1. Get Wallet Balance
                var walletResponse = await _walletService.GetBalanceAsync(request.UserId);
                if (walletResponse.BalancePaise < request.TotalAmountPaise)
                {
                    return new GoldTransactionResponse { Success = false, Message = "Insufficient wallet balance." };
                }

                // 2. Check Price Lock
                long effectiveBuyPricePaise;
                long effectiveSilverPricePaise = 0L;
                DateTimeOffset effectiveUpdatedAt;
                string effectiveSource;
                
                if (!string.IsNullOrEmpty(request.PriceLockId))
                {
                    var lockedPrice = await _priceManager.GetLockedPriceAsync(request.PriceLockId);
                    if (lockedPrice == null)
                        return new GoldTransactionResponse { Success = false, Message = "Price lock expired or invalid." };
                    
                    effectiveBuyPricePaise = (long)(lockedPrice.BuyPrice * 100);
                    effectiveSilverPricePaise = (long)(lockedPrice.PriceSilver * 100);
                    effectiveUpdatedAt = lockedPrice.Timestamp;
                    effectiveSource = "LOCKED_" + lockedPrice.Source;
                }
                else
                {
                    var currentPrice = await GetCurrentPriceAsync();
                    effectiveBuyPricePaise = currentPrice.BuyPricePaise;
                    effectiveSilverPricePaise = currentPrice.PriceSilverPaise;
                    effectiveUpdatedAt = currentPrice.UpdatedAt;
                    effectiveSource = currentPrice.Source;
                }

                // 4. Scheme Bonus (moved up to determine if it is a Silver scheme)
                UserScheme? activeScheme = null;
                if (request.UserSchemeId.HasValue && request.UserSchemeId.Value != Guid.Empty)
                {
                    activeScheme = await _schemeRepository.GetUserSchemeByIdAsync(request.UserSchemeId.Value);
                    if (activeScheme == null)
                    {
                        // Fallback: the provided ID might be a master scheme ID or stale reference.
                        // Try to find the user's active scheme by userId to ensure bonus is calculated.
                        activeScheme = await _schemeRepository.GetActiveUserSchemeAsync(request.UserId);
                    }
                }

                Console.WriteLine($"[LOYALTY_AUDIT] request.UserSchemeId: {request.UserSchemeId}, request.UserId: {request.UserId}");
                if (activeScheme != null)
                {
                    Console.WriteLine($"[LOYALTY_AUDIT] activeScheme found! Id: {activeScheme.Id}, PlanName: {activeScheme.PlanName}, Status: {activeScheme.Status}");
                }
                else
                {
                    Console.WriteLine("[LOYALTY_AUDIT] activeScheme is NULL!");
                }

                bool isSilverScheme = activeScheme != null && activeScheme.PlanName.Contains("silver", StringComparison.OrdinalIgnoreCase);
                long effectiveRate = isSilverScheme 
                    ? (effectiveSilverPricePaise > 0L ? effectiveSilverPricePaise : 9500L) 
                    : effectiveBuyPricePaise;

                Console.WriteLine($"[LOYALTY_AUDIT] isSilverScheme: {isSilverScheme}, effectiveRate: {effectiveRate}");

                // 3. Calculation Logic
                long totalAmountPaise = request.TotalAmountPaise;
                long baseAmountPaise = (totalAmountPaise * 100) / 103;
                long gstAmountPaise = totalAmountPaise - baseAmountPaise;
                long goldWeightMg = (baseAmountPaise * 1000) / effectiveRate;

                Console.WriteLine($"[LOYALTY_AUDIT] baseAmountPaise: {baseAmountPaise}, gstAmountPaise: {gstAmountPaise}, goldWeightMg: {goldWeightMg}");

                if (goldWeightMg <= 0)
                    return new GoldTransactionResponse { Success = false, Message = "Amount too low after GST." };

                decimal bonusPercentage = 0;
                long bonusGoldMg = 0;
                long bonusAmountPaise = 0;
                int schemeDayNumber = 0;

                if (activeScheme != null)
                {
                    schemeDayNumber = (int)(DateTime.UtcNow - activeScheme.CreatedAt).TotalDays;
                    if (schemeDayNumber < 0) schemeDayNumber = 0;

                    var master = await _schemeRepository.GetSchemeMasterByPlanNameAsync(activeScheme.PlanName);
                    Console.WriteLine($"[LOYALTY_AUDIT] master plan found: {master?.PlanName}, id: {master?.Id}");
                    
                    List<SchemeBonusTier>? dbTiers = null;
                    if (master != null)
                    {
                        dbTiers = await _schemeRepository.GetBonusTiersAsync(master.Id);
                    }
                    Console.WriteLine($"[LOYALTY_AUDIT] dbTiers count: {dbTiers?.Count ?? 0}, schemeDayNumber: {schemeDayNumber}");

                    if (dbTiers != null && dbTiers.Count > 0)
                    {
                        var matchingTier = dbTiers.FirstOrDefault(t => schemeDayNumber >= t.StartDay && schemeDayNumber <= t.EndDay);
                        if (matchingTier != null)
                        {
                            bonusPercentage = matchingTier.BonusPercentage;
                        }
                    }
                    else
                    {
                        // Fallback to original hardcoded 330-day scheme rules
                        if (schemeDayNumber <= 75)
                        {
                            bonusPercentage = 7.5m;
                        }
                        else if (schemeDayNumber <= 150)
                        {
                            bonusPercentage = 5.5m;
                        }
                        else if (schemeDayNumber <= 225)
                        {
                            bonusPercentage = 3.5m;
                        }
                        else if (schemeDayNumber <= 330)
                        {
                            bonusPercentage = 1.5m;
                        }
                    }

                    Console.WriteLine($"[LOYALTY_AUDIT] final bonusPercentage: {bonusPercentage}");

                    if (bonusPercentage > 0)
                    {
                        bonusAmountPaise = (long)(totalAmountPaise * (bonusPercentage / 100m));
                        bonusGoldMg = (bonusAmountPaise * 1000) / effectiveRate;
                    }

                    Console.WriteLine($"[LOYALTY_AUDIT] bonusAmountPaise: {bonusAmountPaise}, bonusGoldMg: {bonusGoldMg}");
                }

                long totalGoldCreditedMg = goldWeightMg + bonusGoldMg;

                // 5. Atomic Wallet Debit
                var walletTx = await _walletService.ProcessTransactionAsync(new WalletTransactionRequest
                {
                    UserId = request.UserId,
                    AmountPaise = request.TotalAmountPaise,
                    TransactionType = "DEBIT",
                    ReferenceId = "GOLD_BUY_" + Guid.NewGuid().ToString("N")[..8],
                    Description = $"Bought {goldWeightMg}mg of {(isSilverScheme ? "Silver" : "Gold")}",
                    IpAddress = request.IpAddress,
                    DeviceFingerprint = request.DeviceFingerprint
                });

                // 6. Record Gold Transaction
                var txId = Guid.NewGuid();
                var goldTx = new GoldTransaction
                {
                    Id = txId,
                    UserId = request.UserId,
                    TransactionType = "BUY",
                    GoldWeightMg = goldWeightMg,
                    PricePerGmPaise = effectiveRate,
                    TotalAmountPaise = totalAmountPaise,
                    IpAddress = request.IpAddress,
                    DeviceFingerprint = request.DeviceFingerprint,
                    RateSource = effectiveSource,
                    RateTimestamp = effectiveUpdatedAt,
                    UserSchemeId = activeScheme?.Id,
                    RazorpayPaymentId = request.RazorpayPaymentId,
                    BonusAmountPaise = bonusAmountPaise,
                    BonusGoldMg = bonusGoldMg,
                    Invoice = new Invoice
                    {
                        TransactionId = txId,
                        BaseAmountPaise = baseAmountPaise,
                        GstAmountPaise = gstAmountPaise,
                        TotalAmountPaise = totalAmountPaise,
                        BonusPercentage = bonusPercentage,
                        BonusAmountPaise = bonusAmountPaise,
                        BonusGoldMg = bonusGoldMg
                    }
                };
                await _goldRepository.RecordGoldTransactionAsync(goldTx);

                if (bonusGoldMg > 0)
                {
                    await _goldRepository.RecordGoldTransactionAsync(new GoldTransaction
                    {
                        Id = Guid.NewGuid(),
                        UserId = request.UserId,
                        TransactionType = "BONUS",
                        GoldWeightMg = bonusGoldMg,
                        PricePerGmPaise = effectiveRate,
                        TotalAmountPaise = 0,
                        IpAddress = request.IpAddress,
                        DeviceFingerprint = request.DeviceFingerprint,
                        RateSource = "SCHEME_REWARD",
                        RateTimestamp = effectiveUpdatedAt,
                        UserSchemeId = activeScheme?.Id
                    });
                }

                // 7. Update Scheme and Cache
                if (activeScheme != null)
                {
                    activeScheme.AccumulatedGoldMg += totalGoldCreditedMg;
                    activeScheme.InstallmentsPaid += 1;
                    activeScheme.NextDueDate = activeScheme.PaymentFrequency.ToLower() switch
                    {
                        "daily" => activeScheme.NextDueDate.AddDays(1),
                        "weekly" => activeScheme.NextDueDate.AddDays(7),
                        _ => activeScheme.NextDueDate.AddMonths(1)
                    };
                    activeScheme.UpdatedAt = DateTime.UtcNow;
                    await _schemeRepository.UpdateUserSchemeAsync(activeScheme);

                    // Record regular installment investment ledger record
                    var installmentInv = new SchemeInvestment
                    {
                        Id = Guid.NewGuid(),
                        UserSchemeId = activeScheme.Id,
                        UserId = request.UserId,
                        TransactionType = "INSTALLMENT",
                        InstallmentNumber = activeScheme.InstallmentsPaid,
                        AmountPaise = totalAmountPaise,
                        BaseAmountPaise = baseAmountPaise,
                        GstAmountPaise = gstAmountPaise,
                        GoldWeightMg = goldWeightMg,
                        PricePerGmPaise = effectiveRate,
                        BonusPercentage = bonusPercentage,
                        BonusAmountPaise = bonusAmountPaise,
                        BonusGoldMg = bonusGoldMg,
                        RazorpayPaymentId = request.RazorpayPaymentId,
                        Status = "COMPLETED",
                        CreatedAt = DateTime.UtcNow
                    };
                    await _schemeRepository.RecordSchemeInvestmentAsync(installmentInv);

                    if (bonusGoldMg > 0)
                    {
                        // Record separate BONUS transaction entry
                        var bonusInv = new SchemeInvestment
                        {
                            Id = Guid.NewGuid(),
                            UserSchemeId = activeScheme.Id,
                            UserId = request.UserId,
                            TransactionType = "BONUS",
                            InstallmentNumber = activeScheme.InstallmentsPaid,
                            AmountPaise = 0,
                            BaseAmountPaise = 0,
                            GstAmountPaise = 0,
                            GoldWeightMg = bonusGoldMg,
                            PricePerGmPaise = effectiveRate,
                            BonusPercentage = bonusPercentage,
                            BonusAmountPaise = bonusAmountPaise,
                            BonusGoldMg = bonusGoldMg,
                            RazorpayPaymentId = request.RazorpayPaymentId,
                            Status = "COMPLETED",
                            CreatedAt = DateTime.UtcNow
                        };
                        await _schemeRepository.RecordSchemeInvestmentAsync(bonusInv);
                    }
                }

                // 7.5 Apply promotional/event offer bonus if this is a direct buy (no scheme)
                long promotionalBonusGoldMg = 0;
                long promotionalBonusAmountPaise = 0;
                
                if (activeScheme == null)
                {
                    var activeEventOffer = await _goldRepository.GetActiveEventOfferAsync(request.UserId);

                    if (activeEventOffer != null)
                    {
                        var alreadyClaimed = await _goldRepository.IsOfferClaimedAsync(request.UserId, activeEventOffer.Id);

                        if (!alreadyClaimed && request.TotalAmountPaise >= activeEventOffer.MinPurchaseAmountPaise)
                        {
                            if (activeEventOffer.BonusGoldMg > 0)
                            {
                                // Flat Gold Weight Offer (e.g. 5 grams free)
                                promotionalBonusGoldMg = activeEventOffer.BonusGoldMg;
                                promotionalBonusAmountPaise = (promotionalBonusGoldMg * effectiveBuyPricePaise) / 1000;
                            }
                            else if (activeEventOffer.BonusPercent > 0)
                            {
                                // Percentage-based Offer
                                promotionalBonusAmountPaise = (long)(request.TotalAmountPaise * (double)(activeEventOffer.BonusPercent / 100m));
                                var bonusBaseAmountPaise = (promotionalBonusAmountPaise * 100) / 103;
                                promotionalBonusGoldMg = (bonusBaseAmountPaise * 1000) / effectiveBuyPricePaise;
                            }

                            if (promotionalBonusGoldMg > 0)
                            {
                                await _goldRepository.IncrementBonusGoldBalanceAsync(request.UserId, promotionalBonusGoldMg);

                                await _goldRepository.RecordGoldTransactionAsync(new GoldTransaction
                                {
                                    Id = Guid.NewGuid(),
                                    UserId = request.UserId,
                                    TransactionType = "EVENT_BONUS",
                                    GoldWeightMg = promotionalBonusGoldMg,
                                    PricePerGmPaise = effectiveBuyPricePaise,
                                    TotalAmountPaise = 0,
                                    IpAddress = request.IpAddress,
                                    DeviceFingerprint = request.DeviceFingerprint,
                                    RateSource = $"{activeEventOffer.OfferType}_OFFER",
                                    RateTimestamp = DateTimeOffset.UtcNow,
                                    BonusAmountPaise = promotionalBonusAmountPaise,
                                    BonusGoldMg = promotionalBonusGoldMg,
                                    CreatedAt = DateTime.UtcNow
                                });

                                await _goldRepository.RecordClaimedOfferAsync(new UserClaimedOffer
                                {
                                    OfferId = activeEventOffer.Id,
                                    UserId = request.UserId,
                                    ClaimedAt = DateTime.UtcNow
                                });

                                await _goldRepository.RecordAuditLogAsync(new PlatformAuditLog
                                {
                                    UserId = request.UserId,
                                    Action = $"{activeEventOffer.OfferType}_BONUS_CREDITED",
                                    Details = $"{activeEventOffer.BonusPercent}% bonus = ₹{promotionalBonusAmountPaise / 100.0:F2} → {promotionalBonusGoldMg}mg bonus gold credited (separate balance)",
                                    IpAddress = request.IpAddress ?? "SYSTEM",
                                    Status = "SUCCESS"
                                });

                                try
                                {
                                    await _notificationService.SendNotificationAsync(request.UserId,
                                        $"🎁 {activeEventOffer.BonusPercent}% Bonus Gold Credited!",
                                        $"You received {promotionalBonusGoldMg / 1000.0:F4}g of bonus gold from your {activeEventOffer.OfferType.ToLower()} offer!",
                                        "OFFER_BONUS_CREDITED");
                                }
                                catch { }
                            }
                        }
                    }
                }

                // Check if referee has any pending referral event to credit rewards on their FIRST gold purchase
                var isFirstGoldPurchase = !await _goldRepository.HasAnyBuyTransactionAsync(request.UserId, txId);
                if (isFirstGoldPurchase)
                {
                    var pendingReferral = await _goldRepository.GetPendingReferralEventAsync(request.UserId);
                    if (pendingReferral != null)
                    {
                        var config = await _goldRepository.GetAppConfigAsync() ?? new AppConfig();
                        
                        // Fetch referee (friend) name
                        var refereeUser = await _authRepository.GetUserByIdAsync(request.UserId);
                        var refereeName = refereeUser?.FullName ?? "Friend";

                        // 1. Credit Referrer
                        var referrerTx = new GoldTransaction
                        {
                            Id = Guid.NewGuid(),
                            UserId = pendingReferral.ReferrerUserId,
                            TransactionType = "EVENT_BONUS",
                            GoldWeightMg = config.ReferrerRewardMg,
                            PricePerGmPaise = effectiveBuyPricePaise,
                            TotalAmountPaise = 0,
                            IpAddress = request.IpAddress ?? "127.0.0.1",
                            DeviceFingerprint = "REFERRAL",
                            RateSource = $"REFERRAL_BONUS:{refereeName}",
                            RateTimestamp = DateTimeOffset.UtcNow,
                            BonusAmountPaise = 0,
                            BonusGoldMg = config.ReferrerRewardMg,
                            CreatedAt = DateTime.UtcNow
                        };
                        await _goldRepository.IncrementBonusGoldBalanceAsync(pendingReferral.ReferrerUserId, config.ReferrerRewardMg);
                        await _goldRepository.RecordGoldTransactionAsync(referrerTx);

                        // Recalculate referrer balance and update cache
                        long referrerBal = await _goldRepository.CalculateGoldBalanceAsync(pendingReferral.ReferrerUserId);
                        await _goldRepository.UpdateGoldCacheAsync(pendingReferral.ReferrerUserId, referrerBal);

                        // 2. Credit Referee
                        var refereeTx = new GoldTransaction
                        {
                            Id = Guid.NewGuid(),
                            UserId = request.UserId,
                            TransactionType = "EVENT_BONUS",
                            GoldWeightMg = config.RefereeRewardMg,
                            PricePerGmPaise = effectiveBuyPricePaise,
                            TotalAmountPaise = 0,
                            IpAddress = request.IpAddress ?? "127.0.0.1",
                            DeviceFingerprint = "REFERRAL",
                            RateSource = "REFERRAL_SIGNUP",
                            RateTimestamp = DateTimeOffset.UtcNow,
                            BonusAmountPaise = 0,
                            BonusGoldMg = config.RefereeRewardMg,
                            CreatedAt = DateTime.UtcNow
                        };
                        await _goldRepository.IncrementBonusGoldBalanceAsync(request.UserId, config.RefereeRewardMg);
                        await _goldRepository.RecordGoldTransactionAsync(refereeTx);

                        // 3. Mark Referral Event as Awarded
                        pendingReferral.RewardStatus = "Awarded";
                        pendingReferral.BonusAwardedMg = config.ReferrerRewardMg;
                        await _goldRepository.UpdateReferralEventAsync(pendingReferral);

                        // 4. Notifications
                        try
                        {
                            await _notificationService.SendNotificationAsync(pendingReferral.ReferrerUserId,
                                "Referral Reward! 🎁",
                                $"Congratulations! Your friend {refereeName} made their first gold purchase. You earned {config.ReferrerRewardMg}mg of bonus gold!",
                                "REFERRAL_BONUS");

                            await _notificationService.SendNotificationAsync(request.UserId,
                                "Referral Reward! 🎁",
                                $"Welcome to Aishwaryam! You earned {config.RefereeRewardMg}mg of bonus gold for making your first gold purchase under a referral code.",
                                "REFERRAL_BONUS");
                        }
                        catch { }
                    }
                }

                long updatedGoldBalance = await _goldRepository.CalculateGoldBalanceAsync(request.UserId);
                await _goldRepository.UpdateGoldCacheAsync(request.UserId, updatedGoldBalance);

                await _unitOfWork.CommitAsync();

                await _notificationService.SendNotificationAsync(request.UserId, 
                    isSilverScheme ? "Silver Purchased! ✨" : "Gold Purchased! ✨", 
                    $"Successfully purchased {(goldWeightMg / 1000.0):F4}g of {(isSilverScheme ? "silver" : "gold")}.", 
                    isSilverScheme ? "SILVER_BUY" : "GOLD_BUY");

                if (!request.SkipEmail)
                {
                    try
                    {
                        var user = await _authRepository.GetUserByIdAsync(request.UserId);
                        if (user != null && !string.IsNullOrEmpty(user.Email))
                        {
                            var bUrl = request.BaseUrl;
                            if (string.IsNullOrEmpty(bUrl))
                            {
                                bUrl = "https://aishwaryam.blazewing.in/";
                            }
                            if (!bUrl.EndsWith("/"))
                            {
                                bUrl += "/";
                            }
                            var downloadUrl = $"{bUrl}api/Gold/receipt/download/{txId}";

                            var receiptData = new
                            {
                                UserName = user.FullName ?? "Customer",
                                TransactionId = txId.ToString(),
                                GoldWeightMg = (totalGoldCreditedMg + promotionalBonusGoldMg).ToString(),
                                AmountPaid = (totalAmountPaise / 100.0).ToString("F2"),
                                GoldRatePerGm = (effectiveRate / 100.0).ToString("F2"),
                                GstAmount = (gstAmountPaise / 100.0).ToString("F2"),
                                BonusGoldMg = (bonusGoldMg + promotionalBonusGoldMg).ToString(),
                                BonusPercent = (bonusPercentage + (activeScheme == null && promotionalBonusGoldMg > 0 ? (promotionalBonusAmountPaise * 100m / totalAmountPaise) : 0m)).ToString("F1"),
                                NewGoldBalanceMg = updatedGoldBalance.ToString(),
                                TransactionDate = DateTime.UtcNow.ToString("dd MMM yyyy, hh:mm tt"),
                                MetalType = isSilverScheme ? "Silver" : "Gold",
                                DownloadUrl = downloadUrl
                            };
                            await _emailService.SendTemplatedAsync(user.Email, user.FullName ?? "Customer", EmailTemplate.GoldPurchaseReceipt, receiptData);
                        }
                    }
                    catch { /* ignore email error */ }
                }

                var status = await _goldRepository.GetGoldStatusAsync(request.UserId);
                return new GoldTransactionResponse
                {
                    Success = true,
                    TransactionId = txId.ToString(),
                    GoldWeightMg = goldWeightMg,
                    PricePerGmPaise = effectiveRate,
                    TotalAmountPaise = totalAmountPaise,
                    BaseAmountPaise = baseAmountPaise,
                    GstAmountPaise = gstAmountPaise,
                    BonusPercentage = (decimal)bonusPercentage + (activeScheme == null && promotionalBonusGoldMg > 0 ? (promotionalBonusAmountPaise * 100m / totalAmountPaise) : 0m),
                    BonusGoldMg = bonusGoldMg + promotionalBonusGoldMg,
                    BonusAmountPaise = bonusAmountPaise + promotionalBonusAmountPaise,
                    TotalGoldCreditedMg = goldWeightMg + bonusGoldMg + promotionalBonusGoldMg,
                    NewWalletBalancePaise = walletTx.BalancePaise,
                    NewGoldBalanceMg = updatedGoldBalance,
                    LockedGoldMg = status.LockedMg,
                    RedeemableGoldMg = status.RedeemableMg
                };
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackAsync();
                throw;
            }
        }

        public async Task<GoldTransactionResponse> SellGoldAsync(SellGoldRequest request)
        {
            await _unitOfWork.BeginTransactionAsync();
            try
            {
                // 1. Check Limits & Compliance
                var status = await _goldRepository.GetGoldStatusAsync(request.UserId);
                if (status.RedeemableMg < request.GoldWeightMg)
                {
                    return new GoldTransactionResponse { Success = false, Message = "Insufficient redeemable gold." };
                }

                var compliance = await _complianceService.ValidateRedemptionAsync(request.UserId, request.GoldWeightMg, "CASH_OUT");
                if (!compliance.IsAllowed)
                {
                    return new GoldTransactionResponse { Success = false, Message = compliance.Message };
                }

                // 2. Pricing Logic
                long effectiveSellPricePaise;
                DateTimeOffset effectiveUpdatedAt;
                string effectiveSource;
                
                if (!string.IsNullOrEmpty(request.PriceLockId))
                {
                    var lockedPrice = await _priceManager.GetLockedPriceAsync(request.PriceLockId);
                    if (lockedPrice == null)
                        return new GoldTransactionResponse { Success = false, Message = "Price lock expired or invalid." };
                    
                    effectiveSellPricePaise = (long)(lockedPrice.SellPrice * 100);
                    effectiveUpdatedAt = lockedPrice.Timestamp;
                    effectiveSource = "LOCKED_" + lockedPrice.Source;
                }
                else
                {
                    var currentPrice = await GetCurrentPriceAsync();
                    effectiveSellPricePaise = currentPrice.SellPricePaise;
                    effectiveUpdatedAt = currentPrice.UpdatedAt;
                    effectiveSource = currentPrice.Source;
                }

                long totalAmountPaise = (request.GoldWeightMg * effectiveSellPricePaise) / 1000;

                // 3. Record Gold De-listing (Atomic)
                var goldTx = new GoldTransaction
                {
                    Id = Guid.NewGuid(),
                    UserId = request.UserId,
                    TransactionType = "SELL",
                    GoldWeightMg = request.GoldWeightMg,
                    PricePerGmPaise = effectiveSellPricePaise,
                    TotalAmountPaise = totalAmountPaise,
                    IpAddress = request.IpAddress,
                    DeviceFingerprint = request.DeviceFingerprint,
                    RateSource = effectiveSource,
                    RateTimestamp = effectiveUpdatedAt
                };
                await _goldRepository.RecordGoldTransactionAsync(goldTx);

                // 4. Credit Wallet
                var walletTx = await _walletService.ProcessTransactionAsync(new WalletTransactionRequest
                {
                    UserId = request.UserId,
                    AmountPaise = totalAmountPaise,
                    TransactionType = "CREDIT",
                    ReferenceId = "GOLD_SELL_" + Guid.NewGuid().ToString("N")[..8],
                    Description = $"Sold {request.GoldWeightMg}mg of Gold",
                    IpAddress = request.IpAddress,
                    DeviceFingerprint = request.DeviceFingerprint
                });

                // 5. Update Balance Cache
                long updatedGoldBalance = await _goldRepository.CalculateGoldBalanceAsync(request.UserId);
                await _goldRepository.UpdateGoldCacheAsync(request.UserId, updatedGoldBalance);

                await _unitOfWork.CommitAsync();

                await _notificationService.SendNotificationAsync(request.UserId, "Gold Sold! 💰", $"Successfully sold {(request.GoldWeightMg / 1000.0):F4}g of gold.", "GOLD_SELL");

                try
                {
                    var user = await _authRepository.GetUserByIdAsync(request.UserId);
                    if (user != null && !string.IsNullOrEmpty(user.Email))
                    {
                        var receiptData = new
                        {
                            UserName = user.FullName ?? "Customer",
                            AmountPaise = totalAmountPaise,
                            GoldWeightMg = request.GoldWeightMg,
                            TransactionId = goldTx.Id.ToString(),
                            Date = DateTime.UtcNow.ToString("dd MMM yyyy, hh:mm tt")
                        };
                        await _emailService.SendTemplatedAsync(user.Email, user.FullName ?? "Customer", EmailTemplate.GoldRedeemed, receiptData);
                    }
                }
                catch { /* ignore email error */ }

                var newStatus = await _goldRepository.GetGoldStatusAsync(request.UserId);
                return new GoldTransactionResponse
                {
                    Success = true,
                    TransactionId = goldTx.Id.ToString(),
                    GoldWeightMg = request.GoldWeightMg,
                    PricePerGmPaise = effectiveSellPricePaise,
                    TotalAmountPaise = totalAmountPaise,
                    NewWalletBalancePaise = walletTx.BalancePaise,
                    NewGoldBalanceMg = updatedGoldBalance,
                    RedeemableGoldMg = newStatus.RedeemableMg
                };
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackAsync();
                throw;
            }
        }

        public async Task<(long LockedMg, long MaturedRedeemableMg, long RedeemableMg, long RedeemedMg)> GetGoldStatusAsync(Guid userId)
        {
            return await _goldRepository.GetGoldStatusAsync(userId);
        }

        public class MetalPriceApiResponse
        {
            public bool Success { get; set; }
            public MetalPriceRates Rates { get; set; }
        }

        public class MetalPriceRates
        {
            public decimal INR { get; set; }
            public decimal USDINR { get; set; }
            public decimal USDXAU { get; set; }
            public decimal XAU { get; set; }
        }
    }
}
