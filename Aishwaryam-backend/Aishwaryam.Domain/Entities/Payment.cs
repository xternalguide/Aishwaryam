using System;

namespace Aishwaryam.Domain.Entities
{
    public class Payment
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public string ProviderOrderId { get; set; } = string.Empty;
        public string ProviderPaymentId { get; set; } = string.Empty;
        public long AmountPaise { get; set; }
        public Guid? UserSchemeId { get; set; } // Linked scheme ID for multi-scheme tracking
        public string Status { get; set; } = "PENDING";
        public string IpAddress { get; set; } = string.Empty;
        public string DeviceFingerprint { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public User User { get; set; } = null!;
    }
}
