using System;

namespace Aishwaryam.Domain.Entities
{
    public class RedemptionStatusHistory
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid SchemeRedemptionId { get; set; }
        public string Status { get; set; } = string.Empty; // PENDING, APPROVED, REJECTED, COMPLETED
        public string? ChangeReason { get; set; }
        public string? ChangedByAdminId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public SchemeRedemption SchemeRedemption { get; set; } = null!;
    }
}
