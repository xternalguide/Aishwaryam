using System;
using System.Threading.Tasks;

namespace Aishwaryam.Application.Interfaces.Services
{
    public interface IKycComplianceService
    {
        Task<ComplianceCheckResult> ValidateTransactionAsync(Guid userId, long amountPaise, string transactionType);
        Task<ComplianceCheckResult> ValidateRedemptionAsync(Guid userId, long goldWeightMg, string redemptionType);
        Task<KycLimitsDto> GetUserLimitsAsync(Guid userId);
    }

    public class ComplianceCheckResult
    {
        public bool IsAllowed { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? ErrorCode { get; set; }
        public bool RequiresAdminReview { get; set; }
    }

    public class KycLimitsDto
    {
        public string CurrentLevel { get; set; } = "BASIC";
        public long DailyTransactionLimitPaise { get; set; }
        public long MonthlyTransactionLimitPaise { get; set; }
        public long RemainingDailyLimitPaise { get; set; }
        public long RemainingMonthlyLimitPaise { get; set; }
        public long MaxRedemptionMg { get; set; }
        public bool IsPhysicalDeliveryAllowed { get; set; }
    }
}
