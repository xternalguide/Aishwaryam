using System;

namespace Aishwaryam.Domain.Entities
{
    public class GoldPriceLog
    {
        public Guid Id { get; set; }
        public long BuyPricePaise { get; set; }
        public long SellPricePaise { get; set; }
        public bool IsAdminOverride { get; set; } = false;
        public Guid? AdminId { get; set; }
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
