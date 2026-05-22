using System;

namespace Aishwaryam.Domain.Entities
{
    public class Wallet
    {
        public Guid UserId { get; set; }
        public long InrBalancePaise { get; set; } = 0;
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

        /// <summary>Optimistic concurrency token — prevents negative balance race conditions.</summary>
        [System.ComponentModel.DataAnnotations.Timestamp]
        public byte[]? RowVersion { get; set; }

        // Navigation property
        public User? User { get; set; }
    }
}
