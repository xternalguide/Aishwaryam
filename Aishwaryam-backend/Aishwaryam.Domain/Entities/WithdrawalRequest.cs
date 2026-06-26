using System;

namespace Aishwaryam.Domain.Entities
{
    public class WithdrawalRequest
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid BankAccountId { get; set; }
        public long AmountPaise { get; set; }
        public string Status { get; set; } = "PENDING"; // PENDING, PROCESSING, COMPLETED, FAILED
        public string? UtrNumber { get; set; } // Bank transaction reference
        public string? AdminNotes { get; set; }
        public string IpAddress { get; set; } = string.Empty;
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

        public User? User { get; set; }
        public BankAccount? BankAccount { get; set; }
    }
}
