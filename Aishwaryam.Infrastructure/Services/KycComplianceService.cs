using System;
using System.Linq;
using System.Threading.Tasks;
using Aishwaryam.Application.Interfaces.Services;
using Aishwaryam.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Aishwaryam.Infrastructure.Services
{
    public class KycComplianceService : IKycComplianceService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<KycComplianceService> _logger;

        public KycComplianceService(ApplicationDbContext context, ILogger<KycComplianceService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<ComplianceCheckResult> ValidateTransactionAsync(Guid userId, long amountPaise, string transactionType)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return new ComplianceCheckResult { IsAllowed = false, Message = "User not found." };

            var limits = GetLimitsForLevel(user.KycLevel ?? "BASIC");

            // Daily Check
            var today = DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc);
            var dailyTotal = await _context.Payments
                .Where(p => p.UserId == userId && p.Status == "SUCCESS" && p.CreatedAt >= today)
                .SumAsync(p => p.AmountPaise);

            if (dailyTotal + amountPaise > limits.DailyTransactionLimitPaise)
            {
                return new ComplianceCheckResult 
                { 
                    IsAllowed = false, 
                    Message = $"Daily transaction limit of ₹{limits.DailyTransactionLimitPaise / 100} exceeded. You have already used ₹{dailyTotal / 100}.",
                    ErrorCode = "LIMIT_EXCEEDED_DAILY"
                };
            }

            // High Value Review (e.g. > 1 Lakh requires manual review if not Premium)
            if (amountPaise > 10000000 && user.KycLevel != "PREMIUM")
            {
                return new ComplianceCheckResult 
                { 
                    IsAllowed = true, 
                    RequiresAdminReview = true, 
                    Message = "This high-value transaction will be held for manual compliance review." 
                };
            }

            return new ComplianceCheckResult { IsAllowed = true };
        }

        public async Task<ComplianceCheckResult> ValidateRedemptionAsync(Guid userId, long goldWeightMg, string redemptionType)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return new ComplianceCheckResult { IsAllowed = false, Message = "User not found." };

            var limits = GetLimitsForLevel(user.KycLevel ?? "BASIC");

            if (redemptionType == "PHYSICAL" && !limits.IsPhysicalDeliveryAllowed)
            {
                return new ComplianceCheckResult 
                { 
                    IsAllowed = false, 
                    Message = "Full KYC verification is required for physical gold delivery.",
                    ErrorCode = "KYC_REQUIRED_PHYSICAL"
                };
            }

            if (goldWeightMg > limits.MaxRedemptionMg)
            {
                return new ComplianceCheckResult 
                { 
                    IsAllowed = false, 
                    Message = $"Current KYC level allows maximum redemption of {(limits.MaxRedemptionMg / 1000.0):F2}g.",
                    ErrorCode = "LIMIT_EXCEEDED_GOLD"
                };
            }

            return new ComplianceCheckResult { IsAllowed = true };
        }

        public async Task<KycLimitsDto> GetUserLimitsAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            var level = user?.KycLevel ?? "BASIC";
            var limits = GetLimitsForLevel(level);

            var today = DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc);
            var monthStart = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc);

            var dailyUsed = await _context.Payments
                .Where(p => p.UserId == userId && p.Status == "SUCCESS" && p.CreatedAt >= today)
                .SumAsync(p => p.AmountPaise);

            var monthlyUsed = await _context.Payments
                .Where(p => p.UserId == userId && p.Status == "SUCCESS" && p.CreatedAt >= monthStart)
                .SumAsync(p => p.AmountPaise);

            return new KycLimitsDto
            {
                CurrentLevel = level,
                DailyTransactionLimitPaise = limits.DailyTransactionLimitPaise,
                MonthlyTransactionLimitPaise = limits.MonthlyTransactionLimitPaise,
                RemainingDailyLimitPaise = Math.Max(0, limits.DailyTransactionLimitPaise - dailyUsed),
                RemainingMonthlyLimitPaise = Math.Max(0, limits.MonthlyTransactionLimitPaise - monthlyUsed),
                MaxRedemptionMg = limits.MaxRedemptionMg,
                IsPhysicalDeliveryAllowed = limits.IsPhysicalDeliveryAllowed
            };
        }

        private (long DailyTransactionLimitPaise, long MonthlyTransactionLimitPaise, long MaxRedemptionMg, bool IsPhysicalDeliveryAllowed) GetLimitsForLevel(string level)
        {
            return level.ToUpper() switch
            {
                "PREMIUM" => (100000000, 500000000, 1000000, true), // 10L daily, 50L monthly, 1kg gold
                "VERIFIED" => (20000000, 100000000, 100000, true),  // 2L daily, 10L monthly, 100g gold
                "FULL" => (20000000, 100000000, 100000, true),      // 2L daily, 10L monthly, 100g gold
                _ => (5000000, 20000000, 5000, false)                               // UAT: ₹50,000 daily, ₹2L monthly, 5g gold, no physical
            };
        }
    }
}
