using System;

namespace Aishwaryam.Domain.Entities
{
    public class AdminAlert
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public string AlertType { get; set; } = string.Empty; // E.g., "AutoPayFailed", "MissedManualPayment"
        public string Message { get; set; } = string.Empty;
        public bool IsResolved { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public User User { get; set; } = null!;
    }
}
