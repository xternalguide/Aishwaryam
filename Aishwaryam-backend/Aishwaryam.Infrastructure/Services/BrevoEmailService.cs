using System;
using System.Net;
using System.Net.Http;
using System.Net.Mail;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using Aishwaryam.Application.Interfaces.Services;
using Aishwaryam.Domain.Entities;
using Aishwaryam.Infrastructure.Data;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Aishwaryam.Infrastructure.Services
{
    /// <summary>
    /// Transactional email service that supports:
    ///   1. Gmail SMTP  — set Email:Provider = "Gmail" (uses your existing Google account)
    ///   2. Brevo API   — set Email:Provider = "Brevo" (free 300/day)
    ///   3. Dev mode    — when no real credentials found, logs to console only
    ///
    /// Gmail SMTP configuration in appsettings.json:
    ///   "Email": {
    ///     "Provider":     "Gmail",
    ///     "GmailAddress": "yourgmail@gmail.com",
    ///     "GmailAppPassword": "xxxx xxxx xxxx xxxx",   ← 16-digit App Password
    ///     "FromName":     "Aishwaryam Digital Gold"
    ///   }
    ///
    /// Brevo API configuration:
    ///   "Email": {
    ///     "Provider":     "Brevo",
    ///     "ApiKey":       "xkeysib-...",
    ///     "FromAddress":  "noreply@aishwaryam.com",
    ///     "FromName":     "Aishwaryam Digital Gold"
    ///   }
    /// </summary>
    public class BrevoEmailService : IEmailService
    {
        private const string BrevoApiUrl     = "https://api.brevo.com/v3/smtp/email";
        private const string PlaceholderKey  = "BREVO_KEY_NOT_SET";
        private const string PlaceholderPass = "GMAIL_APP_PASSWORD_NOT_SET";

        private readonly HttpClient _http;
        private readonly string _provider;

        // Brevo fields
        private readonly string _brevoApiKey;
        private readonly string _fromAddress;

        // Gmail fields
        private readonly string _gmailAddress;
        private readonly string _gmailAppPassword;

        private readonly string _fromName;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<BrevoEmailService> _logger;

        public BrevoEmailService(
            IHttpClientFactory httpFactory,
            IConfiguration config,
            ApplicationDbContext context,
            ILogger<BrevoEmailService> logger)
        {
            _http             = httpFactory.CreateClient();
            _http.Timeout     = TimeSpan.FromSeconds(5);
            _context          = context;
            _logger           = logger;

            _provider         = config["Email:Provider"] ?? "Brevo";
            _fromName         = config["Email:FromName"] ?? "Aishwaryam Digital Gold";

            // Brevo
            _brevoApiKey      = config["Email:ApiKey"] ?? PlaceholderKey;
            _fromAddress      = config["Email:FromAddress"] ?? "noreply@aishwaryam.com";

            // Gmail
            _gmailAddress     = config["Email:GmailAddress"] ?? "";
            _gmailAppPassword = config["Email:GmailAppPassword"] ?? PlaceholderPass;
        }

        // ── Public API ────────────────────────────────────────────────────────

        public async Task<bool> SendAsync(string toEmail, string toName, string subject, string htmlBody)
        {
            // Save log entry first
            var log = new EmailLog
            {
                Id           = Guid.NewGuid(),
                ToEmail      = toEmail,
                ToName       = toName,
                Subject      = subject,
                TemplateName = "RAW_HTML",
                Status       = "PENDING",
                CreatedAt    = DateTime.UtcNow
            };
            _context.EmailLogs.Add(log);
            await _context.SaveChangesAsync();

            bool sent;

            // Auto-detect mode
            bool gmailConfigured = _provider.Equals("Gmail", StringComparison.OrdinalIgnoreCase)
                                   && !string.IsNullOrEmpty(_gmailAddress)
                                   && _gmailAppPassword != PlaceholderPass;

            bool brevoConfigured = _provider.Equals("Brevo", StringComparison.OrdinalIgnoreCase)
                                   && _brevoApiKey != PlaceholderKey
                                   && _brevoApiKey != "SET_VIA_RAILWAY_ENVIRONMENT_VARIABLE"
                                   && !string.IsNullOrWhiteSpace(_brevoApiKey);

            if (gmailConfigured)
            {
                sent = await SendViaGmailAsync(toEmail, toName, subject, htmlBody, log);
            }
            else if (brevoConfigured)
            {
                sent = await SendViaBrevoAsync(toEmail, toName, subject, htmlBody, log);
            }
            else
            {
                // Dev / console-only mode
                _logger.LogWarning(
                    "[EMAIL-DEV] No real credentials configured. " +
                    "To: {Email} | Subject: {Subject} | " +
                    "Set Email:Provider=Gmail + GmailAddress + GmailAppPassword in appsettings.json",
                    toEmail, subject);
                log.Status             = "SENT";
                log.SentAt             = DateTime.UtcNow;
                log.ProviderMessageId  = $"DEV_{Guid.NewGuid():N}";
                await _context.SaveChangesAsync();
                return true;
            }

            return sent;
        }

        public async Task<bool> SendTemplatedAsync(
            string toEmail, string toName, EmailTemplate template, object templateData)
        {
            var subject = template switch
            {
                EmailTemplate.Welcome               => "Welcome to Aishwaryam Digital Gold! ✦",
                EmailTemplate.GoldPurchaseReceipt   => "Gold Purchase Confirmed ✅",
                EmailTemplate.SchemeJoined          => "You've Joined a Gold Savings Scheme 🏆",
                EmailTemplate.InstallmentSuccess    => "Installment Payment Successful 💰",
                EmailTemplate.GoldRedeemed          => "Gold Redemption Confirmed 🏅",
                EmailTemplate.SchemeMatured         => "🎉 Your Gold Scheme Has Matured!",
                EmailTemplate.KycApproved           => "KYC Approved — Higher Limits Unlocked ✅",
                EmailTemplate.ReferralRewardUnlocked => "Referral Bonus Credited! 🎁",
                _                                   => "Notification from Aishwaryam"
            };

            string html = EmailTemplateRenderer.Render(template, templateData);
            bool result = await SendAsync(toEmail, toName, subject, html);

            // Update template name in log
            try
            {
                var lastLog = await _context.EmailLogs
                    .OrderByDescending(e => e.CreatedAt)
                    .FirstOrDefaultAsync(e => e.ToEmail == toEmail);
                if (lastLog != null)
                {
                    lastLog.TemplateName = template.ToString();
                    await _context.SaveChangesAsync();
                }
            }
            catch { /* non-critical */ }

            return result;
        }

        // ── Gmail SMTP ────────────────────────────────────────────────────────

        private async Task<bool> SendViaGmailAsync(
            string toEmail, string toName, string subject, string htmlBody, EmailLog log)
        {
            try
            {
                using var smtpClient = new SmtpClient("smtp.gmail.com", 587)
                {
                    EnableSsl   = true,
                    Credentials = new NetworkCredential(_gmailAddress, _gmailAppPassword)
                };

                var message = new MailMessage
                {
                    From       = new MailAddress(_gmailAddress, _fromName),
                    Subject    = subject,
                    Body       = htmlBody,
                    IsBodyHtml = true
                };
                message.To.Add(new MailAddress(toEmail, toName));

                await smtpClient.SendMailAsync(message);

                log.Status            = "SENT";
                log.SentAt            = DateTime.UtcNow;
                log.ProviderMessageId = $"GMAIL_{Guid.NewGuid():N}";
                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "[EMAIL-GMAIL] ✅ Sent to {Email}: {Subject}", toEmail, subject);
                return true;
            }
            catch (Exception ex)
            {
                log.Status       = "FAILED";
                log.RetryCount++;
                log.ErrorMessage = ex.Message;
                await _context.SaveChangesAsync();

                _logger.LogError(ex, "[EMAIL-GMAIL] ❌ Failed to send to {Email}", toEmail);
                return false;
            }
        }

        // ── Brevo REST API ────────────────────────────────────────────────────

        private async Task<bool> SendViaBrevoAsync(
            string toEmail, string toName, string subject, string htmlBody, EmailLog log)
        {
            try
            {
                var payload = new
                {
                    sender      = new { email = _fromAddress, name = _fromName },
                    to          = new[] { new { email = toEmail, name = toName } },
                    subject,
                    htmlContent = htmlBody
                };

                var request = new HttpRequestMessage(HttpMethod.Post, BrevoApiUrl);
                request.Headers.Add("api-key", _brevoApiKey);
                request.Content = new StringContent(
                    JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

                var response     = await _http.SendAsync(request);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    string? msgId = null;
                    try
                    {
                        using var doc = JsonDocument.Parse(responseBody);
                        msgId = doc.RootElement.TryGetProperty("messageId", out var mid)
                            ? mid.GetString() : null;
                    }
                    catch { /* ignore */ }

                    log.Status            = "SENT";
                    log.SentAt            = DateTime.UtcNow;
                    log.ProviderMessageId = msgId;
                    await _context.SaveChangesAsync();

                    _logger.LogInformation(
                        "[EMAIL-BREVO] ✅ Sent to {Email}: {Subject} | MsgId: {MsgId}",
                        toEmail, subject, msgId);
                    return true;
                }
                else
                {
                    log.Status       = "FAILED";
                    log.ErrorMessage = $"HTTP {(int)response.StatusCode}: {responseBody}";
                    await _context.SaveChangesAsync();

                    _logger.LogError(
                        "[EMAIL-BREVO] ❌ Failed to {Email}: HTTP {Code} | {Body}",
                        toEmail, (int)response.StatusCode, responseBody);
                    return false;
                }
            }
            catch (Exception ex)
            {
                log.Status       = "FAILED";
                log.RetryCount++;
                log.ErrorMessage = ex.Message;
                await _context.SaveChangesAsync();

                _logger.LogError(ex, "[EMAIL-BREVO] ❌ Exception sending to {Email}", toEmail);
                return false;
            }
        }
    }
}
