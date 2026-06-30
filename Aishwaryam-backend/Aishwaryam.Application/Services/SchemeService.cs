using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Aishwaryam.Application.Interfaces.Repositories;
using Aishwaryam.Application.Interfaces.Services;
using Aishwaryam.Domain.Entities;
using Aishwaryam.Application.DTOs.Gold;
using Aishwaryam.Application.DTOs.Wallet;
using Microsoft.Extensions.Logging;

namespace Aishwaryam.Application.Services
{
    public class SchemeService : ISchemeService
    {
        private readonly ISchemeRepository _schemeRepository;
        private readonly IGoldRepository _goldRepository;
        private readonly INotificationService _notificationService;
        private readonly IGoldService _goldService;
        private readonly IKycComplianceService _complianceService;
        private readonly IAuthRepository _authRepository;
        private readonly INotificationDispatcher _dispatcher;
        private readonly IWalletService _walletService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<SchemeService> _logger;

        public SchemeService(
            ISchemeRepository schemeRepository,
            IGoldRepository goldRepository,
            INotificationService notificationService,
            IGoldService goldService,
            IKycComplianceService complianceService,
            IAuthRepository authRepository,
            INotificationDispatcher dispatcher,
            IWalletService walletService,
            IUnitOfWork unitOfWork,
            ILogger<SchemeService> logger)
        {
            _schemeRepository = schemeRepository;
            _goldRepository = goldRepository;
            _notificationService = notificationService;
            _goldService = goldService;
            _complianceService = complianceService;
            _authRepository = authRepository;
            _dispatcher = dispatcher;
            _walletService = walletService;
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<IEnumerable<SchemeMaster>> GetAvailableSchemesAsync()
        {
            return await _schemeRepository.GetAvailableSchemesAsync();
        }

        public async Task<object> GetUserSchemeDashboardAsync(Guid userId)
        {
            var activeSchemes = await _schemeRepository.GetActiveUserSchemesAsync(userId);
            
            // Real-time automatic maturity check for all schemes
            foreach (var s in activeSchemes.Where(sch => sch.Status == "Active"))
            {
                if (s.MaturityDate <= DateTime.UtcNow)
                {
                    s.Status = "Matured";
                    s.UpdatedAt = DateTime.UtcNow;
                    await _schemeRepository.UpdateUserSchemeAsync(s);
                    
                    var user = await _authRepository.GetUserByIdAsync(s.UserId);
                    if (user != null)
                    {
                        var goldGrams = mgToGrams(s.AccumulatedGoldMg);
                        var summary = await _schemeRepository.GetSchemeSavingsSummaryAsync(s.Id);
                        
                        await _dispatcher.DispatchAsync(new NotificationPayload
                        {
                            UserId = s.UserId,
                            ToPhone = user.PhoneNumber,
                            ToEmail = user.Email,
                            ToName = user.FullName,
                            Title = "Scheme Matured! 🎉",
                            Body = $"Congratulations! Your scheme '{s.PlanName}' has matured. {goldGrams} of gold is now unlocked and ready for redemption.",
                            Type = "SCHEME_MATURITY",
                            SendPush = true,
                            PushData = new Dictionary<string, string>
                            {
                                { "screen", "scheme_detail" },
                                { "entityId", s.Id.ToString() }
                            },
                            SendSms = true,
                            SmsText = $"Aishwaryam: Your scheme '{s.PlanName}' has matured! Total gold accumulated: {goldGrams}.",
                            SendEmail = true,
                            EmailTemplate = EmailTemplate.SchemeMatured,
                            EmailData = new
                            {
                                UserName = user.FullName ?? "Customer",
                                PlanName = s.PlanName,
                                TotalGoldMg = s.AccumulatedGoldMg.ToString(),
                                TotalBonusMg = summary.TotalBonusGoldMg.ToString(),
                                TotalDays = "330",
                                MaturityDate = s.MaturityDate.ToString("dd MMM yyyy")
                            }
                        });
                    }
                }
            }

            var (lockedMg, maturedMg, redeemableMg, redeemedMg) = await _goldRepository.GetGoldStatusAsync(userId);

            var activeSchemesList = new List<object>();
            foreach (var activeScheme in activeSchemes)
            {
                var (totalSavings, totalBonusEarned, totalBonusGoldMg) = await _schemeRepository.GetSchemeSavingsSummaryAsync(activeScheme.Id);
                var (currentBonusPercent, remainingDaysForCurrentTier, remainingDaysForScheme, _) = await GetDynamicBonusDetailsAsync(
                    activeScheme.PlanName, activeScheme.CreatedAt, activeScheme.MaturityDate
                );
                int dayNumber = (int)(DateTime.UtcNow - activeScheme.CreatedAt).TotalDays;
                if (dayNumber < 0) dayNumber = 0;

                activeSchemesList.Add(new
                {
                    SchemeId = activeScheme.Id,
                    PlanName = activeScheme.PlanName,
                    AutoPayEnabled = activeScheme.AutoPayEnabled,
                    Frequency = activeScheme.PaymentFrequency,
                    InstallmentsPaid = activeScheme.InstallmentsPaid,
                    TotalInstallments = activeScheme.TotalInstallments,
                    InstallmentAmountPaise = activeScheme.InstallmentAmountPaise,
                    TotalInvestmentPaise = totalSavings,
                    RemainingInvestmentPaise = (activeScheme.TotalInstallments - activeScheme.InstallmentsPaid) * activeScheme.InstallmentAmountPaise,
                    RemainingInstallments = activeScheme.TotalInstallments - activeScheme.InstallmentsPaid,
                    NextDueDate = activeScheme.NextDueDate,
                    MaturityDate = activeScheme.MaturityDate,
                    AccumulatedGoldMg = activeScheme.AccumulatedGoldMg,
                    JoinedAt = activeScheme.CreatedAt,
                    Status = activeScheme.Status,
                    TotalSavingsAddedPaise = totalSavings,
                    TotalBonusEarnedPaise = totalBonusEarned,
                    TotalBonusGoldMg = totalBonusGoldMg,
                    SchemeDayNumber = dayNumber,
                    CurrentBonusTierPercent = (double)currentBonusPercent,
                    RemainingDaysForCurrentTier = remainingDaysForCurrentTier,
                    RemainingDaysForScheme = remainingDaysForScheme,
                    IsJoinFormCompleted = activeScheme.IsJoinFormCompleted,
                    SubmittedFormDetails = activeScheme.SubmittedFormDetails
                });
            }

            var primary = activeSchemes.FirstOrDefault();
            if (primary == null)
            {
                return new
                {
                    HasActiveScheme = false,
                    ActiveSchemes = activeSchemesList,
                    LockedGoldMg = lockedMg,
                    MaturedRedeemableGoldMg = maturedMg,
                    RedeemableGoldMg = redeemableMg,
                    RedeemedGoldMg = redeemedMg
                };
            }

            // Extract primary details for backward compatibility
            var (primaryTotalSavings, primaryTotalBonusEarned, primaryTotalBonusGoldMg) = await _schemeRepository.GetSchemeSavingsSummaryAsync(primary.Id);
            var (primaryCurrentBonusPercent, primaryRemainingDaysForCurrentTier, primaryRemainingDaysForScheme, _) = await GetDynamicBonusDetailsAsync(
                primary.PlanName, primary.CreatedAt, primary.MaturityDate
            );
            int primaryDayNumber = (int)(DateTime.UtcNow - primary.CreatedAt).TotalDays;
            if (primaryDayNumber < 0) primaryDayNumber = 0;

            return new
            {
                HasActiveScheme = true,
                ActiveSchemes = activeSchemesList,
                SchemeId = primary.Id,
                PlanName = primary.PlanName,
                AutoPayEnabled = primary.AutoPayEnabled,
                Frequency = primary.PaymentFrequency,
                InstallmentsPaid = primary.InstallmentsPaid,
                TotalInstallments = primary.TotalInstallments,
                InstallmentAmountPaise = primary.InstallmentAmountPaise,
                TotalInvestmentPaise = primaryTotalSavings,
                RemainingInvestmentPaise = (primary.TotalInstallments - primary.InstallmentsPaid) * primary.InstallmentAmountPaise,
                RemainingInstallments = primary.TotalInstallments - primary.InstallmentsPaid,
                NextDueDate = primary.NextDueDate,
                MaturityDate = primary.MaturityDate,
                AccumulatedGoldMg = primary.AccumulatedGoldMg,
                LockedGoldMg = lockedMg,
                MaturedRedeemableGoldMg = maturedMg,
                RedeemableGoldMg = redeemableMg,
                RedeemedGoldMg = redeemedMg,
                JoinedAt = primary.CreatedAt,
                Status = primary.Status,
                TotalSavingsAddedPaise = primaryTotalSavings,
                TotalBonusEarnedPaise = primaryTotalBonusEarned,
                TotalBonusGoldMg = primaryTotalBonusGoldMg,
                SchemeDayNumber = primaryDayNumber,
                CurrentBonusTierPercent = (double)primaryCurrentBonusPercent,
                RemainingDaysForCurrentTier = primaryRemainingDaysForCurrentTier,
                RemainingDaysForScheme = primaryRemainingDaysForScheme,
                IsJoinFormCompleted = primary.IsJoinFormCompleted,
                SubmittedFormDetails = primary.SubmittedFormDetails
            };
        }

        public async Task<object> JoinSchemeAsync(
            Guid userId, 
            Guid schemeMasterId, 
            string? nomineeName = null, 
            string? nomineePhone = null, 
            string? nomineeRelationship = null, 
            string? state = null, 
            string? city = null, 
            string? streetAddress = null, 
            string? pincode = null)
        {
            var master = await _schemeRepository.GetSchemeMasterByIdAsync(schemeMasterId);
            if (master == null) return new { Success = false, Message = "Scheme plan not found." };

            var existingSchemes = await _schemeRepository.GetActiveUserSchemesAsync(userId);
            if (existingSchemes.Any(s => s.PlanName == master.PlanName && s.Status == "Active"))
            {
                return new { Success = false, Message = $"Already enrolled in an active '{master.PlanName}' scheme." };
            }

            string? submittedFormDetailsJson = null;
            if (!string.IsNullOrEmpty(nomineeName) || !string.IsNullOrEmpty(streetAddress))
            {
                var formDetails = new Dictionary<string, string?>();
                if (!string.IsNullOrEmpty(nomineeName)) formDetails["nomineeName"] = nomineeName;
                if (!string.IsNullOrEmpty(nomineePhone)) formDetails["nomineePhone"] = nomineePhone;
                if (!string.IsNullOrEmpty(nomineeRelationship)) formDetails["nomineeRelationship"] = nomineeRelationship;
                if (!string.IsNullOrEmpty(state)) formDetails["state"] = state;
                if (!string.IsNullOrEmpty(city)) formDetails["city"] = city;
                if (!string.IsNullOrEmpty(streetAddress)) formDetails["streetAddress"] = streetAddress;
                if (!string.IsNullOrEmpty(pincode)) formDetails["pincode"] = pincode;

                submittedFormDetailsJson = System.Text.Json.JsonSerializer.Serialize(formDetails);
            }

            var user = await _authRepository.GetUserByIdAsync(userId);
            if (user != null)
            {
                bool userUpdated = false;
                if (!string.IsNullOrEmpty(nomineeName))
                {
                    user.NomineeName = nomineeName;
                    user.NomineePhoneNumber = nomineePhone;
                    user.NomineeRelationship = nomineeRelationship;
                    userUpdated = true;
                }

                if (userUpdated)
                {
                    await _authRepository.UpdateUserAsync(user);
                }

                if (!string.IsNullOrEmpty(streetAddress) && !string.IsNullOrEmpty(city) && !string.IsNullOrEmpty(state) && !string.IsNullOrEmpty(pincode))
                {
                    var existingDefaultAddress = await _schemeRepository.GetUserDefaultAddressAsync(userId);
                    if (existingDefaultAddress == null)
                    {
                        var newAddress = new Address
                        {
                            UserId = userId,
                            StreetAddress = streetAddress,
                            City = city,
                            State = state,
                            Pincode = pincode,
                            IsDefault = true,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };
                        await _schemeRepository.AddUserAddressAsync(newAddress);
                    }
                }
            }

            DateTime maturityDate = CalculateMaturityDate(master.Frequency, master.TotalInstallments, master.DurationUnit);
            if (master.PlanName.ToLower().Contains("testing"))
            {
                maturityDate = DateTime.UtcNow.AddMinutes(5);
            }

            var userScheme = new UserScheme
            {
                UserId = userId,
                PlanName = master.PlanName,
                PaymentFrequency = master.Frequency ?? "Monthly",
                InstallmentAmountPaise = master.InstallmentAmountPaise,
                TotalInstallments = master.TotalInstallments,
                InstallmentsPaid = 0, // Set to 0! Payment verifier will fulfill payment and advance it to 1
                NextDueDate = DateTime.UtcNow, // Due immediately for the first installment payment!
                MaturityDate = maturityDate,
                Status = "Active",
                SchemeMasterId = schemeMasterId,
                SubmittedFormDetails = submittedFormDetailsJson,
                IsJoinFormCompleted = !string.IsNullOrEmpty(nomineeName)
            };

            await _schemeRepository.JoinSchemeAsync(userScheme);

            if (user != null)
            {
                var installmentAmountFormatted = (master.InstallmentAmountPaise / 100.0).ToString("N0");
                var maturityDateFormatted = userScheme.MaturityDate.ToString("dd MMM yyyy");
                var firstInstallmentAmountFormatted = (master.InstallmentAmountPaise / 100.0).ToString("N0");
                
                await _dispatcher.DispatchAsync(new NotificationPayload
                {
                    UserId = userId,
                    ToPhone = user.PhoneNumber,
                    ToEmail = user.Email,
                    ToName = user.FullName,
                    Title = "Joined Scheme successfully! 🏆",
                    Body = $"Welcome to your new gold scheme: {master.PlanName}. Accumulate gold periodically and unlock bonuses!",
                    Type = "SCHEME_JOINED",
                    SendPush = true,
                    PushData = new Dictionary<string, string>
                    {
                        { "screen", "scheme_detail" },
                        { "entityId", userScheme.Id.ToString() }
                    },
                    SendSms = true,
                    SmsText = $"Aishwaryam: You successfully joined the scheme {master.PlanName}!",
                    SendEmail = true,
                    EmailTemplate = EmailTemplate.SchemeJoined,
                    EmailData = new
                    {
                        UserName = user.FullName ?? "Customer",
                        PlanName = master.PlanName,
                        InstallmentAmount = installmentAmountFormatted,
                        TotalInstallments = master.TotalInstallments.ToString(),
                        MaturityDate = maturityDateFormatted,
                        MaxBonus = "7.5",
                        FirstInstallmentAmount = firstInstallmentAmountFormatted
                    }
                });
            }

            return new { Success = true, SchemeId = userScheme.Id, MaturityDate = userScheme.MaturityDate };
        }

        public async Task<bool> ToggleAutoPayAsync(Guid userId, Guid schemeId, bool enableAutoPay)
        {
            var scheme = await _schemeRepository.GetActiveUserSchemeAsync(userId);
            if (scheme == null || scheme.Id != schemeId) return false;

            scheme.AutoPayEnabled = enableAutoPay;
            await _schemeRepository.UpdateUserSchemeAsync(scheme);
            return true;
        }

        public async Task<(IEnumerable<object> Enrollments, int Total)> GetAllEnrollmentsAsync(int page, int pageSize)
        {
            var (enrollments, total) = await _schemeRepository.GetEnrollmentsPaginatedAsync(page, pageSize);
            
            var resultList = new List<object>();
            foreach (var s in enrollments)
            {
                var (totalSavings, totalBonusEarned, totalBonusGoldMg) = await _schemeRepository.GetSchemeSavingsSummaryAsync(s.Id);
                resultList.Add(new {
                    id = s.Id.ToString(),
                    userId = s.UserId.ToString(),
                    userName = s.User?.FullName ?? "Customer",
                    userPhone = s.User?.PhoneNumber ?? string.Empty,
                    userEmail = s.User?.Email ?? string.Empty,
                    planName = s.PlanName,
                    installmentAmountPaise = s.InstallmentAmountPaise,
                    installmentsPaid = s.InstallmentsPaid,
                    totalInstallments = s.TotalInstallments,
                    accumulatedGoldMg = s.AccumulatedGoldMg,
                    status = s.Status,
                    createdAt = s.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    maturityDate = s.MaturityDate.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    schemeMasterId = s.SchemeMasterId?.ToString() ?? string.Empty,
                    submittedFormDetails = s.SubmittedFormDetails ?? string.Empty,
                    isJoinFormCompleted = s.IsJoinFormCompleted,
                    formSubmittedAt = s.FormSubmittedAt?.ToString("yyyy-MM-ddTHH:mm:ssZ") ?? string.Empty,
                    totalInvestmentPaise = totalSavings,
                    totalBonusGoldMg = totalBonusGoldMg,
                    totalBonusEarnedPaise = totalBonusEarned
                });
            }

            return (resultList, total);
        }

        public async Task ProcessMaturityAsync()
        {
            _logger.LogInformation("Starting Maturity Processing Job...");
            var pendingSchemes = await _schemeRepository.GetSchemesPendingMaturityAsync();
            
            foreach (var scheme in pendingSchemes)
            {
                _logger.LogInformation($"Processing maturity for Scheme: {scheme.Id}, User: {scheme.UserId}");
                scheme.Status = "Matured";
                scheme.UpdatedAt = DateTime.UtcNow;
                await _schemeRepository.UpdateUserSchemeAsync(scheme);
                
                var user = await _authRepository.GetUserByIdAsync(scheme.UserId);
                if (user != null)
                {
                    var goldGrams = mgToGrams(scheme.AccumulatedGoldMg);
                    var summary = await _schemeRepository.GetSchemeSavingsSummaryAsync(scheme.Id);
                    
                    await _dispatcher.DispatchAsync(new NotificationPayload
                    {
                        UserId = scheme.UserId,
                        ToPhone = user.PhoneNumber,
                        ToEmail = user.Email,
                        ToName = user.FullName,
                        Title = "Scheme Matured! 🎉",
                        Body = $"Congratulations! Your scheme '{scheme.PlanName}' has matured. {goldGrams} of gold is now unlocked and ready for redemption.",
                        Type = "SCHEME_MATURITY",
                        SendPush = true,
                        PushData = new Dictionary<string, string>
                        {
                            { "screen", "scheme_detail" },
                            { "entityId", scheme.Id.ToString() }
                        },
                        SendSms = true,
                        SmsText = $"Aishwaryam: Your scheme '{scheme.PlanName}' has matured! Total gold accumulated: {goldGrams}.",
                        SendEmail = true,
                        EmailTemplate = EmailTemplate.SchemeMatured,
                        EmailData = new
                        {
                            UserName = user.FullName ?? "Customer",
                            PlanName = scheme.PlanName,
                            TotalGoldMg = scheme.AccumulatedGoldMg.ToString(),
                            TotalBonusMg = summary.TotalBonusGoldMg.ToString(),
                            TotalDays = "330",
                            MaturityDate = scheme.MaturityDate.ToString("dd MMM yyyy")
                        }
                    });
                }

                _logger.LogInformation($"Scheme {scheme.Id} marked as MATURED. Gold {scheme.AccumulatedGoldMg}mg is now unlocked.");
            }

            // ────────────────────────────────────────────────────────────────────────
            // PROCESS ACTIVE SCHEMES MILESTONE LOYALTY BONUSES
            // ────────────────────────────────────────────────────────────────────────
            // Milestone Loyalty Bonuses are disabled to avoid double crediting.
            // Bonuses are calculated and credited immediately upon each individual purchase in GoldService.BuyGoldAsync.
            _logger.LogInformation("Milestone Loyalty Bonus Processing is disabled (processed instantly on purchase).");
        }

        private string mgToGrams(long mg) => string.Format("{0:F4}g", mg / 1000.0);

        public async Task<object> GetMaturitySummaryAsync(Guid schemeId)
        {
            var scheme = await _schemeRepository.GetUserSchemeByIdAsync(schemeId);
            if (scheme == null || scheme.Status != "Matured") return null;

            return new
            {
                SchemeId = scheme.Id,
                PlanName = scheme.PlanName,
                TotalInstallments = scheme.TotalInstallments,
                TotalGoldAccumulatedMg = scheme.AccumulatedGoldMg,
                MaturityDate = scheme.MaturityDate,
                Eligibility = "Eligible for Physical Redemption or Cash-out"
            };
        }

        public async Task<bool> ClaimMaturedSchemeAsync(Guid userId, Guid schemeId)
        {
            var scheme = await _schemeRepository.GetUserSchemeByIdAsync(schemeId);
            if (scheme == null || scheme.UserId != userId || scheme.Status != "Matured") return false;

            scheme.Status = "Claimed";
            scheme.RedeemedGoldMg = scheme.AccumulatedGoldMg;
            scheme.UpdatedAt = DateTime.UtcNow;
            await _schemeRepository.UpdateUserSchemeAsync(scheme);
            return true;
        }

        private DateTime CalculateMaturityDate(string frequency, int installments, string durationUnit)
        {
            if (string.Equals(durationUnit, "Days", StringComparison.OrdinalIgnoreCase))
            {
                return DateTime.UtcNow.AddDays(installments);
            }
            if (string.Equals(durationUnit, "Months", StringComparison.OrdinalIgnoreCase))
            {
                return DateTime.UtcNow.AddMonths(installments);
            }

            if (string.Equals(frequency, "Daily", StringComparison.OrdinalIgnoreCase))
            {
                return DateTime.UtcNow.AddDays(installments);
            }
            if (string.Equals(frequency, "Weekly", StringComparison.OrdinalIgnoreCase))
            {
                return DateTime.UtcNow.AddDays(installments * 7);
            }
            if (string.Equals(frequency, "Monthly", StringComparison.OrdinalIgnoreCase))
            {
                return DateTime.UtcNow.AddMonths(installments);
            }
            return DateTime.UtcNow.AddDays(330); // Default fallback
        }

        public async Task<IEnumerable<object>> GetMaturedSchemesForAdminAsync()
        {
            var schemes = await _schemeRepository.GetSchemesByStatusAsync("Matured");
            return schemes.Select(s => new {
                s.Id,
                s.UserId,
                s.PlanName,
                s.AccumulatedGoldMg,
                s.MaturityDate,
                s.Status,
                s.UpdatedAt
            });
        }

        public async Task<bool> DeleteSchemeMasterAsync(Guid id)
        {
            return await _schemeRepository.DeleteSchemeMasterAsync(id);
        }

        public async Task<SchemeMaster> CreateSchemeMasterAsync(SchemeMaster scheme, List<SchemeBonusTier>? tiers = null)
        {
            await _unitOfWork.BeginTransactionAsync();
            try
            {
                scheme.Id = Guid.NewGuid();
                scheme.CreatedAt = DateTime.UtcNow;
                scheme.IsActive = true;
                
                var created = await _schemeRepository.CreateSchemeMasterAsync(scheme);

                if (tiers != null && tiers.Count > 0)
                {
                    await _schemeRepository.SaveBonusTiersAsync(created.Id, tiers);
                }

                await _unitOfWork.CommitAsync();
                return created;
            }
            catch
            {
                await _unitOfWork.RollbackAsync();
                throw;
            }
        }

        public async Task<SchemeMaster> UpdateSchemeMasterAsync(SchemeMaster scheme, List<SchemeBonusTier>? tiers = null)
        {
            await _unitOfWork.BeginTransactionAsync();
            try
            {
                var existing = await _schemeRepository.GetSchemeMasterByIdAsync(scheme.Id);
                if (existing == null)
                {
                    throw new KeyNotFoundException("Scheme master not found.");
                }

                existing.PlanName = scheme.PlanName;
                existing.Description = scheme.Description;
                existing.InstallmentAmountPaise = scheme.InstallmentAmountPaise;
                existing.TotalInstallments = scheme.TotalInstallments;
                existing.Frequency = scheme.Frequency;
                existing.DurationUnit = scheme.DurationUnit;
                existing.IsActive = scheme.IsActive;
                existing.BonusConfigJson = scheme.BonusConfigJson;
                existing.CustomSectionsJson = scheme.CustomSectionsJson;
                existing.PaymentRulesJson = scheme.PaymentRulesJson;
                existing.KeywordsJson = scheme.KeywordsJson;
                existing.RazorpayPlanId = scheme.RazorpayPlanId;
                existing.PosterImageBase64 = scheme.PosterImageBase64;

                var updated = await _schemeRepository.UpdateSchemeMasterAsync(existing);

                if (tiers != null)
                {
                    await _schemeRepository.SaveBonusTiersAsync(updated.Id, tiers);
                }

                await _unitOfWork.CommitAsync();
                return updated;
            }
            catch
            {
                await _unitOfWork.RollbackAsync();
                throw;
            }
        }

        public async Task<IEnumerable<SchemeMaster>> GetAllSchemeMastersAdminAsync()
        {
            return await _schemeRepository.GetAllSchemeMastersAdminAsync();
        }

        // Phase 3 Scheme Ledger & Redemption Engine
        public async Task<object> InvestInSchemeAsync(Guid userId, Guid schemeId, long amountPaise, string? razorpayPaymentId, string ipAddress, string deviceFingerprint)
        {
            await _unitOfWork.BeginTransactionAsync();
            try
            {
                var scheme = await _schemeRepository.GetUserSchemeByIdAsync(schemeId);
                if (scheme == null || scheme.UserId != userId)
                {
                    return new { Success = false, Message = "Scheme enrollment not found." };
                }

                if (scheme.Status != "Active")
                {
                    return new { Success = false, Message = $"Scheme is not active. Current status: {scheme.Status}" };
                }

                // Buy gold using the GoldService
                var response = await _goldService.BuyGoldAsync(new BuyGoldRequest
                {
                    UserId = userId,
                    UserSchemeId = schemeId,
                    TotalAmountPaise = amountPaise,
                    IpAddress = ipAddress,
                    DeviceFingerprint = deviceFingerprint,
                    RazorpayPaymentId = razorpayPaymentId
                });

                if (!response.Success)
                {
                    throw new Exception(response.Message);
                }

                await _unitOfWork.CommitAsync();

                return new
                {
                    Success = true,
                    TransactionId = response.TransactionId,
                    GoldWeightMg = response.GoldWeightMg,
                    BonusGoldMg = response.BonusGoldMg,
                    TotalGoldCreditedMg = response.TotalGoldCreditedMg,
                    InstallmentNumber = scheme.InstallmentsPaid
                };
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackAsync();
                _logger.LogError(ex, "InvestInSchemeAsync failed for User: {UserId}, Scheme: {SchemeId}", userId, schemeId);
                return new { Success = false, Message = ex.Message };
            }
        }

        public async Task<object> GetSchemeProgressAsync(Guid schemeId)
        {
            var scheme = await _schemeRepository.GetUserSchemeByIdAsync(schemeId);
            if (scheme == null) return null;

            var (totalSavings, totalBonusEarned, totalBonusGoldMg) = await _schemeRepository.GetSchemeSavingsSummaryAsync(schemeId);

            var (currentBonusPercent, remainingDaysForCurrentTier, remainingDaysForScheme, milestones) = await GetDynamicBonusDetailsAsync(
                scheme.PlanName, scheme.CreatedAt, scheme.MaturityDate
            );
            int dayNumber = (int)(DateTime.UtcNow - scheme.CreatedAt).TotalDays;
            if (dayNumber < 0) dayNumber = 0;

            return new
            {
                SchemeId = scheme.Id,
                PlanName = scheme.PlanName,
                InstallmentsPaid = scheme.InstallmentsPaid,
                TotalInstallments = scheme.TotalInstallments,
                InstallmentAmountPaise = scheme.InstallmentAmountPaise,
                TotalSavingsAddedPaise = totalSavings,
                TotalBonusEarnedPaise = totalBonusEarned,
                TotalBonusGoldMg = totalBonusGoldMg,
                AccumulatedGoldMg = scheme.AccumulatedGoldMg,
                RedeemedGoldMg = scheme.RedeemedGoldMg,
                SchemeDayNumber = dayNumber,
                CurrentBonusTierPercent = (double)currentBonusPercent,
                RemainingDaysForCurrentTier = remainingDaysForCurrentTier,
                RemainingDaysForScheme = remainingDaysForScheme,
                Status = scheme.Status,
                JoinedAt = scheme.CreatedAt,
                MaturityDate = scheme.MaturityDate,
                Milestones = milestones
            };
        }

        public async Task<IEnumerable<SchemeInvestment>> GetSchemeLedgerAsync(Guid schemeId)
        {
            return await _schemeRepository.GetSchemeLedgerAsync(schemeId);
        }

        public async Task<object> RequestRedemptionAsync(Guid userId, Guid schemeId, string redemptionType, string? address, bool includeBonusGold = false)
        {
            await _unitOfWork.BeginTransactionAsync();
            try
            {
                var scheme = await _schemeRepository.GetUserSchemeByIdAsync(schemeId);
                if (scheme == null || scheme.UserId != userId)
                {
                    return new { Success = false, Message = "Scheme enrollment not found." };
                }

                if (scheme.Status != "Matured" && scheme.Status != "Active")
                {
                    return new { Success = false, Message = $"Scheme status '{scheme.Status}' is not eligible for redemption." };
                }

                long redemptionWeightMg = scheme.AccumulatedGoldMg;
                bool isSilverScheme = scheme.PlanName.Contains("silver", StringComparison.OrdinalIgnoreCase);
                var price = await _goldService.GetCurrentPriceAsync();
                long effectiveRate = isSilverScheme 
                    ? (price.PriceSilverPaise > 0L ? price.PriceSilverPaise : 9500L) 
                    : price.SellPricePaise;

                if (includeBonusGold)
                {
                    long bonusGoldMg = await _goldRepository.GetBonusGoldBalanceAsync(userId);
                    if (bonusGoldMg > 0)
                    {
                        redemptionWeightMg += bonusGoldMg;

                        // Debit user's BonusGoldBalanceMg
                        await _goldRepository.IncrementBonusGoldBalanceAsync(userId, -bonusGoldMg);

                        // Record SELL transaction for the event bonus gold
                        var bonusDebitTx = new GoldTransaction
                        {
                            Id = Guid.NewGuid(),
                            UserId = userId,
                            TransactionType = "SELL",
                            GoldWeightMg = bonusGoldMg,
                            PricePerGmPaise = effectiveRate,
                            TotalAmountPaise = (bonusGoldMg * effectiveRate) / 1000,
                            IpAddress = "127.0.0.1",
                            DeviceFingerprint = "SYSTEM_MERGE",
                            RateSource = "EVENT_BONUS_DEBIT",
                            RateTimestamp = DateTimeOffset.UtcNow,
                            UserSchemeId = schemeId,
                            RazorpayPaymentId = "MERGE_REDEMPTION"
                        };
                        await _goldRepository.RecordGoldTransactionAsync(bonusDebitTx);

                        // Update Gold balance cache
                        long updatedGoldBalance = await _goldRepository.CalculateGoldBalanceAsync(userId);
                        await _goldRepository.UpdateGoldCacheAsync(userId, updatedGoldBalance);
                    }
                }

                // Compliance Check
                var compliance = await _complianceService.ValidateRedemptionAsync(userId, redemptionWeightMg, redemptionType);
                if (!compliance.IsAllowed)
                {
                    return new { Success = false, Message = compliance.Message, ErrorCode = compliance.ErrorCode };
                }

                long totalAmountPaise = (redemptionWeightMg * effectiveRate) / 1000;

                var redemption = new SchemeRedemption
                {
                    Id = Guid.NewGuid(),
                    UserSchemeId = schemeId,
                    UserId = userId,
                    RedemptionType = redemptionType.ToUpperInvariant(),
                    GoldWeightMg = redemptionWeightMg,
                    PricePerGmPaise = effectiveRate,
                    TotalAmountPaise = totalAmountPaise,
                    Status = "PENDING",
                    Address = address,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _schemeRepository.RecordSchemeRedemptionAsync(redemption);

                var history = new RedemptionStatusHistory
                {
                    Id = Guid.NewGuid(),
                    SchemeRedemptionId = redemption.Id,
                    Status = "PENDING",
                    ChangeReason = "Redemption requested by user via " + redemptionType,
                    CreatedAt = DateTime.UtcNow
                };
                await _schemeRepository.RecordRedemptionStatusHistoryAsync(history);

                await _unitOfWork.CommitAsync();

                // Send user notification via dispatcher
                var user = await _authRepository.GetUserByIdAsync(userId);
                await _dispatcher.DispatchAsync(new NotificationPayload
                {
                    UserId = userId,
                    ToPhone = user?.PhoneNumber,
                    ToEmail = user?.Email,
                    ToName = user?.FullName ?? "Customer",
                    Title = "Redemption Requested ⏳",
                    Body = $"Your request to redeem {redemption.GoldWeightMg / 1000.0:F4}g of gold via {redemptionType} is pending approval.",
                    Type = "SCHEME_REDEMPTION_REQUESTED",
                    SendPush = true,
                    SendEmail = true,
                    EmailTemplate = EmailTemplate.GoldRedeemed,
                    EmailData = new
                    {
                        UserName = user?.FullName ?? "Customer",
                        RedeemedGoldMg = redemption.GoldWeightMg.ToString(),
                        CreditAmountRs = (totalAmountPaise / 100.0).ToString("F2"),
                        BankAccountMasked = "****",
                        UtrNumber = "Pending Approval",
                        ExpectedCreditDate = "Upon Admin Approval"
                    }
                });

                return new { Success = true, RedemptionId = redemption.Id, Status = redemption.Status };
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackAsync();
                _logger.LogError(ex, "RequestRedemptionAsync failed for User: {UserId}, Scheme: {SchemeId}", userId, schemeId);
                return new { Success = false, Message = ex.Message };
            }
        }

        public async Task<bool> ApproveRedemptionAsync(Guid redemptionId, string? adminId, string? notes)
        {
            await _unitOfWork.BeginTransactionAsync();
            try
            {
                var redemption = await _schemeRepository.GetSchemeRedemptionByIdAsync(redemptionId);
                if (redemption == null || redemption.Status != "PENDING") return false;

                var scheme = await _schemeRepository.GetUserSchemeByIdAsync(redemption.UserSchemeId);
                if (scheme == null) return false;

                redemption.Status = "APPROVED";
                redemption.AdminNotes = notes ?? "Approved by admin";
                redemption.UpdatedAt = DateTime.UtcNow;
                await _schemeRepository.UpdateSchemeRedemptionAsync(redemption);

                var history = new RedemptionStatusHistory
                {
                    Id = Guid.NewGuid(),
                    SchemeRedemptionId = redemptionId,
                    Status = "APPROVED",
                    ChangeReason = notes ?? "Approved by admin",
                    ChangedByAdminId = adminId,
                    CreatedAt = DateTime.UtcNow
                };
                await _schemeRepository.RecordRedemptionStatusHistoryAsync(history);

                // Update user scheme status to Claimed and save redeemed gold weight
                scheme.Status = "Claimed";
                scheme.RedeemedGoldMg = redemption.GoldWeightMg;
                scheme.UpdatedAt = DateTime.UtcNow;
                await _schemeRepository.UpdateUserSchemeAsync(scheme);

                // Debit the gold balance by recording a SELL transaction
                var goldTx = new GoldTransaction
                {
                    Id = Guid.NewGuid(),
                    UserId = redemption.UserId,
                    TransactionType = "SELL",
                    GoldWeightMg = redemption.GoldWeightMg,
                    PricePerGmPaise = redemption.PricePerGmPaise,
                    TotalAmountPaise = redemption.TotalAmountPaise,
                    IpAddress = "127.0.0.1",
                    DeviceFingerprint = "ADMIN_CONSOLE",
                    RateSource = "REDEMPTION_SETTLEMENT",
                    RateTimestamp = DateTime.UtcNow,
                    UserSchemeId = scheme.Id
                };
                await _goldRepository.RecordGoldTransactionAsync(goldTx);

                // If redemption type is CASH, credit the user's wallet
                if (redemption.RedemptionType == "CASH")
                {
                    await _walletService.ProcessTransactionAsync(new WalletTransactionRequest
                    {
                        UserId = redemption.UserId,
                        AmountPaise = redemption.TotalAmountPaise,
                        TransactionType = "CREDIT",
                        ReferenceId = "REDEMPTION_" + redemption.Id.ToString("N")[..8],
                        Description = $"Scheme Gold Cash Redemption ({redemption.GoldWeightMg} mg)",
                        IpAddress = "127.0.0.1",
                        DeviceFingerprint = "ADMIN_CONSOLE"
                    });
                }

                // Update Gold balance cache
                long updatedGoldBalance = await _goldRepository.CalculateGoldBalanceAsync(redemption.UserId);
                await _goldRepository.UpdateGoldCacheAsync(redemption.UserId, updatedGoldBalance);

                await _unitOfWork.CommitAsync();

                // Notify User
                var user = await _authRepository.GetUserByIdAsync(redemption.UserId);
                await _dispatcher.DispatchAsync(new NotificationPayload
                {
                    UserId = redemption.UserId,
                    ToPhone = user?.PhoneNumber,
                    ToEmail = user?.Email,
                    ToName = user?.FullName ?? "Customer",
                    Title = "Redemption Approved! 🎉",
                    Body = $"Your request to redeem {redemption.GoldWeightMg / 1000.0:F4}g of gold has been approved.",
                    Type = "SCHEME_REDEMPTION_APPROVED",
                    SendPush = true,
                    SendEmail = true,
                    EmailTemplate = EmailTemplate.GoldRedeemed,
                    EmailData = new
                    {
                        UserName = user?.FullName ?? "Customer",
                        RedeemedGoldMg = redemption.GoldWeightMg.ToString(),
                        CreditAmountRs = (redemption.TotalAmountPaise / 100.0).ToString("F2"),
                        BankAccountMasked = "****",
                        UtrNumber = "APPROVED",
                        ExpectedCreditDate = "Completed"
                    }
                });

                return true;
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackAsync();
                _logger.LogError(ex, "ApproveRedemptionAsync failed for Redemption: {RedemptionId}", redemptionId);
                return false;
            }
        }

        public async Task<bool> RejectRedemptionAsync(Guid redemptionId, string? adminId, string reason)
        {
            await _unitOfWork.BeginTransactionAsync();
            try
            {
                var redemption = await _schemeRepository.GetSchemeRedemptionByIdAsync(redemptionId);
                if (redemption == null || redemption.Status != "PENDING") return false;

                redemption.Status = "REJECTED";
                redemption.AdminNotes = reason;
                redemption.UpdatedAt = DateTime.UtcNow;
                await _schemeRepository.UpdateSchemeRedemptionAsync(redemption);

                var history = new RedemptionStatusHistory
                {
                    Id = Guid.NewGuid(),
                    SchemeRedemptionId = redemptionId,
                    Status = "REJECTED",
                    ChangeReason = reason,
                    ChangedByAdminId = adminId,
                    CreatedAt = DateTime.UtcNow
                };
                await _schemeRepository.RecordRedemptionStatusHistoryAsync(history);

                await _unitOfWork.CommitAsync();

                // Notify User
                var user = await _authRepository.GetUserByIdAsync(redemption.UserId);
                await _dispatcher.DispatchAsync(new NotificationPayload
                {
                    UserId = redemption.UserId,
                    ToPhone = user?.PhoneNumber,
                    ToEmail = user?.Email,
                    ToName = user?.FullName ?? "Customer",
                    Title = "Redemption Rejected ❌",
                    Body = $"Your request to redeem {redemption.GoldWeightMg / 1000.0:F4}g of gold was rejected. Reason: {reason}",
                    Type = "SCHEME_REDEMPTION_REJECTED",
                    SendPush = true,
                    SendEmail = true,
                    EmailTemplate = EmailTemplate.GenericNotification,
                    EmailData = new
                    {
                        UserName = user?.FullName ?? "Customer",
                        Title = "Redemption Request Rejected",
                        Body = $"We were unable to process your gold redemption request. Reason: {reason}. If you have questions, contact support."
                    }
                });

                return true;
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackAsync();
                _logger.LogError(ex, "RejectRedemptionAsync failed for Redemption: {RedemptionId}", redemptionId);
                return false;
            }
        }

        private async Task<(decimal CurrentBonusPercent, int RemainingDaysForCurrentTier, int RemainingDaysForScheme, List<object> Milestones)> GetDynamicBonusDetailsAsync(string planName, DateTime createdAt, DateTime maturityDate)
        {
            int dayNumber = (int)(DateTime.UtcNow - createdAt).TotalDays + 1;
            if (dayNumber <= 0) dayNumber = 1;

            // Resolve SchemeMaster
            var master = await _schemeRepository.GetSchemeMasterByPlanNameAsync(planName);
            List<SchemeBonusTier>? dbTiers = null;
            if (master != null)
            {
                dbTiers = await _schemeRepository.GetBonusTiersAsync(master.Id);
            }

            decimal currentBonusPercent = 0;
            int remainingDaysForCurrentTier = 0;

            var milestones = new List<object>();

            if (dbTiers != null && dbTiers.Count > 0)
            {
                var matchingTier = dbTiers.FirstOrDefault(t => dayNumber >= t.StartDay && dayNumber <= t.EndDay);
                if (matchingTier != null)
                {
                    currentBonusPercent = matchingTier.BonusPercentage;
                    remainingDaysForCurrentTier = matchingTier.EndDay - dayNumber;
                }
                else
                {
                    currentBonusPercent = 0;
                    remainingDaysForCurrentTier = 0;
                }

                foreach (var t in dbTiers)
                {
                    milestones.Add(new
                    {
                        Name = $"Tier {t.StartDay}-{t.EndDay} ({t.BonusPercentage:0.#}%)",
                        TargetDay = t.EndDay,
                        BonusPercentage = (double)t.BonusPercentage,
                        IsAchieved = dayNumber >= t.EndDay
                    });
                }
            }
            else
            {
                int totalSchemeDays = (int)Math.Max(1, Math.Round((maturityDate - createdAt).TotalDays));
                if (totalSchemeDays <= 30)
                {
                    currentBonusPercent = 7.5m;
                    remainingDaysForCurrentTier = Math.Max(0, totalSchemeDays - dayNumber);
                    
                    milestones.Add(new { 
                        Name = $"Maturity Completion (7.5%)", 
                        TargetDay = totalSchemeDays, 
                        BonusPercentage = 7.5, 
                        IsAchieved = dayNumber >= totalSchemeDays 
                    });
                }
                else
                {
                    // Fallback to original hardcoded 330-day scheme rules
                    if (dayNumber <= 75)
                    {
                        currentBonusPercent = 7.5m;
                        remainingDaysForCurrentTier = 75 - dayNumber;
                    }
                    else if (dayNumber <= 150)
                    {
                        currentBonusPercent = 5.5m;
                        remainingDaysForCurrentTier = 150 - dayNumber;
                    }
                    else if (dayNumber <= 225)
                    {
                        currentBonusPercent = 3.5m;
                        remainingDaysForCurrentTier = 225 - dayNumber;
                    }
                    else if (dayNumber <= 330)
                    {
                        currentBonusPercent = 1.5m;
                        remainingDaysForCurrentTier = 330 - dayNumber;
                    }
                    else
                    {
                        currentBonusPercent = 0m;
                        remainingDaysForCurrentTier = 0;
                    }

                    milestones.Add(new { Name = "Tier 1 (7.5%)", TargetDay = 75, BonusPercentage = 7.5, IsAchieved = dayNumber >= 75 });
                    milestones.Add(new { Name = "Tier 2 (5.5%)", TargetDay = 150, BonusPercentage = 5.5, IsAchieved = dayNumber >= 150 });
                    milestones.Add(new { Name = "Tier 3 (3.5%)", TargetDay = 225, BonusPercentage = 3.5, IsAchieved = dayNumber >= 225 });
                    milestones.Add(new { Name = "Tier 4 (1.5%)", TargetDay = 330, BonusPercentage = 1.5, IsAchieved = dayNumber >= 330 });
                }
            }

            int remainingDaysForScheme = (int)Math.Max(0, Math.Ceiling((maturityDate - DateTime.UtcNow).TotalDays));

            return (currentBonusPercent, remainingDaysForCurrentTier, remainingDaysForScheme, milestones);
        }

        public async Task<IEnumerable<object>> GetPendingRedemptionsForAdminAsync()
        {
            var redemptions = await _schemeRepository.GetPendingRedemptionsAsync();
            return redemptions.Select(r => new
            {
                r.Id,
                r.UserSchemeId,
                r.UserId,
                r.RedemptionType,
                r.GoldWeightMg,
                r.PricePerGmPaise,
                r.TotalAmountPaise,
                r.Status,
                r.Address,
                r.AdminNotes,
                r.CreatedAt,
                r.UpdatedAt
            });
        }

        public async Task<object> SubmitJoinFormAsync(
            Guid userSchemeId,
            Guid userId,
            string nomineeName,
            string nomineePhone,
            string nomineeRelationship,
            string state,
            string city,
            string streetAddress,
            string pincode)
        {
            var scheme = await _schemeRepository.GetUserSchemeByIdAsync(userSchemeId);
            if (scheme == null || scheme.UserId != userId)
            {
                return new { Success = false, Message = "Scheme enrollment not found." };
            }

            var formDetails = new Dictionary<string, string?>();
            formDetails["nomineeName"] = nomineeName;
            formDetails["nomineePhone"] = nomineePhone;
            formDetails["nomineeRelationship"] = nomineeRelationship;
            formDetails["state"] = state;
            formDetails["city"] = city;
            formDetails["streetAddress"] = streetAddress;
            formDetails["pincode"] = pincode;

            scheme.SubmittedFormDetails = System.Text.Json.JsonSerializer.Serialize(formDetails);
            scheme.IsJoinFormCompleted = true;
            scheme.FormSubmittedAt = DateTime.UtcNow;
            scheme.UpdatedAt = DateTime.UtcNow;

            await _schemeRepository.UpdateUserSchemeAsync(scheme);

            // Also update user profile globally for profile completeness
            var user = await _authRepository.GetUserByIdAsync(userId);
            if (user != null)
            {
                user.NomineeName = nomineeName;
                user.NomineePhoneNumber = nomineePhone;
                user.NomineeRelationship = nomineeRelationship;
                await _authRepository.UpdateUserAsync(user);
            }

            // Also add address globally if not existing
            var existingDefaultAddress = await _schemeRepository.GetUserDefaultAddressAsync(userId);
            if (existingDefaultAddress == null)
            {
                var newAddress = new Address
                {
                    UserId = userId,
                    StreetAddress = streetAddress,
                    City = city,
                    State = state,
                    Pincode = pincode,
                    IsDefault = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                await _schemeRepository.AddUserAddressAsync(newAddress);
            }

            return new { Success = true, Message = "Form submitted successfully." };
        }
    }
}
