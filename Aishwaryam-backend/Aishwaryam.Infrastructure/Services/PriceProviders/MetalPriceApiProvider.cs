using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Aishwaryam.Application.Interfaces.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Aishwaryam.Infrastructure.Services.PriceProviders
{
    public class MetalPriceApiProvider : IGoldPriceProvider
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _config;
        private readonly ILogger<MetalPriceApiProvider> _logger;

        public string ProviderName => "MetalPriceAPI";
        public int Priority => 1;

        private const decimal OunceToGram = 31.1035m;
        private const decimal AdjustmentFactor = 1.27m; 
        private const decimal Carat22Factor = 0.916m;

        public MetalPriceApiProvider(IHttpClientFactory httpClientFactory, IConfiguration config, ILogger<MetalPriceApiProvider> logger)
        {
            _httpClientFactory = httpClientFactory;
            _config = config;
            _logger = logger;
        }

        public async Task<GoldPriceResult?> GetLatestPriceAsync()
        {
            try
            {
                var apiKey = _config["GoldPrice:MetalPriceApiKey"] ?? "21c5c79083cc9c0ea79078b9f7fec774";
                var client = _httpClientFactory.CreateClient();
                var response = await client.GetAsync($"https://api.metalpriceapi.com/v1/latest?api_key={apiKey}&base=USD&currencies=INR,XAU");

                if (!response.IsSuccessStatusCode) return null;

                var content = await response.Content.ReadAsStringAsync();
                var apiData = JsonSerializer.Deserialize<MetalPriceApiResponse>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (apiData != null && apiData.Success && apiData.Rates != null)
                {
                    decimal usdXau = apiData.Rates.USDXAU;
                    decimal usdToInr = apiData.Rates.INR;

                    decimal price24K = (usdXau / OunceToGram) * usdToInr * AdjustmentFactor;
                    decimal price22K = price24K * Carat22Factor;

                    return new GoldPriceResult
                    {
                        Price24K = price24K,
                        Price22K = price22K,
                        PriceSilver = 99.00m,
                        BuyPrice = price22K,
                        SellPrice = price22K * 0.97m,
                        Source = ProviderName,
                        Timestamp = DateTime.UtcNow
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch price from {Provider}", ProviderName);
            }
            return null;
        }

        private class MetalPriceApiResponse
        {
            public bool Success { get; set; }
            public MetalPriceRates? Rates { get; set; }
        }

        private class MetalPriceRates
        {
            public decimal INR { get; set; }
            public decimal USDXAU { get; set; }
        }
    }
}
