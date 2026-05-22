using System;

namespace Aishwaryam.Domain.Entities
{
    public class KycDocument
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string DocumentType { get; set; } = string.Empty; // PAN, AADHAAR
        public string DocumentNumber { get; set; } = string.Empty;
        public string DocumentUrl { get; set; } = string.Empty;
        public string Status { get; set; } = "UNDER_REVIEW";     // UNDER_REVIEW, VERIFIED, REJECTED
        public string? RejectionReason { get; set; }
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset UploadedAt { get; set; } = DateTimeOffset.UtcNow;

        // Navigation property
        public User? User { get; set; }
    }
}
