using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Aishwaryam.Application.Interfaces.Services;
using Aishwaryam.Infrastructure.Data;
using Microsoft.Extensions.Logging;

namespace Aishwaryam.Infrastructure.Services
{
    /// <summary>
    /// Unified notification dispatcher — single entry point to send:
    ///   1. FCM Push Notification (via INotificationService)
    ///   2. SMS (via ISmsService)
    ///   3. Transactional Email (via IEmailService)
    ///
    /// Channels are fully independent — a failure in one does not affect others.
    /// All errors are caught and logged. This is fire-and-forget safe.
    ///
    /// Deep-link data is embedded in FCM push payload so Android can route
    /// directly to the correct screen when the notification is tapped.
    /// </summary>
    public class NotificationDispatcher : INotificationDispatcher
    {
        private readonly INotificationService _push;
        private readonly ISmsService _sms;
        private readonly IEmailService _email;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<NotificationDispatcher> _logger;

        public NotificationDispatcher(
            INotificationService push,
            ISmsService sms,
            IEmailService email,
            ApplicationDbContext context,
            ILogger<NotificationDispatcher> logger)
        {
            _push = push;
            _sms = sms;
            _email = email;
            _context = context;
            _logger = logger;
        }

        public async Task DispatchAsync(NotificationPayload payload)
        {
            var tasks = new List<Task>();

            // ── 1. In-App + FCM Push ─────────────────────────────────────────
            if (payload.SendPush)
            {
                tasks.Add(SendPushSafe(payload));
            }

            // ── 2. SMS ───────────────────────────────────────────────────────
            if (payload.SendSms && !string.IsNullOrEmpty(payload.ToPhone) && !string.IsNullOrEmpty(payload.SmsText))
            {
                tasks.Add(SendSmsSafe(payload.ToPhone, payload.SmsText));
            }

            // ── 3. Email ─────────────────────────────────────────────────────
            if (payload.SendEmail && !string.IsNullOrEmpty(payload.ToEmail) && payload.EmailTemplate.HasValue)
            {
                tasks.Add(SendEmailSafe(payload));
            }

            // Run all channels in parallel — no channel blocks another
            await Task.WhenAll(tasks);
        }

        // ── Private safe wrappers (never throw) ─────────────────────────────

        private async Task SendPushSafe(NotificationPayload payload)
        {
            try
            {
                // NotificationService persists to DB + dispatches FCM with deep-link data
                // We extend the call via the enhanced SendNotificationWithDataAsync if available,
                // otherwise fall back to the base interface.
                if (_push is NotificationService enhanced)
                {
                    await enhanced.SendNotificationWithDataAsync(
                        payload.UserId,
                        payload.Title,
                        payload.Body,
                        payload.Type,
                        payload.PushData ?? BuildDefaultPushData(payload));
                }
                else
                {
                    await _push.SendNotificationAsync(payload.UserId, payload.Title, payload.Body, payload.Type);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[DISPATCHER] Push failed for user {UserId}", payload.UserId);
            }
        }

        private async Task SendSmsSafe(string phone, string message)
        {
            try
            {
                var result = await _sms.SendSmsAsync(phone, message);
                if (!result)
                    _logger.LogWarning("[DISPATCHER] SMS delivery failed to {Phone}", phone);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[DISPATCHER] SMS exception to {Phone}", phone);
            }
        }

        private async Task SendEmailSafe(NotificationPayload payload)
        {
            try
            {
                await _email.SendTemplatedAsync(
                    payload.ToEmail!,
                    payload.ToName ?? "Customer",
                    payload.EmailTemplate!.Value,
                    payload.EmailData ?? new { UserName = payload.ToName, Title = payload.Title, Body = payload.Body });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[DISPATCHER] Email exception to {Email}", payload.ToEmail);
            }
        }

        // ── Deep-link data helpers ───────────────────────────────────────────

        private static Dictionary<string, string> BuildDefaultPushData(NotificationPayload payload)
        {
            // Android reads "screen" key to determine navigation target
            var screen = payload.Type switch
            {
                "PAYMENT_SUCCESS"   => NotificationScreens.TransactionHistory,
                "SCHEME_JOINED"     => NotificationScreens.SchemeDetail,
                "SCHEME_MATURED"    => NotificationScreens.SchemeDetail,
                "INSTALLMENT_SUCCESS" => NotificationScreens.SchemeDetail,
                "GOLD_REDEEMED"     => NotificationScreens.TransactionHistory,
                "KYC_APPROVED"      => NotificationScreens.KycScreen,
                "REFERRAL_REWARD"   => NotificationScreens.ReferralScreen,
                _                   => NotificationScreens.Dashboard
            };

            return new Dictionary<string, string>
            {
                { "screen", screen },
                { "type",   payload.Type },
                { "entityId", "" }   // caller can override with specific scheme/tx ID
            };
        }
    }
}
