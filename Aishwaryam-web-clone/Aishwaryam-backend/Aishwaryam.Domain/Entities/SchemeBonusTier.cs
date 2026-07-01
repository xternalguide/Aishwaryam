using System;

namespace Aishwaryam.Domain.Entities
{
    public class SchemeBonusTier
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid SchemeMasterId { get; set; }
        public int StartDay { get; set; }
        public int EndDay { get; set; }
        public decimal BonusPercentage { get; set; } // e.g. 7.5 for 7.5%
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public SchemeMaster SchemeMaster { get; set; } = null!;
    }
}
