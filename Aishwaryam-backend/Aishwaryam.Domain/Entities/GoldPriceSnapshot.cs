using System;

namespace Aishwaryam.Domain.Entities
{
    public class GoldPriceSnapshot
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public decimal Price24KPerGram { get; set; }
        public decimal Price22KPerGram { get; set; }
        public decimal BuyPricePerGram { get; set; }
        public decimal SellPricePerGram { get; set; }
        public string Source { get; set; } = string.Empty;
        public decimal PriceSilverPerGram { get; set; } = 0;
        public string? AdminNote { get; set; }
        public bool IsAdminOverride { get; set; } = false;
        public DateTime FetchedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ExpiresAt { get; set; }
    }
}
