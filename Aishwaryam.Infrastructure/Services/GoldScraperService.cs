using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Aishwaryam.Application.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace Aishwaryam.Infrastructure.Services
{
    public class GoldScraperService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IEnumerable<IGoldPriceProvider> _providers;
        private readonly ILogger<GoldScraperService> _logger;

        private const string PrimaryUrl = "https://thejewellersassociation.org/";
        private const string BackupUrl = "https://www.livechennai.com/gold_silverrate.asp";

        public GoldScraperService(
            IHttpClientFactory httpClientFactory,
            IEnumerable<IGoldPriceProvider> providers,
            ILogger<GoldScraperService> logger)
        {
            _httpClientFactory = httpClientFactory;
            _providers = providers;
            _logger = logger;
        }

        public async Task<GoldPriceResult?> ScrapeLatestPriceAsync()
        {
            // 1. Try Target A: Bullions.co.in (Primary)
            try
            {
                _logger.LogInformation("Attempting to scrape primary gold rate source from {Url}", PrimaryUrl);
                var client = _httpClientFactory.CreateClient("GoldScraper");
                client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

                var response = await client.GetAsync(PrimaryUrl);
                if (response.IsSuccessStatusCode)
                {
                    var html = await response.Content.ReadAsStringAsync();
                    
                    var match22 = Regex.Match(html, @"\$\('#goldrate_22ct'\)\.html\(""([\d.]+?)""\);", RegexOptions.Singleline | RegexOptions.IgnoreCase);

                    if (match22.Success)
                    {
                        var price22Str = match22.Groups[1].Value.Replace(",", "");

                        if (decimal.TryParse(price22Str, out decimal price22) && price22 > 0)
                        {
                            decimal price24 = price22 / 0.916m; // Calculate 24K from 22K
                            _logger.LogInformation("Successfully scraped primary gold rates: 22K = {Price22}, Calculated 24K = {Price24}", price22, price24);
                            return new GoldPriceResult
                            {
                                Price24K = price24,
                                Price22K = price22,
                                BuyPrice = price22, // BuyPrice is standard 22K per gram
                                SellPrice = price22 * 0.97m, // SellPrice with 3% margin
                                Source = "JewellersAssociationScraper",
                                Timestamp = DateTime.UtcNow
                            };
                        }
                    }
                    _logger.LogWarning("Failed to parse pricing elements from primary source HTML structure.");
                }
                else
                {
                    _logger.LogWarning("Primary source returned non-success status code: {StatusCode}", response.StatusCode);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception occurred while scraping from primary gold price source.");
            }

            // 2. Try Target B: LiveChennai (Backup)
            try
            {
                _logger.LogInformation("Attempting to scrape backup gold rate source from {Url}", BackupUrl);
                var client = _httpClientFactory.CreateClient("GoldScraper");
                client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

                var response = await client.GetAsync(BackupUrl);
                if (response.IsSuccessStatusCode)
                {
                    var html = await response.Content.ReadAsStringAsync();
                    
                    var pattern = @"1 Gm \(22 K\).*?<i\s+class=""fa\s+fa-inr""></i>\s*([\d,]+(?:\.\d+)?)";
                    var match = Regex.Match(html, pattern, RegexOptions.Singleline | RegexOptions.IgnoreCase);

                    if (match.Success)
                    {
                        var price22Str = match.Groups[1].Value.Replace(",", "");
                        if (decimal.TryParse(price22Str, out decimal price22) && price22 > 0)
                        {
                            decimal price24 = price22 / 0.916m; // Calculate 24K from 22K
                            _logger.LogInformation("Successfully scraped backup gold rates: 22K = {Price22}, Calculated 24K = {Price24}", price22, price24);
                            return new GoldPriceResult
                            {
                                Price24K = price24,
                                Price22K = price22,
                                BuyPrice = price22,
                                SellPrice = price22 * 0.97m,
                                Source = "LiveChennaiScraper",
                                Timestamp = DateTime.UtcNow
                            };
                        }
                    }
                    _logger.LogWarning("Failed to parse pricing elements from backup source HTML structure.");
                }
                else
                {
                    _logger.LogWarning("Backup source returned non-success status code: {StatusCode}", response.StatusCode);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception occurred while scraping from backup gold price source.");
            }

            // 3. Fallback to MetalPriceAPI
            try
            {
                _logger.LogWarning("Both primary and backup scrapers failed. Executing fallback to MetalPriceAPI.");
                var fallbackProvider = _providers.FirstOrDefault(p => p.ProviderName == "MetalPriceAPI");
                if (fallbackProvider != null)
                {
                    var result = await fallbackProvider.GetLatestPriceAsync();
                    if (result != null)
                    {
                        _logger.LogInformation("Successfully resolved fallback price from MetalPriceAPI: 24K = {Price24}, 22K = {Price22}", result.Price24K, result.Price22K);
                        return result;
                    }
                }
                _logger.LogError("Fallback MetalPriceAPI provider could not be resolved or returned null.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception occurred during fallback price retrieval.");
            }

            return null;
        }
    }
}
