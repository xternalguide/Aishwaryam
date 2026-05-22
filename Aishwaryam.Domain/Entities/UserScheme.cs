using System;

namespace Aishwaryam.Domain.Entities
{
    public class UserScheme
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public string PlanName { get; set; } = string.Empty;
        public bool AutoPayEnabled { get; set; }
        public string? RazorpaySubscriptionId { get; set; } // Subscription ID for auto-debit
        public string PaymentFrequency { get; set; } = "Daily"; // Daily, Monthly
        public long InstallmentAmountPaise { get; set; }
        public int InstallmentsPaid { get; set; }
        public int TotalInstallments { get; set; }
        public DateTime NextDueDate { get; set; }
        public long AccumulatedGoldMg { get; set; }
        public long RedeemedGoldMg { get; set; } = 0; // Gold already redeemed physically or sold
        public string Status { get; set; } = "Active"; // Active, Defaulted, Matured, Claimed
        public DateTime MaturityDate { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public User User { get; set; } = null!;
    }
}
