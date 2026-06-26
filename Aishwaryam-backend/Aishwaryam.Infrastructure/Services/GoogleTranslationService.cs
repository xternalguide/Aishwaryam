using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Aishwaryam.Application.Interfaces.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Aishwaryam.Infrastructure.Services
{
    public class GoogleTranslationService : ITranslationService
    {
        private const string TranslationApiUrl = "https://translation.googleapis.com/language/translate/v2";
        private const string PlaceholderKey = "GOOGLE_TRANSLATION_KEY_NOT_SET";

        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly ILogger<GoogleTranslationService> _logger;

        public GoogleTranslationService(
            HttpClient httpClient,
            IConfiguration config,
            ILogger<GoogleTranslationService> logger)
        {
            _httpClient = httpClient;
            _apiKey = config["Translation:ApiKey"] ?? PlaceholderKey;
            _logger = logger;
        }

        public async Task<string> TranslateToTamilAsync(string text)
        {
            return await TranslateAsync(text, "en", "ta");
        }

        public async Task<string> TranslateAsync(string text, string sourceLanguage, string targetLanguage)
        {
            if (string.IsNullOrEmpty(text))
            {
                return string.Empty;
            }

            // Local development / UAT Mode mock fallback
            if (_apiKey == PlaceholderKey)
            {
                _logger.LogWarning("[TRANSLATION-DEV] API key is not configured. Returning local mock translation for target '{Target}': {Text}", targetLanguage, text);
                
                if (targetLanguage.Equals("ta", StringComparison.OrdinalIgnoreCase))
                {
                    // Provide a nice bilingual indicator for testing
                    return $"[TAMIL] {text}";
                }
                return $"[{targetLanguage.ToUpper()}] {text}";
            }

            try
            {
                var payload = new TranslationRequest
                {
                    Query = text,
                    Source = sourceLanguage,
                    Target = targetLanguage,
                    Format = "text"
                };

                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var url = $"{TranslationApiUrl}?key={_apiKey}";
                var response = await _httpClient.PostAsync(url, content);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var result = JsonSerializer.Deserialize<TranslationResponse>(responseBody);
                    if (result?.Data?.Translations != null && result.Data.Translations.Length > 0)
                    {
                        var translatedText = result.Data.Translations[0].TranslatedText;
                        _logger.LogInformation("[TRANSLATION] Translated '{Source}' -> '{Target}': {Original} -> {Translated}", sourceLanguage, targetLanguage, text, translatedText);
                        return translatedText;
                    }
                }

                _logger.LogError("[TRANSLATION] Google API error. Status: {Status}, Response: {Response}", response.StatusCode, responseBody);
                return $"[FALLBACK] {text}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[TRANSLATION] Exception occurred while translating text to target '{Target}'", targetLanguage);
                return $"[ERROR] {text}";
            }
        }

        // ── DTO classes for Google Translate API ──────────────────────────────

        private class TranslationRequest
        {
            [JsonPropertyName("q")]
            public string Query { get; set; } = string.Empty;

            [JsonPropertyName("source")]
            public string Source { get; set; } = string.Empty;

            [JsonPropertyName("target")]
            public string Target { get; set; } = string.Empty;

            [JsonPropertyName("format")]
            public string Format { get; set; } = "text";
        }

        private class TranslationResponse
        {
            [JsonPropertyName("data")]
            public TranslationData? Data { get; set; }
        }

        private class TranslationData
        {
            [JsonPropertyName("translations")]
            public TranslationItem[]? Translations { get; set; }
        }

        private class TranslationItem
        {
            [JsonPropertyName("translatedText")]
            public string TranslatedText { get; set; } = string.Empty;

            [JsonPropertyName("detectedSourceLanguage")]
            public string DetectedSourceLanguage { get; set; } = string.Empty;
        }
    }
}
