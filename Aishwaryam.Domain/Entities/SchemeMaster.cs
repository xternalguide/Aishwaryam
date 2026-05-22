using System;

namespace Aishwaryam.Domain.Entities
{
    public class SchemeMaster
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string PlanName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public long InstallmentAmountPaise { get; set; }
        public int TotalInstallments { get; set; }
        public string Frequency { get; set; } = "Daily";
        public bool IsActive { get; set; } = true;
        public string? BonusConfigJson { get; set; }
        public string? CustomSectionsJson { get; set; }
        public string? RazorpayPlanId { get; set; }  // Razorpay recurring plan ID
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
