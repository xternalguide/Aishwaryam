using System;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Aishwaryam.Application.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace Aishwaryam.Infrastructure.Services.PriceProviders
{
    public class TheJewellersAssociationProvider : IGoldPriceProvider
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<TheJewellersAssociationProvider> _logger;

        public string ProviderName => "TheJewellersAssociation";
        public int Priority => 0; // Set to 0 to run before MetalPriceApi (which has Priority 1)

        public TheJewellersAssociationProvider(IHttpClientFactory httpClientFactory, ILogger<TheJewellersAssociationProvider> logger)
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        public async Task<GoldPriceResult?> GetLatestPriceAsync()
        {
            try
            {
                var client = _httpClientFactory.CreateClient();
                // Set User-Agent to avoid getting blocked by site security filters
                client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

                var html = await client.GetStringAsync("https://thejewellersassociation.org/");

                // Extract 22ct Gold Rate (handling single or double quotes, and surrounding whitespace)
                var match22 = Regex.Match(html, @"\$\('#goldrate_22ct'\)\.html\(\s*['""]([\d\.]+)['""]\s*\)");
                // Extract 18ct Gold Rate
                var match18 = Regex.Match(html, @"\$\('#goldrate_18ct'\)\.html\(\s*['""]([\d\.]+)['""]\s*\)");
                // Extract Silver Rate (1gm)
                var matchSilver = Regex.Match(html, @"\$\('#silverrate_1gm'\)\.html\(\s*['""]([\d\.]+)['""]\s*\)");

                if (match22.Success)
                {
                    decimal price22K = decimal.Parse(match22.Groups[1].Value);
                    decimal price18K = match18.Success ? decimal.Parse(match18.Groups[1].Value) : price22K * 0.83m;
                    decimal priceSilver = matchSilver.Success ? decimal.Parse(matchSilver.Groups[1].Value) : 95.00m;

                    // Compute 24K price: 22K is 91.6% purity
                    decimal price24K = price22K / 0.916m;

                    _logger.LogInformation("Successfully parsed prices from The Jewellers Association: 22K={Price22K}, 18K={Price18K}, Silver={PriceSilver}", price22K, price18K, priceSilver);

                    return new GoldPriceResult
                    {
                        Price24K = price24K,
                        Price22K = price22K,
                        PriceSilver = priceSilver,
                        BuyPrice = price22K, // Standard 22K buy price
                        SellPrice = price22K * 0.97m, // Standard 3% spread
                        Source = ProviderName,
                        Timestamp = DateTime.UtcNow
                    };
                }
                else
                {
                    _logger.LogWarning("The Jewellers Association page loaded but could not parse the gold rate selectors.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception occurred while fetching gold price from The Jewellers Association");
            }

            return null;
        }
    }
}
