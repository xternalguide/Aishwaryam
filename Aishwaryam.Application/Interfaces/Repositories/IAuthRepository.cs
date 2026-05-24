using System;
using System.Threading.Tasks;
using Aishwaryam.Domain.Entities;

namespace Aishwaryam.Application.Interfaces.Repositories
{
    public interface IAuthRepository
    {
        Task<User?> GetUserByPhoneAsync(string phoneNumber);
        Task<User> CreateUserAsync(User user);
        Task SaveOtpAsync(OtpLog otpLog);
        Task<OtpLog?> GetLatestValidOtpAsync(string phoneNumber);
        Task MarkOtpAsUsedAsync(Guid otpId);
        Task CreateAuthSessionAsync(AuthSession session);
        Task<AuthSession?> GetAuthSessionByHashAsync(string hashedToken);
        Task UpdateAuthSessionAsync(AuthSession session);
        Task RevokeAllUserSessionsAsync(Guid userId);
        Task<User?> GetUserByIdAsync(Guid userId);
        Task UpdateUserAsync(User user);
        Task<bool> IsIdempotencyKeyUsedAsync(string key);
        Task SaveIdempotencyKeyAsync(IdempotencyKey key);
        Task<AuthSession?> GetLatestActiveSessionByUserIdAsync(Guid userId);
    }
}
