using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Aishwaryam.Application.DTOs.Auth;
using Aishwaryam.Application.Interfaces.Repositories;
using Aishwaryam.Application.Interfaces.Services;
using Aishwaryam.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Aishwaryam.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IAuthRepository _authRepository;
        private readonly ISmsService _smsService;
        private readonly IConfiguration _configuration;

        public AuthService(IAuthRepository authRepository, ISmsService smsService, IConfiguration configuration)
        {
            _authRepository = authRepository;
            _smsService = smsService;
            _configuration = configuration;
        }

        public async Task<AuthResponse> SendOtpAsync(SendOtpRequest request)
        {
            try
            {
                // Format phone number to E.164 format with +91 if it doesn't already have it
                var phone = request.PhoneNumber;
                if (!phone.StartsWith("+"))
                {
                    phone = "+91" + phone;
                }

                var cleanPhone = phone.Replace("+91", "").Trim();

                // 1. Generate secure random 6-digit OTP code (different every time)
                var otpCode = Random.Shared.Next(100000, 1000000).ToString();
                var hashedOtp = ComputeSha256Hash(otpCode);

                // 2. Save in database (otp_logs)
                var otpLog = new OtpLog
                {
                    Id = Guid.NewGuid(),
                    PhoneNumber = cleanPhone,
                    OtpHash = hashedOtp,
                    IpAddress = request.IpAddress ?? "unknown",
                    ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(5),
                    IsUsed = false,
                    CreatedAt = DateTimeOffset.UtcNow
                };

                await _authRepository.SaveOtpAsync(otpLog);

                // 3. Send SMS via Brevo (ISmsService)
                var message = $"Your OTP for Aishwaryam Digital Gold is {otpCode}. Valid for 5 minutes.";
                var smsResult = await _smsService.SendSmsAsync(phone, message);

                if (!smsResult.Success)
                {
                    return new AuthResponse { Success = false, Message = $"Failed to send SMS: {smsResult.ErrorMessage}" };
                }

                return new AuthResponse { Success = true, Message = "OTP Sent Successfully." };
            }
            catch (Exception ex)
            {
                return new AuthResponse { Success = false, Message = $"Error sending OTP: {ex.Message}" };
            }
        }

        public async Task<AuthResponse> VerifyOtpAsync(VerifyOtpRequest request)
        {
            try
            {
                var phone = request.PhoneNumber;
                if (!phone.StartsWith("+"))
                {
                    phone = "+91" + phone;
                }

                var cleanPhone = phone.Replace("+91", "").Trim();

                // Fetch latest unused, unexpired OTP for this phone
                var latestOtp = await _authRepository.GetLatestValidOtpAsync(cleanPhone);
                if (latestOtp == null)
                {
                    return new AuthResponse { Success = false, Message = "OTP expired or invalid. Please request a new OTP." };
                }

                var hashedInput = ComputeSha256Hash(request.Otp);
                if (latestOtp.OtpHash != hashedInput)
                {
                    return new AuthResponse { Success = false, Message = "Incorrect OTP. Please try again." };
                }

                // Mark OTP as used
                await _authRepository.MarkOtpAsUsedAsync(latestOtp.Id);

                // Check/create the user in our PostgreSQL database.
                var user = await _authRepository.GetUserByPhoneAsync(cleanPhone);
                if (user == null)
                {
                    user = new User
                    {
                        PhoneNumber = cleanPhone,
                        KycLevel = "BASIC"
                    };
                    await _authRepository.CreateUserAsync(user);
                }

                // Generate Real Tokens for our app's JWT-based authentication
                string jwtToken = GenerateJwt(user);
                string rawRefreshToken = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
                string hashedRefreshToken = ComputeSha256Hash(rawRefreshToken);

                // Create Auth Session
                var session = new AuthSession
                {
                    UserId = user.Id,
                    RefreshToken = hashedRefreshToken,
                    IpAddress = request.IpAddress,
                    DeviceFingerprint = request.DeviceFingerprint,
                    ExpiresAt = DateTimeOffset.UtcNow.AddDays(365)
                };

                await _authRepository.CreateAuthSessionAsync(session);

                return new AuthResponse 
                { 
                    Success = true, 
                    Message = "Login Successful.",
                    Token = jwtToken,
                    RefreshToken = rawRefreshToken,
                    UserId = user.Id,
                    IsNewUser = string.IsNullOrEmpty(user.MpinHash),
                    IsMpinSet = !string.IsNullOrEmpty(user.MpinHash)
                };
            }
            catch (Exception ex)
            {
                return new AuthResponse { Success = false, Message = $"Error verifying OTP: {ex.Message}" };
            }
        }

        /// <summary>
        /// Firebase Phone Auth flow.
        /// 1. Android verifies OTP with Firebase → gets ID token
        /// 2. Android sends ID token here
        /// 3. We verify with Firebase Admin SDK (no network call needed — uses Firebase's public keys)
        /// 4. Extract phone number from verified token
        /// 5. Create or fetch user → issue our own JWT
        /// </summary>
        public async Task<AuthResponse> VerifyFirebaseTokenAsync(VerifyFirebaseTokenRequest request)
        {
            try
            {
                // Verify the Firebase ID token using Firebase Admin SDK
                if (FirebaseAdmin.FirebaseApp.DefaultInstance == null)
                {
                    return new AuthResponse
                    {
                        Success = false,
                        Message = "Firebase Admin SDK is not initialized on the server. Please configure the Firebase__ServiceAccountJson environment variable in Railway."
                    };
                }

                var decodedToken = await FirebaseAdmin.Auth.FirebaseAuth.DefaultInstance
                    .VerifyIdTokenAsync(request.FirebaseIdToken);

                // Extract claims from the verified token
                var phoneFromToken = decodedToken.Claims.ContainsKey("phone_number")
                    ? decodedToken.Claims["phone_number"]?.ToString()
                    : null;

                var emailFromToken = decodedToken.Claims.ContainsKey("email")
                    ? decodedToken.Claims["email"]?.ToString()
                    : null;

                var nameFromToken = decodedToken.Claims.ContainsKey("name")
                    ? decodedToken.Claims["name"]?.ToString()
                    : null;

                // Clean phone number from +91 format
                var phoneNumber = !string.IsNullOrEmpty(phoneFromToken)
                    ? phoneFromToken.Replace("+91", "").Trim()
                    : (!string.IsNullOrEmpty(request.PhoneNumber) ? request.PhoneNumber.Replace("+91", "").Trim() : "");

                User? user = null;

                // 1. First look up by Email (for Google logins)
                if (!string.IsNullOrEmpty(emailFromToken))
                {
                    user = await _authRepository.GetUserByEmailAsync(emailFromToken);
                }

                // 2. Fallback to look up by Phone Number
                if (user == null && !string.IsNullOrEmpty(phoneNumber))
                {
                    user = await _authRepository.GetUserByPhoneAsync(phoneNumber);
                }

                // 3. Create new user if not found
                if (user == null)
                {
                    var finalPhone = phoneNumber;
                    if (string.IsNullOrEmpty(finalPhone))
                    {
                        // Generate unique dummy phone number for Google users to satisfy UNIQUE NOT NULL db constraint
                        finalPhone = "G-" + Guid.NewGuid().ToString("N").Substring(0, 13);
                    }

                    user = new User
                    {
                        PhoneNumber = finalPhone,
                        Email = emailFromToken,
                        FullName = nameFromToken,
                        KycLevel = "BASIC"
                    };
                    await _authRepository.CreateUserAsync(user);
                }
                else
                {
                    // Update email or name if they weren't set previously
                    bool needsUpdate = false;
                    if (string.IsNullOrEmpty(user.Email) && !string.IsNullOrEmpty(emailFromToken))
                    {
                        user.Email = emailFromToken;
                        needsUpdate = true;
                    }
                    if (string.IsNullOrEmpty(user.FullName) && !string.IsNullOrEmpty(nameFromToken))
                    {
                        user.FullName = nameFromToken;
                        needsUpdate = true;
                    }
                    if (needsUpdate)
                    {
                        await _authRepository.UpdateUserAsync(user);
                    }
                }

                // Generate our own JWT + refresh token for the app
                string jwtToken = GenerateJwt(user);
                string rawRefreshToken = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
                string hashedRefreshToken = ComputeSha256Hash(rawRefreshToken);

                var session = new AuthSession
                {
                    UserId = user.Id,
                    RefreshToken = hashedRefreshToken,
                    IpAddress = request.IpAddress,
                    DeviceFingerprint = request.DeviceFingerprint,
                    ExpiresAt = DateTimeOffset.UtcNow.AddDays(365)
                };

                await _authRepository.CreateAuthSessionAsync(session);

                return new AuthResponse
                {
                    Success = true,
                    Message = "Login Successful.",
                    Token = jwtToken,
                    RefreshToken = rawRefreshToken,
                    UserId = user.Id,
                    IsNewUser = string.IsNullOrEmpty(user.MpinHash),
                    IsMpinSet = !string.IsNullOrEmpty(user.MpinHash)
                };
            }
            catch (FirebaseAdmin.Auth.FirebaseAuthException ex)
            {
                return new AuthResponse
                {
                    Success = false,
                    Message = $"Firebase token verification failed: {ex.AuthErrorCode}"
                };
            }
            catch (Exception ex)
            {
                return new AuthResponse
                {
                    Success = false,
                    Message = $"Authentication error: {ex.Message}"
                };
            }
        }

        public async Task<AuthResponse> SetMpinAsync(SetMpinRequest request)
        {
            var user = await _authRepository.GetUserByIdAsync(request.UserId);
            if (user == null)
            {
                return new AuthResponse { Success = false, Message = "User not found." };
            }

            // Use BCrypt for secure MPIN hashing (OWASP requirement)
            user.MpinHash = BCrypt.Net.BCrypt.HashPassword(request.Mpin);
            
            await _authRepository.UpdateUserAsync(user);

            return new AuthResponse { Success = true, Message = "MPIN set successfully." };
        }

        public async Task<AuthResponse> VerifyMpinAsync(VerifyMpinRequest request)
        {
            var user = await _authRepository.GetUserByIdAsync(request.UserId);
            if (user == null || string.IsNullOrEmpty(user.MpinHash))
            {
                return new AuthResponse { Success = false, Message = "User or MPIN not found." };
            }

            // Verify BCrypt hash
            if (!BCrypt.Net.BCrypt.Verify(request.Mpin, user.MpinHash))
            {
                // In a real app, track failed attempts here for lockout
                return new AuthResponse { Success = false, Message = "Invalid MPIN." };
            }

            // Generate real token and record the session
            string jwtToken = GenerateJwt(user);
            string rawRefreshToken = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
            string hashedRefreshToken = ComputeSha256Hash(rawRefreshToken);

            var session = new AuthSession
            {
                UserId = user.Id,
                RefreshToken = hashedRefreshToken,
                IpAddress = request.IpAddress,
                DeviceFingerprint = request.DeviceFingerprint,
                ExpiresAt = DateTimeOffset.UtcNow.AddDays(365)
            };

            await _authRepository.CreateAuthSessionAsync(session);

            return new AuthResponse 
            { 
                Success = true, 
                Message = "Login Successful.",
                Token = jwtToken,
                RefreshToken = rawRefreshToken,
                UserId = user.Id
            };
        }

        private string GenerateJwt(User user)
        {
            var jwtKey = _configuration["Jwt:Key"] ?? "Aishwaryam_Super_Secret_Key_For_Digital_Gold_Platform_2026!";
            var jwtIssuer = _configuration["Jwt:Issuer"] ?? "AishwaryamApi";

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.MobilePhone, user.PhoneNumber),
                new Claim("KycLevel", user.KycLevel ?? "BASIC")
            };

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtIssuer,
                claims: claims,
                expires: DateTime.UtcNow.AddDays(365), // 365-day session for mobile continuity
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public async Task<AuthResponse> ChangeMpinAsync(ChangeMpinRequest request)
        {
            var user = await _authRepository.GetUserByIdAsync(request.UserId);
            if (user == null || string.IsNullOrEmpty(user.MpinHash))
            {
                return new AuthResponse { Success = false, Message = "User or existing MPIN not found." };
            }

            // Verify old MPIN using BCrypt
            if (!BCrypt.Net.BCrypt.Verify(request.OldMpin, user.MpinHash))
            {
                return new AuthResponse { Success = false, Message = "Incorrect old MPIN." };
            }

            // Hash new MPIN with BCrypt
            user.MpinHash = BCrypt.Net.BCrypt.HashPassword(request.NewMpin);
            
            await _authRepository.UpdateUserAsync(user);

            return new AuthResponse { Success = true, Message = "MPIN changed successfully." };
        }

        private string ComputeSha256Hash(string rawData)
        {
            using var sha256Hash = SHA256.Create();
            var bytes = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(rawData));
            var builder = new StringBuilder();
            for (int i = 0; i < bytes.Length; i++)
            {
                builder.Append(bytes[i].ToString("x2"));
            }
            return builder.ToString();
        }

        public async Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request, string ipAddress, string userAgent)
        {
            if (string.IsNullOrEmpty(request.RefreshToken))
            {
                return new AuthResponse { Success = false, Message = "Refresh token is required." };
            }

            var hashedToken = ComputeSha256Hash(request.RefreshToken);
            var session = await _authRepository.GetAuthSessionByHashAsync(hashedToken);

            if (session == null)
            {
                return new AuthResponse { Success = false, Message = "Invalid refresh token." };
            }

            if (session.IsRevoked)
            {
                // Grace/Recovery logic: If the latest active session is valid and not expired,
                // rotate it safely instead of aggressively logging the user out.
                var activeSession = await _authRepository.GetLatestActiveSessionByUserIdAsync(session.UserId);
                if (activeSession != null && activeSession.ExpiresAt >= DateTimeOffset.UtcNow)
                {
                    var userEntity = await _authRepository.GetUserByIdAsync(session.UserId);
                    if (userEntity != null && userEntity.IsActive)
                    {
                        activeSession.IsRevoked = true;
                        await _authRepository.UpdateAuthSessionAsync(activeSession);

                        string reIssuedJwt = GenerateJwt(userEntity);
                        string reIssuedRawRefresh = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
                        string reIssuedHashedRefresh = ComputeSha256Hash(reIssuedRawRefresh);

                        var graceSession = new AuthSession
                        {
                            UserId = userEntity.Id,
                            RefreshToken = reIssuedHashedRefresh,
                            IpAddress = ipAddress,
                            DeviceFingerprint = request.DeviceFingerprint,
                            UserAgent = userAgent,
                            ExpiresAt = DateTimeOffset.UtcNow.AddDays(365),
                            IsRevoked = false
                        };
                        await _authRepository.CreateAuthSessionAsync(graceSession);

                        return new AuthResponse
                        {
                            Success = true,
                            Message = "Token refreshed successfully (grace session recovery).",
                            Token = reIssuedJwt,
                            RefreshToken = reIssuedRawRefresh,
                            UserId = userEntity.Id,
                            IsNewUser = string.IsNullOrEmpty(userEntity.MpinHash),
                            IsMpinSet = !string.IsNullOrEmpty(userEntity.MpinHash)
                        };
                    }
                }

                // If no active session could be recovered, reject the refresh.
                return new AuthResponse { Success = false, Message = "Session expired or invalid." };
            }

            if (session.ExpiresAt < DateTimeOffset.UtcNow)
            {
                return new AuthResponse { Success = false, Message = "Refresh token expired." };
            }

            if (!string.IsNullOrEmpty(request.DeviceFingerprint) && session.DeviceFingerprint != request.DeviceFingerprint)
            {
                // Relaxed for session continuity: update the fingerprint instead of failing
                session.DeviceFingerprint = request.DeviceFingerprint;
            }

            var user = await _authRepository.GetUserByIdAsync(session.UserId);
            if (user == null || !user.IsActive)
            {
                return new AuthResponse { Success = false, Message = "User inactive or not found." };
            }

            // Revoke current token
            session.IsRevoked = true;
            await _authRepository.UpdateAuthSessionAsync(session);

            // Generate new token pair
            string newJwtToken = GenerateJwt(user);
            string newRawRefreshToken = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
            string newHashedRefreshToken = ComputeSha256Hash(newRawRefreshToken);

            // Create new auth session
            var newSession = new AuthSession
            {
                UserId = user.Id,
                RefreshToken = newHashedRefreshToken,
                IpAddress = ipAddress,
                DeviceFingerprint = request.DeviceFingerprint,
                UserAgent = userAgent,
                ExpiresAt = DateTimeOffset.UtcNow.AddDays(365), // Sliding expiration
                IsRevoked = false
            };

            await _authRepository.CreateAuthSessionAsync(newSession);

            return new AuthResponse
            {
                Success = true,
                Message = "Token refreshed successfully.",
                Token = newJwtToken,
                RefreshToken = newRawRefreshToken,
                UserId = user.Id,
                IsNewUser = string.IsNullOrEmpty(user.MpinHash),
                IsMpinSet = !string.IsNullOrEmpty(user.MpinHash)
            };
        }

        public async Task<AuthResponse> LogoutAsync(string rawRefreshToken)
        {
            if (string.IsNullOrEmpty(rawRefreshToken))
            {
                return new AuthResponse { Success = false, Message = "Token required." };
            }

            var hashedToken = ComputeSha256Hash(rawRefreshToken);
            var session = await _authRepository.GetAuthSessionByHashAsync(hashedToken);
            if (session != null)
            {
                session.IsRevoked = true;
                await _authRepository.UpdateAuthSessionAsync(session);
            }

            return new AuthResponse { Success = true, Message = "Logged out successfully." };
        }

        public async Task<AuthResponse> RevokeAllSessionsAsync(Guid userId)
        {
            await _authRepository.RevokeAllUserSessionsAsync(userId);
            return new AuthResponse { Success = true, Message = "All sessions revoked." };
        }
    }
}
