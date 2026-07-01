using System;

namespace Aishwaryam.Domain.Entities
{
    public class GoldTransaction
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string TransactionType { get; set; } = string.Empty; // BUY, SELL
        public long GoldWeightMg { get; set; }
        public long PricePerGmPaise { get; set; }
        public long TotalAmountPaise { get; set; }
        public string IpAddress { get; set; } = string.Empty;
        public string DeviceFingerprint { get; set; } = string.Empty;
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public string RateSource { get; set; } = "LIVE_FEED";
        public DateTimeOffset RateTimestamp { get; set; } = DateTimeOffset.UtcNow;
        public Guid? UserSchemeId { get; set; } // Linked scheme for lock-in tracking
        public string? RazorpayPaymentId { get; set; } // Idempotency key — prevents double-credits on duplicate webhooks
        public long BonusAmountPaise { get; set; } = 0;
        public long BonusGoldMg { get; set; } = 0;

        // Navigation property
        public User? User { get; set; }
        public Invoice? Invoice { get; set; }
    }
}
