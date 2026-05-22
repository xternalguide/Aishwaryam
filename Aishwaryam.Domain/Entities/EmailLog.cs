using System;
using System.Collections.Generic;

namespace Aishwaryam.Domain.Entities
{
    /// <summary>
    /// Persists every outbound email attempt — delivery status, retry count,
    /// and provider message ID for debugging and audit.
    /// </summary>
    public class EmailLog
    {
        public Guid Id { get; set; }
        public Guid? UserId { get; set; }

        public string ToEmail { get; set; } = string.Empty;
        public string ToName { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;

        /// <summary>EmailTemplate enum name — e.g. "GoldPurchaseReceipt".</summary>
        public string TemplateName { get; set; } = string.Empty;

        /// <summary>SENT | FAILED | PENDING</summary>
        public string Status { get; set; } = "PENDING";

        /// <summary>Message ID returned by Brevo / Resend on success.</summary>
        public string? ProviderMessageId { get; set; }

        public string? ErrorMessage { get; set; }
        public int RetryCount { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? SentAt { get; set; }

        // Navigation
        public User? User { get; set; }
    }
}
