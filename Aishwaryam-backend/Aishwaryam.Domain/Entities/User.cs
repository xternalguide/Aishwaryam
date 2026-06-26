using System;

namespace Aishwaryam.Domain.Entities
{
    public class User
    {
        public Guid Id { get; set; }
        public string PhoneNumber { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? FullName { get; set; }
        public bool IsActive { get; set; } = true;
        public string KycLevel { get; set; } = "BASIC";
        public string? MpinHash { get; set; }
        public bool BiometricEnabled { get; set; } = false;
        public string? ReferralCode { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public DateTime? WeddingAnniversaryDate { get; set; }
        public string? NomineeName { get; set; }
        public string? NomineePhoneNumber { get; set; }
        public string? NomineeRelationship { get; set; }
        public string? ProfilePictureBase64 { get; set; }
        public string? Gender { get; set; }
        public string PreferredLanguage { get; set; } = "en";
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
