using System;

namespace Aishwaryam.Domain.Entities
{
    public class WalletLedger
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string TransactionType { get; set; } = string.Empty; // CREDIT, DEBIT
        public long AmountPaise { get; set; }
        public string ReferenceId { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string IpAddress { get; set; } = string.Empty;
        public string DeviceFingerprint { get; set; } = string.Empty;
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        // Navigation property
        public User? User { get; set; }
    }
}
