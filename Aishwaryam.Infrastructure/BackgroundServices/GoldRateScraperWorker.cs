using System;
using System.Threading;
using System.Threading.Tasks;
using Aishwaryam.Application.Interfaces.Services;
using Aishwaryam.Infrastructure.Data;
using Aishwaryam.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Aishwaryam.Infrastructure.BackgroundServices
{
    public class GoldRateScraperWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<GoldRateScraperWorker> _logger;

        public GoldRateScraperWorker(
            IServiceProvider serviceProvider,
            ILogger<GoldRateScraperWorker> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Tamil Nadu Live Gold Price Scraper Background Worker started.");

            // Run first execution immediately on startup
            try
            {
                await ScrapeAndSyncGoldPriceAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Initial gold rate scrape failed.");
            }

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Delay for 1 hour
                    await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
                    
                    await ScrapeAndSyncGoldPriceAsync();
                }
                catch (TaskCanceledException)
                {
                    _logger.LogInformation("Gold Price Scraper Background Worker is stopping.");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred during recurring gold price scraping cycle.");
                }
            }
        }

        private async Task ScrapeAndSyncGoldPriceAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var scraperService = scope.ServiceProvider.GetRequiredService<GoldScraperService>();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var cache = scope.ServiceProvider.GetRequiredService<IMemoryCache>();

            _logger.LogInformation("Triggering live gold price scraper...");
            var scrapedResult = await scraperService.ScrapeLatestPriceAsync();

            if (scrapedResult != null)
            {
                var snapshot = new Aishwaryam.Domain.Entities.GoldPriceSnapshot
                {
                    Price24KPerGram = scrapedResult.Price24K,
                    Price22KPerGram = scrapedResult.Price22K,
                    BuyPricePerGram = scrapedResult.BuyPrice,
                    SellPricePerGram = scrapedResult.SellPrice,
                    Source = scrapedResult.Source,
                    AdminNote = "Scraped automatically by Background Worker",
                    IsAdminOverride = false,
                    FetchedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddHours(2) // Expires in 2 hours
                };

                _logger.LogInformation("Saving scraped snapshot to database: 24K = {Price24K}, 22K = {Price22K}, Source = {Source}", 
                    snapshot.Price24KPerGram, snapshot.Price22KPerGram, snapshot.Source);

                await context.Database.ExecuteSqlRawAsync(
                    @"INSERT INTO gold_price_snapshots 
                        (id, price_24k_per_gram, price_22k_per_gram, buy_price_per_gram, sell_price_per_gram, source, admin_note, is_admin_override, fetched_at, expires_at)
                      VALUES
                        ({0},{1},{2},{3},{4},{5},{6},{7},{8},{9})",
                    snapshot.Id, snapshot.Price24KPerGram, snapshot.Price22KPerGram,
                    snapshot.BuyPricePerGram, snapshot.SellPricePerGram, snapshot.Source,
                    snapshot.AdminNote ?? "", snapshot.IsAdminOverride, snapshot.FetchedAt, snapshot.ExpiresAt);

                // Clear memory cache so all clients receive updated live prices immediately
                cache.Remove("LiveGoldPrice");
                _logger.LogInformation("LiveGoldPrice cache invalidated successfully.");
            }
            else
            {
                _logger.LogError("Scraper returned null gold price result. Skipping snapshot save.");
            }
        }
    }
}
