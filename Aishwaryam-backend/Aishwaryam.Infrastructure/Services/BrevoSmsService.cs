using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Aishwaryam.Application.Interfaces.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Aishwaryam.Infrastructure.Services
{
    public class BrevoSmsService : ISmsService
    {
        private const string BrevoSmsApiUrl = "https://api.brevo.com/v3/transactionalSMS/sms";
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _senderName;
        private readonly ILogger<BrevoSmsService> _logger;

        public BrevoSmsService(IHttpClientFactory httpFactory, IConfiguration config, ILogger<BrevoSmsService> logger)
        {
            _httpClient = httpFactory.CreateClient();
            _apiKey = config["Sms:ApiKey"] ?? config["Email:ApiKey"] ?? "FAKE_KEY_FOR_DEV";
            _senderName = config["Sms:Sender"] ?? "Aishwaryam";
            _logger = logger;
        }

        public async Task<(bool Success, string ErrorMessage)> SendSmsAsync(string phoneNumber, string message)
        {
            try
            {
                // Format phone number to E.164 format with country code (e.g., +91)
                var formattedPhone = phoneNumber;
                if (!formattedPhone.StartsWith("+"))
                {
                    formattedPhone = "+" + formattedPhone;
                }
                
                // For Brevo SMS API, the recipient must be clean number without leading '+'
                var cleanRecipient = formattedPhone.Replace("+", "").Trim();

                _logger.LogInformation($"[BREVO-SMS] Attempting to send SMS to {cleanRecipient}");

                if (_apiKey == "FAKE_KEY_FOR_DEV" || _apiKey == "SET_VIA_RAILWAY_ENVIRONMENT_VARIABLE" || string.IsNullOrWhiteSpace(_apiKey))
                {
                    _logger.LogWarning($"[BREVO-SMS-DEV] SMS API Key is missing. Message: {message}");
                    return (true, "Console simulated success");
                }

                var payload = new
                {
                    sender = _senderName,
                    recipient = cleanRecipient,
                    content = message,
                    type = "transactional"
                };

                var request = new HttpRequestMessage(HttpMethod.Post, BrevoSmsApiUrl);
                request.Headers.Add("api-key", _apiKey);
                request.Content = new StringContent(
                    JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

                var response = await _httpClient.SendAsync(request);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation($"[BREVO-SMS] ✅ SMS sent successfully to {cleanRecipient}");
                    return (true, "");
                }
                else
                {
                    var err = $"HTTP {(int)response.StatusCode}: {responseBody}";
                    _logger.LogError($"[BREVO-SMS] ❌ Failed to send SMS: {err}");
                    return (false, err);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[BREVO-SMS] ❌ Exception occurred while sending SMS to {phoneNumber}");
                return (false, ex.Message);
            }
        }
    }
}
