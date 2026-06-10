namespace Aishwaryam.Application.DTOs.Auth
{
    public class SendOtpRequest
    {
        public string PhoneNumber { get; set; } = string.Empty;
        public string IpAddress { get; set; } = string.Empty;
    }

    public class VerifyOtpRequest
    {
        public string PhoneNumber { get; set; } = string.Empty;
        public string Otp { get; set; } = string.Empty;
        public string IpAddress { get; set; } = string.Empty;
        public string DeviceFingerprint { get; set; } = string.Empty;
    }

    /// <summary>
    /// Firebase Phone Auth flow — Android sends Firebase ID token instead of raw OTP.
    /// Backend verifies token with Firebase Admin SDK.
    /// </summary>
    public class VerifyFirebaseTokenRequest
    {
        public string FirebaseIdToken { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string DeviceFingerprint { get; set; } = string.Empty;
        public string IpAddress { get; set; } = string.Empty;
    }

    public class AuthResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Token { get; set; }
        public string? RefreshToken { get; set; }
        public Guid? UserId { get; set; }
        public bool IsNewUser { get; set; }
        public bool IsMpinSet { get; set; }
    }

    public class SetMpinRequest
    {
        public Guid UserId { get; set; }
        public string Mpin { get; set; } = string.Empty;
    }

    public class VerifyMpinRequest
    {
        public Guid UserId { get; set; }
        public string PhoneNumber { get; set; } = string.Empty;
        public string Mpin { get; set; } = string.Empty;
        public string IpAddress { get; set; } = string.Empty;
        public string DeviceFingerprint { get; set; } = string.Empty;
    }

    public class ChangeMpinRequest
    {
        public Guid UserId { get; set; }
        public string OldMpin { get; set; } = string.Empty;
        public string NewMpin { get; set; } = string.Empty;
    }

    public class RefreshTokenRequest
    {
        public string RefreshToken { get; set; } = string.Empty;
        public string DeviceFingerprint { get; set; } = string.Empty;
    }
}
