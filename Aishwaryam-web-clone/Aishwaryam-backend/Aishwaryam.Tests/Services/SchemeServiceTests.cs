using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using Moq;
using Aishwaryam.Application.Services;
using Aishwaryam.Application.Interfaces.Repositories;
using Aishwaryam.Application.Interfaces.Services;
using Aishwaryam.Domain.Entities;
using Aishwaryam.Application.DTOs.Gold;
using Aishwaryam.Application.DTOs.Wallet;
using Microsoft.Extensions.Logging;

namespace Aishwaryam.Tests.Services
{
    public class SchemeServiceTests
    {
        private readonly Mock<ISchemeRepository> _schemeRepoMock;
        private readonly Mock<IGoldRepository> _goldRepoMock;
        private readonly Mock<INotificationService> _notificationServiceMock;
        private readonly Mock<IGoldService> _goldServiceMock;
        private readonly Mock<IKycComplianceService> _kycComplianceServiceMock;
        private readonly Mock<IAuthRepository> _authRepoMock;
        private readonly Mock<INotificationDispatcher> _dispatcherMock;
        private readonly Mock<IWalletService> _walletServiceMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<ILogger<SchemeService>> _loggerMock;
        private readonly SchemeService _schemeService;

        public SchemeServiceTests()
        {
            _schemeRepoMock = new Mock<ISchemeRepository>();
            _goldRepoMock = new Mock<IGoldRepository>();
            _notificationServiceMock = new Mock<INotificationService>();
            _goldServiceMock = new Mock<IGoldService>();
            _kycComplianceServiceMock = new Mock<IKycComplianceService>();
            _authRepoMock = new Mock<IAuthRepository>();
            _dispatcherMock = new Mock<INotificationDispatcher>();
            _walletServiceMock = new Mock<IWalletService>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _loggerMock = new Mock<ILogger<SchemeService>>();

            _schemeService = new SchemeService(
                _schemeRepoMock.Object,
                _goldRepoMock.Object,
                _notificationServiceMock.Object,
                _goldServiceMock.Object,
                _kycComplianceServiceMock.Object,
                _authRepoMock.Object,
                _dispatcherMock.Object,
                _walletServiceMock.Object,
                _unitOfWorkMock.Object,
                _loggerMock.Object
            );
        }

        [Fact]
        public async Task InvestInSchemeAsync_SuccessfulInvestment_ReturnsLedgerDetails()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var schemeId = Guid.NewGuid();
            var amountPaise = 500000;
            var ip = "127.0.0.1";
            var fingerprint = "fingerprint";

            var userScheme = new UserScheme
            {
                Id = schemeId,
                UserId = userId,
                PlanName = "11-Month Gold Scheme",
                Status = "Active",
                InstallmentsPaid = 2
            };

            _schemeRepoMock.Setup(r => r.GetUserSchemeByIdAsync(schemeId))
                .ReturnsAsync(userScheme);

            _goldServiceMock.Setup(s => s.BuyGoldAsync(It.IsAny<BuyGoldRequest>()))
                .ReturnsAsync(new GoldTransactionResponse
                {
                    Success = true,
                    TransactionId = Guid.NewGuid().ToString(),
                    GoldWeightMg = 65000,
                    BonusGoldMg = 4875,
                    TotalGoldCreditedMg = 69875
                });

            // Act
            var resultObj = await _schemeService.InvestInSchemeAsync(userId, schemeId, amountPaise, null, ip, fingerprint);
            var json = System.Text.Json.JsonSerializer.Serialize(resultObj);
            using var doc = System.Text.Json.JsonDocument.Parse(json);
            var root = doc.RootElement;

            // Assert
            Assert.True(root.GetProperty("Success").GetBoolean());
            Assert.Equal(65000L, root.GetProperty("GoldWeightMg").GetInt64());
            Assert.Equal(4875L, root.GetProperty("BonusGoldMg").GetInt64());
            Assert.Equal(69875L, root.GetProperty("TotalGoldCreditedMg").GetInt64());
        }

        [Fact]
        public async Task RequestRedemptionAsync_MaturedScheme_CreatesPendingRedemption()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var schemeId = Guid.NewGuid();
            var user = new User { Id = userId, PhoneNumber = "919876543210", Email = "test@example.com", FullName = "Test User" };

            var userScheme = new UserScheme
            {
                Id = schemeId,
                UserId = userId,
                PlanName = "11-Month Gold Scheme",
                Status = "Matured",
                AccumulatedGoldMg = 100000
            };

            _schemeRepoMock.Setup(r => r.GetUserSchemeByIdAsync(schemeId))
                .ReturnsAsync(userScheme);

            _kycComplianceServiceMock.Setup(c => c.ValidateRedemptionAsync(userId, 100000, "CASH"))
                .ReturnsAsync(new ComplianceCheckResult { IsAllowed = true });

            _goldServiceMock.Setup(s => s.GetCurrentPriceAsync())
                .ReturnsAsync(new CurrentGoldPriceResponse { SellPricePaise = 700000 });

            _authRepoMock.Setup(r => r.GetUserByIdAsync(userId))
                .ReturnsAsync(user);

            // Act
            var resultObj = await _schemeService.RequestRedemptionAsync(userId, schemeId, "CASH", null);
            var json = System.Text.Json.JsonSerializer.Serialize(resultObj);
            using var doc = System.Text.Json.JsonDocument.Parse(json);
            var root = doc.RootElement;

            // Assert
            Assert.True(root.GetProperty("Success").GetBoolean());
            Assert.Equal("PENDING", root.GetProperty("Status").GetString());
            _schemeRepoMock.Verify(r => r.RecordSchemeRedemptionAsync(It.Is<SchemeRedemption>(
                red => red.UserSchemeId == schemeId && red.GoldWeightMg == 100000 && red.TotalAmountPaise == 70000000
            )), Times.Once);
        }

        [Fact]
        public async Task RequestRedemptionAsync_KycRestricted_FailsCompliance()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var schemeId = Guid.NewGuid();

            var userScheme = new UserScheme
            {
                Id = schemeId,
                UserId = userId,
                PlanName = "11-Month Gold Scheme",
                Status = "Matured",
                AccumulatedGoldMg = 100000
            };

            _schemeRepoMock.Setup(r => r.GetUserSchemeByIdAsync(schemeId))
                .ReturnsAsync(userScheme);

            _kycComplianceServiceMock.Setup(c => c.ValidateRedemptionAsync(userId, 100000, "DELIVERY"))
                .ReturnsAsync(new ComplianceCheckResult { IsAllowed = false, Message = "KYC incomplete for physical delivery" });

            _goldServiceMock.Setup(s => s.GetCurrentPriceAsync())
                .ReturnsAsync(new CurrentGoldPriceResponse { SellPricePaise = 700000 });

            // Act
            var resultObj = await _schemeService.RequestRedemptionAsync(userId, schemeId, "DELIVERY", "123 Main St");
            var json = System.Text.Json.JsonSerializer.Serialize(resultObj);
            using var doc = System.Text.Json.JsonDocument.Parse(json);
            var root = doc.RootElement;

            // Assert
            Assert.False(root.GetProperty("Success").GetBoolean());
            Assert.Contains("KYC incomplete", root.GetProperty("Message").GetString());
        }
        [Fact]
        public async Task GetSchemeProgressAsync_WithCustomBonusTiers_CalculatesProperly()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var schemeId = Guid.NewGuid();
            var masterId = Guid.NewGuid();

            var userScheme = new UserScheme
            {
                Id = schemeId,
                UserId = userId,
                PlanName = "Custom Happy Scheme",
                Status = "Active",
                CreatedAt = DateTime.UtcNow.AddDays(-5), // 5 days ago
                TotalInstallments = 30,
                PaymentFrequency = "Daily",
                MaturityDate = DateTime.UtcNow.AddDays(25)
            };

            var masterScheme = new SchemeMaster
            {
                Id = masterId,
                PlanName = "Custom Happy Scheme",
                Frequency = "Daily",
                TotalInstallments = 30
            };

            var customTiers = new List<SchemeBonusTier>
            {
                new SchemeBonusTier { Id = Guid.NewGuid(), SchemeMasterId = masterId, StartDay = 0, EndDay = 10, BonusPercentage = 10.0m },
                new SchemeBonusTier { Id = Guid.NewGuid(), SchemeMasterId = masterId, StartDay = 11, EndDay = 30, BonusPercentage = 5.0m }
            };

            _schemeRepoMock.Setup(r => r.GetUserSchemeByIdAsync(schemeId))
                .ReturnsAsync(userScheme);

            _schemeRepoMock.Setup(r => r.GetSchemeMasterByPlanNameAsync("Custom Happy Scheme"))
                .ReturnsAsync(masterScheme);

            _schemeRepoMock.Setup(r => r.GetBonusTiersAsync(masterId))
                .ReturnsAsync(customTiers);

            _schemeRepoMock.Setup(r => r.GetSchemeSavingsSummaryAsync(schemeId))
                .ReturnsAsync((50000L, 5000L, 600L));

            // Act
            var resultObj = await _schemeService.GetSchemeProgressAsync(schemeId);
            var json = System.Text.Json.JsonSerializer.Serialize(resultObj);
            using var doc = System.Text.Json.JsonDocument.Parse(json);
            var root = doc.RootElement;

            // Assert
            Assert.Equal(10.0, root.GetProperty("CurrentBonusTierPercent").GetDouble());
            Assert.Equal(5, root.GetProperty("RemainingDaysForCurrentTier").GetInt32());
            Assert.Equal(25, root.GetProperty("RemainingDaysForScheme").GetInt32());
            
            var milestones = root.GetProperty("Milestones");
            Assert.Equal(2, milestones.GetArrayLength());
            Assert.Equal("Tier 0-10 (10%)", milestones[0].GetProperty("Name").GetString());
            Assert.Equal(10.0, milestones[0].GetProperty("BonusPercentage").GetDouble());
            Assert.False(milestones[0].GetProperty("IsAchieved").GetBoolean()); // 5 days is not > 10
        }

        [Fact]
        public async Task GetAllEnrollmentsAsync_ReturnsPaginatedEnrollments()
        {
            // Arrange
            var page = 1;
            var pageSize = 2;
            var enrollmentsList = new List<UserScheme>
            {
                new UserScheme
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    PlanName = "11-Month Gold Scheme",
                    InstallmentAmountPaise = 500000,
                    InstallmentsPaid = 3,
                    TotalInstallments = 11,
                    AccumulatedGoldMg = 15000,
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow,
                    MaturityDate = DateTime.UtcNow.AddMonths(11)
                },
                new UserScheme
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    PlanName = "5-Month Gold Scheme",
                    InstallmentAmountPaise = 1000000,
                    InstallmentsPaid = 1,
                    TotalInstallments = 5,
                    AccumulatedGoldMg = 20000,
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow,
                    MaturityDate = DateTime.UtcNow.AddMonths(5)
                }
            };

            _schemeRepoMock.Setup(r => r.GetEnrollmentsPaginatedAsync(page, pageSize))
                .ReturnsAsync((enrollmentsList, 10)); // Total 10 enrollments

            // Act
            var (enrollments, total) = await _schemeService.GetAllEnrollmentsAsync(page, pageSize);

            // Assert
            Assert.Equal(10, total);
            Assert.Equal(2, enrollments.Count());
            
            var first = enrollments.First();
            var json = System.Text.Json.JsonSerializer.Serialize(first);
            using var doc = System.Text.Json.JsonDocument.Parse(json);
            var root = doc.RootElement;
            
            Assert.Equal("11-Month Gold Scheme", root.GetProperty("planName").GetString());
            Assert.Equal(500000L, root.GetProperty("installmentAmountPaise").GetInt64());
        }
    }
}
