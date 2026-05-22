using System;

namespace Aishwaryam.Domain.Entities
{
    /// <summary>
    /// Immutable log of every Razorpay webhook event we have processed.
    /// The combination of (EventId, EventType) is UNIQUE — this is the primary
    /// idempotency guard against duplicate webhook deliveries.
    /// </summary>
    public class WebhookEventLog
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        /// <summary>Razorpay's globally unique event ID (from payload root "event_id")</summary>
        public string RazorpayEventId { get; set; } = string.Empty;

        /// <summary>e.g. "subscription.charged", "payment.failed"</summary>
        public string EventType { get; set; } = string.Empty;

        /// <summary>Razorpay payment ID extracted from payload (secondary dedup key)</summary>
        public string? RazorpayPaymentId { get; set; }

        /// <summary>Razorpay subscription ID extracted from payload</summary>
        public string? RazorpaySubscriptionId { get; set; }

        /// <summary>HTTP signature header received — stored for audit forensics</summary>
        public string? SignatureReceived { get; set; }

        public bool WasProcessed { get; set; } = true;
        public string? ProcessingError { get; set; }

        public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;
    }
}
