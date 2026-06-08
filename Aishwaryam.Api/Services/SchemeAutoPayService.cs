using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Aishwaryam.Infrastructure.Data;
using Aishwaryam.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Aishwaryam.Application.Interfaces.Services;

namespace Aishwaryam.Api.Services
{
    public class SchemeAutoPayService : BackgroundService
    {
        private readonly ILogger<SchemeAutoPayService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;

        public SchemeAutoPayService(ILogger<SchemeAutoPayService> logger, IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Scheme AutoPay Background Service started.");
            
            // Wait for app startup to complete before first run
            await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessAutoPaysAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred executing AutoPays.");
                }

                // Run once every 24 hours (for demonstration, we could use a library like Hangfire or Quartz for robust cron jobs)
                // For testing purposes during dev, we can set it to run every 5 minutes.
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
        }

        private async Task ProcessAutoPaysAsync()
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

            var now = DateTime.UtcNow;
            var nowUnspecified = DateTime.SpecifyKind(now, DateTimeKind.Unspecified);

            // Find all active schemes where NextDueDate is past or today (using direct date/time comparison with unspecified kind)
            var dueSchemes = await context.UserSchemes
                .Where(s => s.Status == "Active" && s.NextDueDate <= nowUnspecified)
                .ToListAsync();

            foreach (var scheme in dueSchemes)
            {
                if (scheme.AutoPayEnabled)
                {
                    // Mock auto-pay logic. In reality, call Payment Gateway to deduct scheme.InstallmentAmountPaise
                    bool paymentSuccess = false; // Mocking a failure to demonstrate AdminAlert generation

                    if (!paymentSuccess)
                    {
                        scheme.Status = "Defaulted";
                        
                        var alert = new AdminAlert
                        {
                            UserId = scheme.UserId,
                            AlertType = "AutoPayFailed",
                            Message = $"AutoPay failed for {scheme.PlanName}. Amount: {scheme.InstallmentAmountPaise / 100} INR.",
                            CreatedAt = DateTime.UtcNow
                        };
                        context.AdminAlerts.Add(alert);
                        
                        _logger.LogWarning($"AutoPay Failed for UserId {scheme.UserId}");
                        
                        try
                        {
                            await notificationService.SendNotificationAsync(
                                scheme.UserId,
                                "AutoPay Failed! ⚠️",
                                $"AutoPay failed for {scheme.PlanName}. Please check your payment details or pay manually.",
                                "AUTOPAY_FAILED"
                            );
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, $"Failed to send FCM notification for AutoPay failure to user {scheme.UserId}");
                        }
                    }
                    else
                    {
                        scheme.InstallmentsPaid += 1;
                        scheme.NextDueDate = scheme.PaymentFrequency == "Daily" ? scheme.NextDueDate.AddDays(1) : scheme.NextDueDate.AddMonths(1);
                    }
                }
                else
                {
                    // Manual pay missed
                    if (scheme.NextDueDate.Date < now.Date)
                    {
                        scheme.Status = "Defaulted";
                        var alert = new AdminAlert
                        {
                            UserId = scheme.UserId,
                            AlertType = "MissedManualPayment",
                            Message = $"User missed manual payment for {scheme.PlanName} due on {scheme.NextDueDate:yyyy-MM-dd}.",
                            CreatedAt = DateTime.UtcNow
                        };
                        context.AdminAlerts.Add(alert);

                        _logger.LogWarning($"Missed manual payment for UserId {scheme.UserId}");

                        try
                        {
                            await notificationService.SendNotificationAsync(
                                scheme.UserId,
                                "Payment Missed! ⚠️",
                                $"You missed the manual payment for {scheme.PlanName} due on {scheme.NextDueDate:yyyy-MM-dd}.",
                                "MANUAL_PAYMENT_MISSED"
                            );
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, $"Failed to send FCM notification for missed manual payment to user {scheme.UserId}");
                        }
                    }
                }
            }

            await context.SaveChangesAsync();
        }
    }
}
