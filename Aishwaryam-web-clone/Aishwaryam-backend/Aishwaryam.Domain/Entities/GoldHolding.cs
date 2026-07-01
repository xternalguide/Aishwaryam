using System;

namespace Aishwaryam.Domain.Entities
{
    public class GoldHolding
    {
        public Guid UserId { get; set; }
        public long GoldBalanceMg { get; set; } = 0; // 1g = 1000 mg
        public long BonusGoldBalanceMg { get; set; } = 0; // Offer/event bonus gold (separate)
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

        /// <summary>
        /// Optimistic concurrency token. EF Core checks this on every UPDATE.
        /// If two concurrent transactions read the same version and both try to write,
        /// the second commit throws DbUpdateConcurrencyException — preventing silent
        /// double-deductions or negative balances.
        /// </summary>
        [System.ComponentModel.DataAnnotations.Timestamp]
        public byte[]? RowVersion { get; set; }

        // Navigation property
        public User? User { get; set; }
    }
}
