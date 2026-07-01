using System;

namespace Aishwaryam.Application.DTOs.Kyc
{
    public class SubmitKycRequest
    {
        public Guid UserId { get; set; }
        public string DocumentType { get; set; } = string.Empty; // PAN, AADHAAR
        public string DocumentNumber { get; set; } = string.Empty;
        public string DocumentUrl { get; set; } = string.Empty;
    }

    public class KycDocumentDto
    {
        public string DocumentType { get; set; } = string.Empty;
        public string DocumentNumber { get; set; } = string.Empty;
        public string DocumentUrl { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? RejectionReason { get; set; }
        public DateTimeOffset? UploadedAt { get; set; }
    }

    public class KycStatusResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;  // PENDING, UNDER_REVIEW, VERIFIED, REJECTED
        public string? RejectionReason { get; set; }
        public string? DocumentType { get; set; }
        public string? DocumentNumber { get; set; }
        public string? DocumentUrl { get; set; }
        public DateTimeOffset? UploadedAt { get; set; }
        public string KycLevel { get; set; } = string.Empty;
        public System.Collections.Generic.List<KycDocumentDto> Documents { get; set; } = new();
    }
}

