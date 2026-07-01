using System;

namespace Aishwaryam.Domain.Entities
{
    public class OtpLog
    {
        public Guid Id { get; set; }
        public string PhoneNumber { get; set; } = string.Empty;
        public string OtpHash { get; set; } = string.Empty;
        public string IpAddress { get; set; } = string.Empty;
        public DateTimeOffset ExpiresAt { get; set; }
        public bool IsUsed { get; set; } = false;
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
