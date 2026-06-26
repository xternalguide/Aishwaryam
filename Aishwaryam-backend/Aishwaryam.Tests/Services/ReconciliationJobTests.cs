using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Xunit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Aishwaryam.Infrastructure.Jobs;
using Aishwaryam.Infrastructure.Data;
using Aishwaryam.Domain.Entities;

namespace Aishwaryam.Tests.Services
{
    public class ReconciliationJobTests
    {
        private static TestDbContext GetDb() =>
            new TestDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .EnableServiceProviderCaching(false)
                .Options);

        private static IServiceProvider GetServiceProvider(ApplicationDbContext db)
        {
            var services = new ServiceCollection();
            services.AddSingleton(db);
            return services.BuildServiceProvider();
        }

        [Fact]
        public async Task RunReconciliationAsync_NoDiscrepancies_DoesNotSuspendOrAlert()
        {
            // Arrange
            var db = GetDb();
            var userId = Guid.NewGuid();
            
            // 1. Create a user
            var user = new User { Id = userId, FullName = "Perfect User", PhoneNumber = "1234567890", IsActive = true };
            db.Users.Add(user);

            // 2. Add matching gold holdings and transactions (BUY 5000mg, SELL 2000mg = 3000mg balance)
            db.GoldHoldings.Add(new GoldHolding { UserId = userId, GoldBalanceMg = 3000 });
            db.GoldTransactions.Add(new GoldTransaction { UserId = userId, TransactionType = "BUY", GoldWeightMg = 5000, IpAddress = "127.0.0.1", DeviceFingerprint = "test" });
            db.GoldTransactions.Add(new GoldTransaction { UserId = userId, TransactionType = "SELL", GoldWeightMg = 2000, IpAddress = "127.0.0.1", DeviceFingerprint = "test" });

            // 3. Add matching wallet and ledgers (CREDIT 10000 paise, DEBIT 4000 paise = 6000 paise balance)
            db.Wallets.Add(new Wallet { UserId = userId, InrBalancePaise = 6000 });
            db.WalletLedgers.Add(new WalletLedger { UserId = userId, TransactionType = "CREDIT", AmountPaise = 10000, Description = "Credit" });
            db.WalletLedgers.Add(new WalletLedger { UserId = userId, TransactionType = "DEBIT", AmountPaise = 4000, Description = "Debit" });

            await db.SaveChangesAsync();

            var serviceProvider = GetServiceProvider(db);
            var loggerMock = new Mock<ILogger<NightlyReconciliationJob>>();
            var job = new NightlyReconciliationJob(serviceProvider, loggerMock.Object);

            // Act
            await job.RunReconciliationAsync(CancellationToken.None);

            // Assert
            var auditedUser = await db.Users.FindAsync(userId);
            Assert.True(auditedUser!.IsActive); // Should remain active

            var alertsCount = await db.AdminAlerts.CountAsync();
            Assert.Equal(0, alertsCount); // No alerts created

            var auditsCount = await db.PlatformAuditLogs.CountAsync();
            Assert.Equal(0, auditsCount); // No failure logs
        }

        [Fact]
        public async Task RunReconciliationAsync_GoldDiscrepancy_SuspendsUserAndCreatesAlertAndAudit()
        {
            // Arrange
            var db = GetDb();
            var userId = Guid.NewGuid();
            
            // 1. Create a user
            var user = new User { Id = userId, FullName = "Cheating Gold User", PhoneNumber = "1234567891", IsActive = true };
            db.Users.Add(user);

            // 2. Add MISMATCHED gold holdings and transactions (computed = 3000mg, actual = 5000mg)
            db.GoldHoldings.Add(new GoldHolding { UserId = userId, GoldBalanceMg = 5000 }); // Extra gold on holding!
            db.GoldTransactions.Add(new GoldTransaction { UserId = userId, TransactionType = "BUY", GoldWeightMg = 5000, IpAddress = "127.0.0.1", DeviceFingerprint = "test" });
            db.GoldTransactions.Add(new GoldTransaction { UserId = userId, TransactionType = "SELL", GoldWeightMg = 2000, IpAddress = "127.0.0.1", DeviceFingerprint = "test" });

            // 3. Add matching wallet and ledgers (to isolate failure)
            db.Wallets.Add(new Wallet { UserId = userId, InrBalancePaise = 6000 });
            db.WalletLedgers.Add(new WalletLedger { UserId = userId, TransactionType = "CREDIT", AmountPaise = 10000, Description = "Credit" });
            db.WalletLedgers.Add(new WalletLedger { UserId = userId, TransactionType = "DEBIT", AmountPaise = 4000, Description = "Debit" });

            await db.SaveChangesAsync();

            var serviceProvider = GetServiceProvider(db);
            var loggerMock = new Mock<ILogger<NightlyReconciliationJob>>();
            var job = new NightlyReconciliationJob(serviceProvider, loggerMock.Object);

            // Act
            await job.RunReconciliationAsync(CancellationToken.None);

            // Assert
            var auditedUser = await db.Users.FindAsync(userId);
            Assert.False(auditedUser!.IsActive); // MUST BE DEACTIVATED

            // Verify AdminAlert
            var alert = await db.AdminAlerts.FirstOrDefaultAsync(a => a.UserId == userId);
            Assert.NotNull(alert);
            Assert.Equal("GOLD_BALANCE_MISMATCH", alert.AlertType);
            Assert.Contains("Gold balance discrepancy detected", alert.Message);

            // Verify PlatformAuditLog
            var audit = await db.PlatformAuditLogs.FirstOrDefaultAsync(a => a.UserId == userId);
            Assert.NotNull(audit);
            Assert.Equal("GOLD_RECONCILIATION_FAIL", audit.Action);
            Assert.Equal("FAILED", audit.Status);
        }

        [Fact]
        public async Task RunReconciliationAsync_WalletDiscrepancy_SuspendsUserAndCreatesAlertAndAudit()
        {
            // Arrange
            var db = GetDb();
            var userId = Guid.NewGuid();
            
            // 1. Create a user
            var user = new User { Id = userId, FullName = "Cheating Wallet User", PhoneNumber = "1234567892", IsActive = true };
            db.Users.Add(user);

            // 2. Add matching gold holdings and transactions (to isolate failure)
            db.GoldHoldings.Add(new GoldHolding { UserId = userId, GoldBalanceMg = 3000 });
            db.GoldTransactions.Add(new GoldTransaction { UserId = userId, TransactionType = "BUY", GoldWeightMg = 5000, IpAddress = "127.0.0.1", DeviceFingerprint = "test" });
            db.GoldTransactions.Add(new GoldTransaction { UserId = userId, TransactionType = "SELL", GoldWeightMg = 2000, IpAddress = "127.0.0.1", DeviceFingerprint = "test" });

            // 3. Add MISMATCHED wallet and ledgers (computed = 6000 paise, actual = 10000 paise)
            db.Wallets.Add(new Wallet { UserId = userId, InrBalancePaise = 10000 }); // Extra INR on wallet!
            db.WalletLedgers.Add(new WalletLedger { UserId = userId, TransactionType = "CREDIT", AmountPaise = 10000, Description = "Credit" });
            db.WalletLedgers.Add(new WalletLedger { UserId = userId, TransactionType = "DEBIT", AmountPaise = 4000, Description = "Debit" });

            await db.SaveChangesAsync();

            var serviceProvider = GetServiceProvider(db);
            var loggerMock = new Mock<ILogger<NightlyReconciliationJob>>();
            var job = new NightlyReconciliationJob(serviceProvider, loggerMock.Object);

            // Act
            await job.RunReconciliationAsync(CancellationToken.None);

            // Assert
            var auditedUser = await db.Users.FindAsync(userId);
            Assert.False(auditedUser!.IsActive); // MUST BE DEACTIVATED

            // Verify AdminAlert
            var alert = await db.AdminAlerts.FirstOrDefaultAsync(a => a.UserId == userId);
            Assert.NotNull(alert);
            Assert.Equal("WALLET_BALANCE_MISMATCH", alert.AlertType);
            Assert.Contains("INR Wallet balance discrepancy detected", alert.Message);

            // Verify PlatformAuditLog
            var audit = await db.PlatformAuditLogs.FirstOrDefaultAsync(a => a.UserId == userId);
            Assert.NotNull(audit);
            Assert.Equal("WALLET_RECONCILIATION_FAIL", audit.Action);
            Assert.Equal("FAILED", audit.Status);
        }
    }
}
