using System;
using System.Threading.Tasks;
using Aishwaryam.Application.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace Aishwaryam.Infrastructure.Services.PriceProviders
{
    /// <summary>
    /// Fallback provider using last known price or a safe static rate.
    /// Used when all live providers fail.
    /// </summary>
    public class StaticFallbackProvider : IGoldPriceProvider
    {
        private readonly ILogger<StaticFallbackProvider> _logger;
        public string ProviderName => "StaticFallback";
        public int Priority => 99; // Always last

        private const decimal FallbackPrice24K = 750000m; // ₹7500/g in paise units (per gram)
        private const decimal Carat22Factor = 0.916m;

        public StaticFallbackProvider(ILogger<StaticFallbackProvider> logger)
        {
            _logger = logger;
        }

        public Task<GoldPriceResult?> GetLatestPriceAsync()
        {
            _logger.LogCritical("Using StaticFallbackProvider. All live price feeds are down!");
            var price22K = FallbackPrice24K * Carat22Factor;
            return Task.FromResult<GoldPriceResult?>(new GoldPriceResult
            {
                Price24K = FallbackPrice24K,
                Price22K = price22K,
                BuyPrice = price22K,
                SellPrice = price22K * 0.97m,
                Source = ProviderName,
                Timestamp = DateTime.UtcNow
            });
        }
    }
}
