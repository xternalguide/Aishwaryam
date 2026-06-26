using System;

namespace Aishwaryam.Domain.Entities
{
    public class AdminAuditLog
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string AdminEmail { get; set; } = string.Empty;
        public string ActionType { get; set; } = string.Empty; // e.g., "KYC_APPROVE", "EMERGENCY_OVERRIDE", "SCHEME_UPDATE"
        public string TargetEntityId { get; set; } = string.Empty; // ID of user, scheme, or transaction affected
        public string Notes { get; set; } = string.Empty; // Mandatory reasoning
        public string IpAddress { get; set; } = string.Empty;
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
