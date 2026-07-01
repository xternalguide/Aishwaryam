using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Aishwaryam.Infrastructure.Services
{
    public interface IDigioKycService
    {
        Task<DigioKycSessionResponse?> CreateKycSessionAsync(string customerEmail, string templateKey);
        Task<DigioKycStatusResponse?> VerifyKycSessionAsync(string kycRequestId);
    }

    public class DigioKycService : IDigioKycService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<DigioKycService> _logger;
        private readonly string _apiBaseUrl;
        private readonly string _clientId;
        private readonly string _clientSecret;

        public DigioKycService(HttpClient httpClient, IConfiguration configuration, ILogger<DigioKycService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;

            _apiBaseUrl = configuration["Digio:BaseUrl"] ?? "https://ext.digio.in:444";
            _clientId = configuration["Digio:ClientId"] ?? "AI_DEMO_CLIENT_ID";
            _clientSecret = configuration["Digio:ClientSecret"] ?? "AI_DEMO_CLIENT_SECRET";

            var authBytes = Encoding.UTF8.GetBytes($"{_clientId}:{_clientSecret}");
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(authBytes));
        }

        public async Task<DigioKycSessionResponse?> CreateKycSessionAsync(string customerEmail, string templateKey)
        {
            try
            {
                var payload = new
                {
                    customer_identifier = customerEmail,
                    template_key = templateKey,
                    notify = false,
                    generate_access_token = true
                };

                var response = await _httpClient.PostAsync($"{_apiBaseUrl}/v2/client/kyc/request", 
                    new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"));

                if (!response.IsSuccessStatusCode)
                {
                    var errBody = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Digio API error: {response.StatusCode} - {errBody}");
                    return null;
                }

                var responseBody = await response.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<DigioKycSessionResponse>(responseBody, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception while calling Digio CreateKycSession");
                return null;
            }
        }

        public async Task<DigioKycStatusResponse?> VerifyKycSessionAsync(string kycRequestId)
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_apiBaseUrl}/v2/client/kyc/status/{kycRequestId}");
                if (!response.IsSuccessStatusCode)
                {
                    var errBody = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Digio API error status: {response.StatusCode} - {errBody}");
                    return null;
                }

                var responseBody = await response.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<DigioKycStatusResponse>(responseBody, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Exception verifying Digio session: {kycRequestId}");
                return null;
            }
        }
    }

    public class DigioKycSessionResponse
    {
        public string Id { get; set; } = string.Empty; // kyc_request_id
        public string Status { get; set; } = string.Empty;
        public string? CustomerIdentifier { get; set; }
        public DigioAccessToken? AccessToken { get; set; }
    }

    public class DigioAccessToken
    {
        public string Id { get; set; } = string.Empty;
        public string EntityId { get; set; } = string.Empty;
    }

    public class DigioKycStatusResponse
    {
        public string Id { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty; // e.g. "approved", "rejected", "pending"
        public string? FailureReason { get; set; }
        public DigioDetails? Details { get; set; }
    }

    public class DigioDetails
    {
        public string? CustomerName { get; set; }
        public string? DocumentNumber { get; set; }
    }
}
