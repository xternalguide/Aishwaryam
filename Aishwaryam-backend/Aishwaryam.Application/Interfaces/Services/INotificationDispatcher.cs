using System.Threading.Tasks;

namespace Aishwaryam.Application.Interfaces.Services
{
    /// <summary>
    /// Unified notification dispatcher — single entry point to send Push + SMS + Email
    /// for any platform event. All channels are optional per-call and fire-and-forget safe.
    /// </summary>
    public interface INotificationDispatcher
    {
        /// <summary>
        /// Dispatch a notification across all configured channels (FCM, SMS, Email).
        /// Channels that fail do not block others — all errors are logged.
        /// </summary>
        Task DispatchAsync(NotificationPayload payload);
    }

    /// <summary>
    /// Describes a single notification event to be delivered across multiple channels.
    /// Deep-link data is embedded in PushData for Android FCM payload.
    /// </summary>
    public class NotificationPayload
    {
        // ── Target ──────────────────────────────────────────────────────────
        public System.Guid UserId { get; set; }
        public string? ToPhone { get; set; }    // E.164 format e.g. "919876543210"
        public string? ToEmail { get; set; }
        public string? ToName { get; set; }

        // ── Message Content ─────────────────────────────────────────────────
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;

        /// <summary>Notification type stored in DB (e.g. "PAYMENT_SUCCESS", "SCHEME_JOINED").</summary>
        public string Type { get; set; } = "GENERAL";

        // ── FCM Push ────────────────────────────────────────────────────────
        public bool SendPush { get; set; } = true;

        /// <summary>
        /// Deep-link data included in the FCM payload.
        /// Android reads these keys to route to the correct screen.
        /// Keys: screen, entityId, action
        /// </summary>
        public System.Collections.Generic.Dictionary<string, string>? PushData { get; set; }

        // ── SMS ─────────────────────────────────────────────────────────────
        public bool SendSms { get; set; } = false;
        public string? SmsText { get; set; }

        // ── Email ───────────────────────────────────────────────────────────
        public bool SendEmail { get; set; } = false;
        public EmailTemplate? EmailTemplate { get; set; }

        /// <summary>Anonymous object passed to EmailTemplateRenderer for placeholder substitution.</summary>
        public object? EmailData { get; set; }
    }
}

// Workaround for nested type reference
namespace Aishwaryam.Application.Interfaces.Services
{
    public static class NotificationScreens
    {
        // Android deep-link screen route constants
        public const string Dashboard       = "dashboard";
        public const string TransactionHistory = "history";
        public const string SchemeDetail    = "scheme_detail";
        public const string GoldPortfolio   = "portfolio";
        public const string KycScreen       = "kyc";
        public const string ProfileScreen   = "profile";
        public const string ReferralScreen  = "referral";
    }
}
