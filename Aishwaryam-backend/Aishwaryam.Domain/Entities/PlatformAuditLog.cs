using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Aishwaryam.Domain.Entities
{
    [Table("platform_audit_logs")]
    public class PlatformAuditLog
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid? UserId { get; set; }
        public string Action { get; set; } = string.Empty; // e.g. "BUY_GOLD", "API_ERROR", "TIMEOUT"
        public string Details { get; set; } = string.Empty; // Descriptive text
        public string IpAddress { get; set; } = string.Empty;
        public string Status { get; set; } = "SUCCESS"; // SUCCESS, FAILED, TIMEOUT
        public string ErrorMessage { get; set; } = string.Empty; // Stack trace or error msg
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
