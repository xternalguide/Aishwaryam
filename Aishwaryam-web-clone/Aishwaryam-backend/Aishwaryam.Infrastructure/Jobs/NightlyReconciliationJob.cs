using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Aishwaryam.Infrastructure.Data;
using Aishwaryam.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace Aishwaryam.Infrastructure.Jobs
{
    public class NightlyReconciliationJob : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<NightlyReconciliationJob> _logger;

        public NightlyReconciliationJob(IServiceProvider serviceProvider, ILogger<NightlyReconciliationJob> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Nightly Reconciliation Background Job is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Run daily at 01:00 AM UTC
                    var now = DateTime.UtcNow;
                    var nextRun = now.Date.AddDays(1).AddHours(1); // 01:00 AM next day
                    var delay = nextRun - now;

                    _logger.LogInformation("Next reconciliation run scheduled at {NextRun} UTC (in {DelayHours:F2} hours).", nextRun, delay.TotalHours);

                    // 5-second initial delay upon startup to allow manual verification, then run reconciliation
                    await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
                    
                    _logger.LogInformation("Triggering initial Aishwaryam reconciliation check...");
                    await RunReconciliationAsync(stoppingToken);

                    // Delay until next scheduled nightly run
                    await Task.Delay(delay, stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    _logger.LogInformation("Nightly Reconciliation Job cancellation requested.");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "An error occurred during Nightly Reconciliation run execution.");
                    // Retry after 1 hour on error
                    await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
                }
            }
        }

        public async Task RunReconciliationAsync(CancellationToken cancellationToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            _logger.LogInformation("Starting platform reconciliation audit...");

            var users = await context.Users.Where(u => u.IsActive).ToListAsync(cancellationToken);
            _logger.LogInformation("Found {Count} active users to audit.", users.Count);

            int discrepanciesFound = 0;

            foreach (var user in users)
            {
                try
                {
                    // 1. Audit Gold Balance
                    var actualGoldHolding = await context.GoldHoldings.FirstOrDefaultAsync(h => h.UserId == user.Id, cancellationToken);
                    long actualGoldBalanceMg = actualGoldHolding?.GoldBalanceMg ?? 0;

                    var transactions = await context.GoldTransactions.Where(t => t.UserId == user.Id).ToListAsync(cancellationToken);
                    
                    // Compute calculated gold weight: Sum(BUY) - Sum(SELL)
                    long computedGoldBalanceMg = 0;
                    foreach (var tx in transactions)
                    {
                        if (tx.TransactionType == "BUY")
                        {
                            computedGoldBalanceMg += tx.GoldWeightMg;
                        }
                        else if (tx.TransactionType == "SELL")
                        {
                            computedGoldBalanceMg -= tx.GoldWeightMg;
                        }
                    }

                    if (actualGoldBalanceMg != computedGoldBalanceMg)
                    {
                        discrepanciesFound++;
                        _logger.LogError("RECONCILIATION FAILURE: Gold Balance discrepancy detected for User {UserId} ({UserName}). Actual holding: {Actual} mg. Calculated transactions sum: {Calculated} mg.", 
                            user.Id, user.FullName, actualGoldBalanceMg, computedGoldBalanceMg);

                        // Block further transactions for user to prevent exploit
                        user.IsActive = false;
                        context.Users.Update(user);

                        // Log high-priority admin alert
                        var alert = new AdminAlert
                        {
                            Id = Guid.NewGuid(),
                            UserId = user.Id,
                            AlertType = "GOLD_BALANCE_MISMATCH",
                            Message = $"Gold balance discrepancy detected. Holding balance: {actualGoldBalanceMg} mg, calculated from transactions: {computedGoldBalanceMg} mg. User auto-suspended.",
                            IsResolved = false,
                            CreatedAt = DateTime.UtcNow
                        };
                        context.AdminAlerts.Add(alert);

                        // Log platform audit log
                        var audit = new PlatformAuditLog
                        {
                            Id = Guid.NewGuid(),
                            UserId = user.Id,
                            Action = "GOLD_RECONCILIATION_FAIL",
                            Details = $"Discrepancy: actual={actualGoldBalanceMg}mg, computed={computedGoldBalanceMg}mg. User deactivated.",
                            Status = "FAILED",
                            ErrorMessage = $"Mismatched gold balance: {actualGoldBalanceMg} != {computedGoldBalanceMg}",
                            CreatedAt = DateTime.UtcNow
                        };
                        context.PlatformAuditLogs.Add(audit);
                    }

                    // 2. Audit INR Wallet Ledger Balance
                    var wallet = await context.Wallets.FirstOrDefaultAsync(w => w.UserId == user.Id, cancellationToken);
                    long actualWalletBalancePaise = wallet?.InrBalancePaise ?? 0;

                    var ledgerEntries = await context.WalletLedgers.Where(l => l.UserId == user.Id).ToListAsync(cancellationToken);
                    
                    // Compute calculated wallet balance: Sum(CREDIT) - Sum(DEBIT)
                    long computedWalletBalancePaise = 0;
                    foreach (var entry in ledgerEntries)
                    {
                        if (entry.TransactionType == "CREDIT")
                        {
                            computedWalletBalancePaise += entry.AmountPaise;
                        }
                        else if (entry.TransactionType == "DEBIT")
                        {
                            computedWalletBalancePaise -= entry.AmountPaise;
                        }
                    }

                    if (actualWalletBalancePaise != computedWalletBalancePaise)
                    {
                        discrepanciesFound++;
                        _logger.LogError("RECONCILIATION FAILURE: INR Wallet Balance discrepancy detected for User {UserId} ({UserName}). Actual wallet: {Actual} paise. Calculated ledger: {Calculated} paise.", 
                            user.Id, user.FullName, actualWalletBalancePaise, computedWalletBalancePaise);

                        // Suspend user if not already done
                        user.IsActive = false;
                        context.Users.Update(user);

                        // Log high-priority admin alert
                        var alert = new AdminAlert
                        {
                            Id = Guid.NewGuid(),
                            UserId = user.Id,
                            AlertType = "WALLET_BALANCE_MISMATCH",
                            Message = $"INR Wallet balance discrepancy detected. Holding balance: {actualWalletBalancePaise} paise, calculated from ledger: {computedWalletBalancePaise} paise. User auto-suspended.",
                            IsResolved = false,
                            CreatedAt = DateTime.UtcNow
                        };
                        context.AdminAlerts.Add(alert);

                        // Log platform audit log
                        var audit = new PlatformAuditLog
                        {
                            Id = Guid.NewGuid(),
                            UserId = user.Id,
                            Action = "WALLET_RECONCILIATION_FAIL",
                            Details = $"Discrepancy: actual={actualWalletBalancePaise} paise, computed={computedWalletBalancePaise} paise. User deactivated.",
                            Status = "FAILED",
                            ErrorMessage = $"Mismatched wallet balance: {actualWalletBalancePaise} != {computedWalletBalancePaise}",
                            CreatedAt = DateTime.UtcNow
                        };
                        context.PlatformAuditLogs.Add(audit);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error auditing user {UserId}.", user.Id);
                }
            }

            if (discrepanciesFound > 0)
            {
                await context.SaveChangesAsync(cancellationToken);
                _logger.LogWarning("Reconciliation finished with {Count} discrepancy alerts created.", discrepanciesFound);
            }
            else
            {
                _logger.LogInformation("Reconciliation completed. All active user holdings and wallets are perfectly in balance.");
            }
        }
    }
}
