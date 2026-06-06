using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Aishwaryam.Application.Interfaces.Repositories;
using Aishwaryam.Domain.Entities;
using Aishwaryam.Infrastructure.Data;

namespace Aishwaryam.Infrastructure.Repositories
{
    public class AuthRepository : IAuthRepository
    {
        private readonly ApplicationDbContext _context;

        public AuthRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<User?> GetUserByPhoneAsync(string phoneNumber)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.PhoneNumber == phoneNumber);
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<User> CreateUserAsync(User user)
        {
            if (string.IsNullOrEmpty(user.ReferralCode))
            {
                var random = new Random();
                string code;
                bool isUnique = false;
                do
                {
                    code = "AISH" + random.Next(100000, 999999).ToString();
                    isUnique = !await _context.Users.AnyAsync(u => u.ReferralCode == code);
                } while (!isUnique);
                
                user.ReferralCode = code;
            }

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task SaveOtpAsync(OtpLog otpLog)
        {
            _context.OtpLogs.Add(otpLog);
            await _context.SaveChangesAsync();
        }

        public async Task<OtpLog?> GetLatestValidOtpAsync(string phoneNumber)
        {
            return await _context.OtpLogs
                .Where(o => o.PhoneNumber == phoneNumber && !o.IsUsed && o.ExpiresAt > DateTimeOffset.UtcNow)
                .OrderByDescending(o => o.CreatedAt)
                .FirstOrDefaultAsync();
        }

        public async Task MarkOtpAsUsedAsync(Guid otpId)
        {
            var otp = await _context.OtpLogs.FindAsync(otpId);
            if (otp != null)
            {
                otp.IsUsed = true;
                await _context.SaveChangesAsync();
            }
        }

        public async Task CreateAuthSessionAsync(AuthSession session)
        {
            _context.AuthSessions.Add(session);
            await _context.SaveChangesAsync();
        }

        public async Task<AuthSession?> GetAuthSessionByHashAsync(string hashedToken)
        {
            return await _context.AuthSessions
                .FirstOrDefaultAsync(s => s.RefreshToken == hashedToken);
        }

        public async Task UpdateAuthSessionAsync(AuthSession session)
        {
            _context.AuthSessions.Update(session);
            await _context.SaveChangesAsync();
        }

        public async Task RevokeAllUserSessionsAsync(Guid userId)
        {
            var sessions = await _context.AuthSessions
                .Where(s => s.UserId == userId && !s.IsRevoked)
                .ToListAsync();

            foreach (var session in sessions)
            {
                session.IsRevoked = true;
            }

            await _context.SaveChangesAsync();
        }

        public async Task<User?> GetUserByIdAsync(Guid userId)
        {
            return await _context.Users.FindAsync(userId);
        }

        public async Task UpdateUserAsync(User user)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> IsIdempotencyKeyUsedAsync(string key)
        {
            return await _context.IdempotencyKeys.AnyAsync(k => k.Key == key);
        }

        public async Task SaveIdempotencyKeyAsync(IdempotencyKey key)
        {
            _context.IdempotencyKeys.Add(key);
            await _context.SaveChangesAsync();
        }

        public async Task<AuthSession?> GetLatestActiveSessionByUserIdAsync(Guid userId)
        {
            return await _context.AuthSessions
                .Where(s => s.UserId == userId && !s.IsRevoked && s.ExpiresAt > DateTimeOffset.UtcNow)
                .OrderByDescending(s => s.CreatedAt)
                .FirstOrDefaultAsync();
        }
    }
}
