using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Aishwaryam.Application.Interfaces.Repositories;
using Aishwaryam.Application.Interfaces.Services;
using Aishwaryam.Application.Services;
using Aishwaryam.Domain.Entities;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Aishwaryam.Tests.Resilience
{
    public class ResilienceTests
    {
        private readonly Mock<IGoldService> _mockGoldService;
        private readonly Mock<IWalletService> _mockWalletService;
        private readonly Mock<INotificationDispatcher> _mockNotificationDispatcher;
        private readonly Mock<IAuthRepository> _mockAuthRepo;
        private readonly Mock<IBankingRepository> _mockBankingRepo;
        private readonly Mock<IGoldRepository> _mockGoldRepo;
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<ILogger<PaymentFulfillmentService>> _mockLogger;
        private readonly PaymentFulfillmentService _fulfillmentService;

        public ResilienceTests()
        {
            _mockGoldService = new Mock<IGoldService>();
            _mockWalletService = new Mock<IWalletService>();
            _mockNotificationDispatcher = new Mock<INotificationDispatcher>();
            _mockAuthRepo = new Mock<IAuthRepository>();
            _mockBankingRepo = new Mock<IBankingRepository>();
            _mockGoldRepo = new Mock<IGoldRepository>();
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockLogger = new Mock<ILogger<PaymentFulfillmentService>>();

            _fulfillmentService = new PaymentFulfillmentService(
                _mockUnitOfWork.Object,
                _mockGoldService.Object,
                _mockWalletService.Object,
                _mockNotificationDispatcher.Object,
                _mockAuthRepo.Object,
                _mockBankingRepo.Object,
                _mockGoldRepo.Object,
                _mockLogger.Object
            );
        }

        [Fact]
        public async Task FulfillPayment_DatabaseTransaction_RollsBackOnInternalFailure()
        {
            // Arrange
            var orderId = "order_123";
            var paymentId = "pay_123";
            var userId = Guid.NewGuid();

            var payment = new Payment
            {
                ProviderOrderId = orderId,
                Status = "PENDING",
                UserId = userId,
                AmountPaise = 100000
            };

            _mockAuthRepo.Setup(r => r.IsIdempotencyKeyUsedAsync(paymentId)).ReturnsAsync(false);
            _mockBankingRepo.Setup(r => r.GetPaymentByOrderIdAsync(orderId)).ReturnsAsync(payment);
            
            // Setup internal failure
            _mockGoldService.Setup(s => s.BuyGoldAsync(It.IsAny<Aishwaryam.Application.DTOs.Gold.BuyGoldRequest>()))
                .ThrowsAsync(new Exception("Simulated Outage"));

            // Act
            await Assert.ThrowsAsync<Exception>(() => 
                _fulfillmentService.FulfillPaymentAsync(orderId, paymentId, "TEST_FAILURE"));

            // Assert
            _mockUnitOfWork.Verify(u => u.BeginTransactionAsync(), Times.Once);
            _mockUnitOfWork.Verify(u => u.RollbackAsync(), Times.Once); // Critical validation
            _mockUnitOfWork.Verify(u => u.CommitAsync(), Times.Never);
        }

        [Fact]
        public async Task FulfillPayment_ConcurrentRequests_ExactlyOneSuccess()
        {
            // Arrange
            var orderId = "order_concurrent";
            var paymentId = "pay_concurrent";

            // Simulate that the idempotency key check returns true (already processed)
            _mockAuthRepo.Setup(r => r.IsIdempotencyKeyUsedAsync(paymentId)).ReturnsAsync(true);

            // Act
            var result = await _fulfillmentService.FulfillPaymentAsync(orderId, paymentId, "CONCURRENT_TEST");

            // Assert
            Assert.True(result.Success);
            Assert.Equal("Already processed", result.Message);
            
            // Should completely skip transaction start because of idempotency
            _mockUnitOfWork.Verify(u => u.BeginTransactionAsync(), Times.Never);
        }
    }
}
