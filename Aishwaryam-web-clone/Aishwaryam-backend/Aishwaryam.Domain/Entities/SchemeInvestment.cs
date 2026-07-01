using System;

namespace Aishwaryam.Domain.Entities
{
    public class SchemeInvestment
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserSchemeId { get; set; }
        public Guid UserId { get; set; }
        public string TransactionType { get; set; } = "INSTALLMENT"; // INSTALLMENT, BONUS
        public long InstallmentNumber { get; set; }
        public long AmountPaise { get; set; } // Total paid
        public long BaseAmountPaise { get; set; } // Principal excluding GST
        public long GstAmountPaise { get; set; } // GST
        public long GoldWeightMg { get; set; } // Accumulated gold from this investment
        public long PricePerGmPaise { get; set; } // Price per gram at time of investment
        public decimal BonusPercentage { get; set; } // Bonus percentage applied
        public long BonusAmountPaise { get; set; } // Calculated bonus in paise
        public long BonusGoldMg { get; set; } // Calculated bonus gold in mg
        public string? RazorpayPaymentId { get; set; } // Verified Razorpay payment ID
        public string Status { get; set; } = "COMPLETED"; // COMPLETED, RECONCILING
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public UserScheme UserScheme { get; set; } = null!;
        public User User { get; set; } = null!;
    }
}
