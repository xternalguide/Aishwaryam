using System;
using System.Net.Http;
using System.Threading.Tasks;
using Aishwaryam.Application.Interfaces.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Aishwaryam.Infrastructure.Services
{
    public class Fast2SmsService : ISmsService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly ILogger<Fast2SmsService> _logger;

        public Fast2SmsService(IConfiguration config, ILogger<Fast2SmsService> logger)
        {
            _httpClient = new HttpClient();
            _httpClient.Timeout = TimeSpan.FromSeconds(5);
            _apiKey = config["Sms:ApiKey"] ?? "FAKE_KEY_FOR_DEV";
            _logger = logger;
        }

        public async Task<(bool Success, string ErrorMessage)> SendSmsAsync(string phoneNumber, string message)
        {
            try
            {
                // In production, use the real Fast2SMS / MSG91 API
                // Example: https://www.fast2sms.com/dev/bulkV2?authorization=YOUR_API_KEY&route=otp&variables_values=123456&numbers=9999999999
                
                _logger.LogInformation($"[SMS GATEWAY] Sending to {phoneNumber}: {message}");

                if (_apiKey == "FAKE_KEY_FOR_DEV")
                {
                    _logger.LogWarning("SMS API Key is missing. Using Console Gateway.");
                    return (true, "Console simulated success");
                }

                var url = $"https://www.fast2sms.com/dev/bulkV2?authorization={_apiKey}&route=otp&variables_values={message}&numbers={phoneNumber}";
                
                var response = await _httpClient.GetAsync(url);
                if (response.IsSuccessStatusCode)
                {
                    return (true, "");
                }
                
                var errContent = await response.Content.ReadAsStringAsync();
                return (false, $"HTTP {(int)response.StatusCode}: {errContent}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to send SMS to {phoneNumber}");
                return (false, ex.Message);
            }
        }
    }
}
