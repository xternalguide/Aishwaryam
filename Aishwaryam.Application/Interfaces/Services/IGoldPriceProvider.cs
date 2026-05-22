using System.Threading.Tasks;

namespace Aishwaryam.Application.Interfaces.Services
{
    public interface IGoldPriceProvider
    {
        string ProviderName { get; }
        int Priority { get; }
        Task<GoldPriceResult?> GetLatestPriceAsync();
    }

    public class GoldPriceResult
    {
        public decimal Price24K { get; set; }
        public decimal Price22K { get; set; }
        public decimal BuyPrice { get; set; }
        public decimal SellPrice { get; set; }
        public string Source { get; set; } = string.Empty;
        public System.DateTime Timestamp { get; set; }
        public bool IsAdminOverride { get; set; }
    }
}
