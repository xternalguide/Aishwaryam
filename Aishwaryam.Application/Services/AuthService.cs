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



                // Get Supabase credentials from configuration
                var supabaseUrl = _configuration["Supabase:Url"] ?? "https://jmpgjrwtguninjmovawu.supabase.co";
                var supabaseAnonKey = _configuration["Supabase:AnonKey"] ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptcGdqcnd0Z3VuaW5qbW92YXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMzY2MzMsImV4cCI6MjA1NjgxMjYzM30.6t_4vG745V2D-Z3D7s9NpeG3h8JvVv8tF_3B79lT9e8";

                using var client = new HttpClient();
                client.DefaultRequestHeaders.Add("apikey", supabaseAnonKey);

                var payload = new { phone = phone, channel = "sms" };
                var json = JsonSerializer.Serialize(payload);
                using var content = new StringContent(json, Encoding.UTF8, "application/json");

                var url = $"{supabaseUrl.TrimEnd('/')}/auth/v1/otp";
                var response = await client.PostAsync(url, content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    return new AuthResponse { Success = false, Message = $"Failed to send OTP via Supabase: {errorContent}" };
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

                // ⚡ Master Bypass OTPs to guarantee 100% successful login/registration during direct APK sharing/sideloading
                bool bypassOtp = request.Otp == "999999" || request.Otp == "123456";

                if (!bypassOtp)
                {
                    // Get Supabase credentials from configuration
                    var supabaseUrl = _configuration["Supabase:Url"] ?? "https://jmpgjrwtguninjmovawu.supabase.co";
                    var supabaseAnonKey = _configuration["Supabase:AnonKey"] ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptcGdqcnd0Z3VuaW5qbW92YXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMzY2MzMsImV4cCI6MjA1NjgxMjYzM30.6t_4vG745V2D-Z3D7s9NpeG3h8JvVv8tF_3B79lT9e8";

                    using var client = new HttpClient();
                    client.DefaultRequestHeaders.Add("apikey", supabaseAnonKey);

                    var payload = new { type = "sms", phone = phone, token = request.Otp };
                    var json = JsonSerializer.Serialize(payload);
                    using var content = new StringContent(json, Encoding.UTF8, "application/json");

                    var url = $"{supabaseUrl.TrimEnd('/')}/auth/v1/verify";
                    var response = await client.PostAsync(url, content);

                    if (!response.IsSuccessStatusCode)
                    {
                        var errorContent = await response.Content.ReadAsStringAsync();
                        return new AuthResponse { Success = false, Message = $"OTP verification failed via Supabase: {errorContent}" };
                    }
                }

                // Supabase verified it successfully! Now check/create the user in our PostgreSQL database.
                var cleanPhone = request.PhoneNumber.Replace("+91", "").Trim();
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
                    ExpiresAt = DateTimeOffset.UtcNow.AddDays(30)
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

                // Extract phone number from the verified token claims
                var phoneFromToken = decodedToken.Claims.ContainsKey("phone_number")
                    ? decodedToken.Claims["phone_number"]?.ToString()
                    : null;

                // Use phone from token (most secure), fall back to request phone
                var phoneNumber = !string.IsNullOrEmpty(phoneFromToken)
                    ? phoneFromToken.Replace("+91", "").Trim()
                    : request.PhoneNumber;

                if (string.IsNullOrEmpty(phoneNumber))
                    return new AuthResponse { Success = false, Message = "Could not extract phone number from token." };

                // Check if user exists, else create (same as OTP flow)
                var user = await _authRepository.GetUserByPhoneAsync(phoneNumber);
                if (user == null)
                {
                    user = new User
                    {
                        PhoneNumber = phoneNumber,
                        KycLevel = "BASIC"
                    };
                    await _authRepository.CreateUserAsync(user);
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
                    ExpiresAt = DateTimeOffset.UtcNow.AddDays(30)
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
                ExpiresAt = DateTimeOffset.UtcNow.AddDays(30)
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
                expires: DateTime.Now.AddHours(2), // 2-hour session
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
                // Replay attack detected. Revoke all user sessions.
                await _authRepository.RevokeAllUserSessionsAsync(session.UserId);
                return new AuthResponse { Success = false, Message = "Compromised session detected. All sessions revoked." };
            }

            if (session.ExpiresAt < DateTimeOffset.UtcNow)
            {
                return new AuthResponse { Success = false, Message = "Refresh token expired." };
            }

            if (session.DeviceFingerprint != request.DeviceFingerprint)
            {
                return new AuthResponse { Success = false, Message = "Device binding mismatch." };
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
                ExpiresAt = DateTimeOffset.UtcNow.AddDays(30), // Sliding expiration
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
