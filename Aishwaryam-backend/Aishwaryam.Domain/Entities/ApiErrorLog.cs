using System;

namespace Aishwaryam.Domain.Entities
{
    public class ApiErrorLog
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string RequestPath { get; set; } = string.Empty;
        public string Method { get; set; } = string.Empty;
        public string Headers { get; set; } = string.Empty;
        public string? RequestPayload { get; set; }
        public string? ResponsePayload { get; set; }
        public string ClientIp { get; set; } = string.Empty;
        public string ErrorMessage { get; set; } = string.Empty;
        public string? StackTrace { get; set; }
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
