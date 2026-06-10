using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Aishwaryam.Application.Interfaces.Services;
using Aishwaryam.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Aishwaryam.Infrastructure.Services
{
    public class GoldPriceManager : IGoldPriceManager
    {
        private readonly IEnumerable<IGoldPriceProvider> _providers;
        private readonly IMemoryCache _cache;
        private readonly ILogger<GoldPriceManager> _logger;
        private readonly IServiceProvider _serviceProvider;

        private const string CacheKey = "LiveGoldPrice";
        private const string LockKeyPrefix = "PriceLock_";

        public GoldPriceManager(
            IEnumerable<IGoldPriceProvider> providers,
            IMemoryCache cache,
            ILogger<GoldPriceManager> logger,
            IServiceProvider serviceProvider)
        {
            _providers = providers.OrderBy(p => p.Priority);
            _cache = cache;
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        public async Task<GoldPriceResult> GetPriceAsync()
        {
            if (_cache.TryGetValue(CacheKey, out GoldPriceResult cachedPrice))
            {
                return cachedPrice;
            }

            // 1. Prioritize Database Snapshots first (For Admin manual updates)
            try 
            {
                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                
                var latestSnapshot = await context.GoldPriceSnapshots
                    .OrderByDescending(s => s.FetchedAt)
                    .FirstOrDefaultAsync();

                if (latestSnapshot != null)
                {
                    var result = new GoldPriceResult
                    {
                        Price24K = latestSnapshot.Price24KPerGram,
                        Price22K = latestSnapshot.Price22KPerGram,
                        PriceSilver = latestSnapshot.PriceSilverPerGram,
                        BuyPrice = latestSnapshot.BuyPricePerGram,
                        SellPrice = latestSnapshot.SellPricePerGram,
                        Timestamp = latestSnapshot.FetchedAt,
                        Source = latestSnapshot.Source ?? "DATABASE_MANUAL",
                        IsAdminOverride = latestSnapshot.IsAdminOverride
                    };
                    
                    // Cache for 5 minutes (will be cleared immediately on Admin update)
                    _cache.Set(CacheKey, result, TimeSpan.FromMinutes(5));
                    return result;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve gold price from database. Falling back to providers.");
            }

            // 2. Fallback to Live Providers only if database is completely empty
            foreach (var provider in _providers)
            {
                try
                {
                    var result = await provider.GetLatestPriceAsync();
                    if (result != null)
                    {
                        // Cache for 5 minutes
                        _cache.Set(CacheKey, result, TimeSpan.FromMinutes(5));
                        return result;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Provider {Provider} failed, trying next...", provider.ProviderName);
                }
            }

            throw new Exception("Critical Error: Gold price is unavailable. All providers and database fallbacks failed.");
        }

        public async Task<string> CreatePriceLockAsync(Guid userId, GoldPriceResult price)
        {
            var lockId = Guid.NewGuid().ToString("N");
            var key = $"{LockKeyPrefix}{lockId}";
            
            // Lock price for 10 minutes (Checkout Window)
            _cache.Set(key, price, TimeSpan.FromMinutes(10));
            
            return lockId;
        }

        public async Task<GoldPriceResult?> GetLockedPriceAsync(string lockId)
        {
            var key = $"{LockKeyPrefix}{lockId}";
            if (_cache.TryGetValue(key, out GoldPriceResult price))
            {
                return price;
            }
            return null;
        }
    }
}
