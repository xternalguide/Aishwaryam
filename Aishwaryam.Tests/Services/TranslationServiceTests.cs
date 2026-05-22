using System;
using System.Net.Http;
using System.Threading.Tasks;
using Xunit;
using Moq;
using Aishwaryam.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Aishwaryam.Tests.Services
{
    public class TranslationServiceTests
    {
        private readonly Mock<IConfiguration> _configMock;
        private readonly Mock<ILogger<GoogleTranslationService>> _loggerMock;
        private readonly HttpClient _httpClient;

        public TranslationServiceTests()
        {
            _configMock = new Mock<IConfiguration>();
            _loggerMock = new Mock<ILogger<GoogleTranslationService>>();
            _httpClient = new HttpClient();
        }

        [Fact]
        public async Task TranslateToTamilAsync_PlaceholderKey_ReturnsMockTamilTranslation()
        {
            // Arrange
            _configMock.Setup(c => c["Translation:ApiKey"]).Returns("GOOGLE_TRANSLATION_KEY_NOT_SET");
            var service = new GoogleTranslationService(_httpClient, _configMock.Object, _loggerMock.Object);

            // Act
            var result = await service.TranslateToTamilAsync("Hello World");

            // Assert
            Assert.Equal("[TAMIL] Hello World", result);
        }

        [Fact]
        public async Task TranslateAsync_PlaceholderKey_ReturnsMockCustomTargetTranslation()
        {
            // Arrange
            _configMock.Setup(c => c["Translation:ApiKey"]).Returns("GOOGLE_TRANSLATION_KEY_NOT_SET");
            var service = new GoogleTranslationService(_httpClient, _configMock.Object, _loggerMock.Object);

            // Act
            var result = await service.TranslateAsync("Welcome Home", "en", "fr");

            // Assert
            Assert.Equal("[FR] Welcome Home", result);
        }

        [Fact]
        public async Task TranslateAsync_EmptyInput_ReturnsEmptyString()
        {
            // Arrange
            var service = new GoogleTranslationService(_httpClient, _configMock.Object, _loggerMock.Object);

            // Act
            var result = await service.TranslateAsync("", "en", "ta");

            // Assert
            Assert.Equal(string.Empty, result);
        }
    }
}
