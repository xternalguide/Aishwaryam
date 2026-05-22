using System;

namespace Aishwaryam.Domain.Entities
{
    public class Invoice
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TransactionId { get; set; }
        public long BaseAmountPaise { get; set; }
        public long GstAmountPaise { get; set; }
        public long TotalAmountPaise { get; set; }
        public decimal BonusPercentage { get; set; }
        public long BonusAmountPaise { get; set; }
        public long BonusGoldMg { get; set; }
        public int SchemeDayNumber { get; set; }
        public string? InvoicePdfUrl { get; set; }
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        // Navigation property
        public GoldTransaction? Transaction { get; set; }
    }
}
