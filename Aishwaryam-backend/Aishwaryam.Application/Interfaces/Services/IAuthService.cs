using System;
using System.Threading.Tasks;
using Aishwaryam.Application.DTOs.Auth;

namespace Aishwaryam.Application.Interfaces.Services
{
    public interface IAuthService
    {
        Task<AuthResponse> SendOtpAsync(SendOtpRequest request);
        Task<AuthResponse> VerifyOtpAsync(VerifyOtpRequest request);
        Task<AuthResponse> VerifyFirebaseTokenAsync(VerifyFirebaseTokenRequest request);
        Task<AuthResponse> SetMpinAsync(SetMpinRequest request);
        Task<AuthResponse> VerifyMpinAsync(VerifyMpinRequest request);
        Task<AuthResponse> ChangeMpinAsync(ChangeMpinRequest request);
        Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request, string ipAddress, string userAgent);
        Task<AuthResponse> LogoutAsync(string rawRefreshToken);
        Task<AuthResponse> RevokeAllSessionsAsync(Guid userId);
    }
}
