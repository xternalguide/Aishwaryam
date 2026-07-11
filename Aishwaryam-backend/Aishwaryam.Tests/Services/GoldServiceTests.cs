using System;
using System.Threading.Tasks;
using Xunit;
using Moq;
using Aishwaryam.Application.Services;
using Aishwaryam.Application.Interfaces.Repositories;
using Aishwaryam.Application.Interfaces.Services;
using Aishwaryam.Application.DTOs.Gold;
using Aishwaryam.Domain.Entities;

namespace Aishwaryam.Tests.Services
{
    public class GoldServiceTests
    {
        private readonly Mock<IGoldRepository> _goldRepoMock;
        private readonly Mock<IWalletService> _walletServiceMock;
        private readonly Mock<ISchemeRepository> _schemeRepoMock;
        private readonly Mock<INotificationService> _notificationServiceMock;
        private readonly Mock<IKycComplianceService> _kycComplianceServiceMock;
        private readonly Mock<System.Net.Http.IHttpClientFactory> _httpClientFactoryMock;
        private readonly Mock<Microsoft.Extensions.Caching.Memory.IMemoryCache> _cacheMock;
        private readonly Mock<IGoldPriceManager> _priceManagerMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IAuthRepository> _authRepoMock;
        private readonly Mock<IEmailService> _emailServiceMock;
        private readonly GoldService _goldService;

        public GoldServiceTests()
        {
            _goldRepoMock = new Mock<IGoldRepository>();
            _walletServiceMock = new Mock<IWalletService>();
            _schemeRepoMock = new Mock<ISchemeRepository>();
            _notificationServiceMock = new Mock<INotificationService>();
            _kycComplianceServiceMock = new Mock<IKycComplianceService>();
            _httpClientFactoryMock = new Mock<System.Net.Http.IHttpClientFactory>();
            _cacheMock = new Mock<Microsoft.Extensions.Caching.Memory.IMemoryCache>();
            _priceManagerMock = new Mock<IGoldPriceManager>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _authRepoMock = new Mock<IAuthRepository>();
            _emailServiceMock = new Mock<IEmailService>();

            // Setup default behaviors
            _goldRepoMock.Setup(r => r.GetActiveOffersAsync(It.IsAny<Guid>()))
                .ReturnsAsync(new System.Collections.Generic.List<PromotionalOffer>());

            _goldService = new GoldService(
                _goldRepoMock.Object,
                _walletServiceMock.Object,
                _schemeRepoMock.Object,
                _notificationServiceMock.Object,
                _kycComplianceServiceMock.Object,
                _httpClientFactoryMock.Object,
                _cacheMock.Object,
                _priceManagerMock.Object,
                _unitOfWorkMock.Object,
                _authRepoMock.Object,
                _emailServiceMock.Object
            );
        }

        [Fact]
        public async Task BuyGoldAsync_ValidPriceLock_SucceedsWithLockedPrice()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var priceLockId = Guid.NewGuid().ToString();
            
            // Mock price resolution for lock ID
            _priceManagerMock.Setup(pm => pm.GetLockedPriceAsync(priceLockId))
                .ReturnsAsync(new GoldPriceResult { BuyPrice = 7500.00m, SellPrice = 7100.00m, Source = "MetalPriceAPI", Timestamp = DateTime.UtcNow });
                
            // Mock wallet balance check
            _walletServiceMock.Setup(ws => ws.GetBalanceAsync(userId))
                .ReturnsAsync(new Aishwaryam.Application.DTOs.Wallet.WalletBalanceResponse { BalancePaise = 750000 });
                
            _walletServiceMock.Setup(ws => ws.ProcessTransactionAsync(It.IsAny<Aishwaryam.Application.DTOs.Wallet.WalletTransactionRequest>()))
                .ReturnsAsync(new Aishwaryam.Application.DTOs.Wallet.WalletBalanceResponse { BalancePaise = 0 });
            
            var request = new BuyGoldRequest 
            { 
                UserId = userId,
                TotalAmountPaise = 750000, 
                PriceLockId = priceLockId
            };

            // Act
            var result = await _goldService.BuyGoldAsync(request);

            // Assert
            Assert.True(result.Success);
            Assert.Equal(970, result.GoldWeightMg); // 970 mg after 3% GST is deducted
            Assert.Equal(750000, result.PricePerGmPaise);
        }

        [Fact]
        public async Task BuyGoldAsync_InvalidPriceLock_Fails()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var invalidLockId = "invalid-lock-123";
            
            // Mock wallet balance check so it passes the first check
            _walletServiceMock.Setup(ws => ws.GetBalanceAsync(userId))
                .ReturnsAsync(new Aishwaryam.Application.DTOs.Wallet.WalletBalanceResponse { BalancePaise = 100000 });
                
            // Mock rejection of invalid/expired lock
            _priceManagerMock.Setup(pm => pm.GetLockedPriceAsync(invalidLockId))
                .ReturnsAsync((GoldPriceResult?)null);
                
            var request = new BuyGoldRequest 
            { 
                UserId = userId,
                TotalAmountPaise = 100000,
                PriceLockId = invalidLockId
            };

            // Act
            var result = await _goldService.BuyGoldAsync(request);
            
            // Assert
            Assert.False(result.Success);
            Assert.Equal("Price lock expired or invalid.", result.Message);
        }

        [Fact]
        public async Task SellGoldAsync_InsufficientRedeemableBalance_Fails()
        {
            // Arrange
            var userId = Guid.NewGuid();
            
            // Mock portfolio with 5g total, but only 2g redeemable (3g locked in schemes)
            _goldRepoMock.Setup(r => r.GetGoldStatusAsync(userId))
                .ReturnsAsync((3000L, 0L, 2000L, 0L)); // (LockedMg, MaturedRedeemableMg, RedeemableMg, RedeemedMg)
                
            _priceManagerMock.Setup(pm => pm.GetPriceAsync())
                .ReturnsAsync(new GoldPriceResult { BuyPrice = 7500.00m, SellPrice = 7100.00m, Source = "MetalPriceAPI", Timestamp = DateTime.UtcNow });
                
            _kycComplianceServiceMock.Setup(cs => cs.ValidateRedemptionAsync(userId, 2500, "CASH_OUT"))
                .ReturnsAsync(new Aishwaryam.Application.Interfaces.Services.ComplianceCheckResult { IsAllowed = true, Message = "Allowed" });
            
            var request = new SellGoldRequest 
            { 
                UserId = userId,
                GoldWeightMg = 2500, // Trying to sell 2.5g, but only 2g redeemable
                PriceLockId = null // Let it fetch live price
            };

            // Act
            var result = await _goldService.SellGoldAsync(request);

            // Assert
            Assert.False(result.Success);
            Assert.Contains("Insufficient redeemable gold", result.Message);
        }
    }
}
