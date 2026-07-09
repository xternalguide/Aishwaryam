using System;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Aishwaryam.Infrastructure.Data;
using Aishwaryam.Application.Interfaces.Services;
using Aishwaryam.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;

namespace Aishwaryam.Api.Services
{
    public class DailyErrorEmailJob : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<DailyErrorEmailJob> _logger;

        public DailyErrorEmailJob(IServiceProvider serviceProvider, ILogger<DailyErrorEmailJob> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Daily Error Email Job is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CheckAndSendEmailsAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred executing Daily Error Email Job.");
                }

                // Check every hour
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }

        private async Task CheckAndSendEmailsAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

            // 1. Get last sent timestamp
            var lastSentSetting = await dbContext.SuperAdminSettings.FindAsync("last_error_email_sent_at");
            DateTimeOffset lastSent = DateTimeOffset.UtcNow.AddDays(-1);

            if (lastSentSetting != null && DateTimeOffset.TryParse(lastSentSetting.Value, out var parsed))
            {
                lastSent = parsed;
            }

            // Check if 24 hours have passed
            if (DateTimeOffset.UtcNow - lastSent < TimeSpan.FromHours(24))
            {
                return;
            }

            // 2. Fetch error logs since last sent
            var newErrors = await dbContext.ApiErrorLogs
                .Where(e => e.CreatedAt > lastSent)
                .OrderByDescending(e => e.CreatedAt)
                .Take(50) // Limit to top 50 to avoid massive emails
                .ToListAsync();

            if (newErrors.Count > 0)
            {
                // 3. Get alert email recipients
                var emailsSetting = await dbContext.SuperAdminSettings.FindAsync("alert_emails");
                List<string> emailRecipients = new List<string> { "support@aishwaryamgold.com" };

                if (emailsSetting != null)
                {
                    try
                    {
                        var parsedEmails = JsonSerializer.Deserialize<List<string>>(emailsSetting.Value);
                        if (parsedEmails != null && parsedEmails.Count > 0)
                        {
                            emailRecipients = parsedEmails;
                        }
                    }
                    catch
                    {
                        // Fallback to simple comma-separated check if JSON parsing fails
                        var split = emailsSetting.Value.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries);
                        if (split.Length > 0)
                        {
                            emailRecipients = split.Select(e => e.Trim()).ToList();
                        }
                    }
                }

                // 4. Build HTML report
                var htmlBuilder = new System.Text.StringBuilder();
                htmlBuilder.Append("<h2>Aishwaryam Swarna Mahal - Super Admin Security Exception Report</h2>");
                htmlBuilder.Append($"<p>This report covers database exception logs generated from <b>{lastSent:yyyy-MM-dd HH:mm:ss}</b> to <b>{DateTimeOffset.UtcNow:yyyy-MM-dd HH:mm:ss}</b> (UTC).</p>");
                htmlBuilder.Append($"<p>Total recorded API failures: <b>{newErrors.Count}</b></p>");
                htmlBuilder.Append("<hr/>");

                foreach (var err in newErrors)
                {
                    htmlBuilder.Append("<div style='border: 1px solid #ddd; padding: 12px; margin-bottom: 12px; border-radius: 8px; font-family: monospace;'>");
                    htmlBuilder.Append($"<p><b>Path:</b> <span style='color:#C2185B;'>{err.Method} {err.RequestPath}</span></p>");
                    htmlBuilder.Append($"<p><b>Client IP:</b> {err.ClientIp} | <b>Time:</b> {err.CreatedAt:yyyy-MM-dd HH:mm:ss}</p>");
                    htmlBuilder.Append($"<p><b>Error:</b> <span style='color:#EF4444;'>{err.ErrorMessage}</span></p>");
                    if (!string.IsNullOrEmpty(err.RequestPayload))
                    {
                        htmlBuilder.Append($"<p><b>Payload:</b> <code>{System.Net.WebUtility.HtmlEncode(err.RequestPayload)}</code></p>");
                    }
                    htmlBuilder.Append("</div>");
                }

                string htmlBody = htmlBuilder.ToString();

                // 5. Send email to each recipient
                foreach (var recipient in emailRecipients)
                {
                    try
                    {
                        await emailService.SendAsync(recipient, "Super Admin", "Daily API Error & Security Exception Summary", htmlBody);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Failed to send alert email to {recipient}");
                    }
                }
            }

            // 6. Update last sent timestamp
            if (lastSentSetting == null)
            {
                lastSentSetting = new SuperAdminSetting
                {
                    Key = "last_error_email_sent_at",
                    Value = DateTimeOffset.UtcNow.ToString("O")
                };
                dbContext.SuperAdminSettings.Add(lastSentSetting);
            }
            else
            {
                lastSentSetting.Value = DateTimeOffset.UtcNow.ToString("O");
                lastSentSetting.UpdatedAt = DateTimeOffset.UtcNow;
            }
            await dbContext.SaveChangesAsync();
        }
    }
}
