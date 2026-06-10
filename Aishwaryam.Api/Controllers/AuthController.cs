using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Aishwaryam.Application.DTOs.Auth;
using Aishwaryam.Application.Interfaces.Services;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System;

namespace Aishwaryam.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        private Guid GetAuthenticatedUserId()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr)) return Guid.Empty;
            return Guid.Parse(userIdStr);
        }

        [HttpPost("send-otp")]
        [EnableRateLimiting("auth_policy")]
        public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest request)
        {
            if (string.IsNullOrEmpty(request.PhoneNumber))
                return BadRequest(new { Message = "Phone number is required." });

            request.IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            var response = await _authService.SendOtpAsync(request);
            return Ok(response);
        }

        [HttpPost("verify-otp")]
        [EnableRateLimiting("auth_policy")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
        {
            if (string.IsNullOrEmpty(request.PhoneNumber) || string.IsNullOrEmpty(request.Otp))
                return BadRequest(new { Message = "Phone number and OTP are required." });

            request.IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            
            if (string.IsNullOrEmpty(request.DeviceFingerprint))
            {
                request.DeviceFingerprint = Request.Headers["X-Device-Fingerprint"].ToString();
                if (string.IsNullOrEmpty(request.DeviceFingerprint))
                    request.DeviceFingerprint = "web_default";
            }

            var response = await _authService.VerifyOtpAsync(request);
            
            if (response.Success)
                return Ok(response);
                
            return Unauthorized(response);
        }

        /// <summary>
        /// Firebase Phone Auth endpoint.
        /// Android verifies OTP via Firebase SDK → sends Firebase ID token here.
        /// We verify the token with Firebase Admin SDK → create or fetch the user.
        /// </summary>
        [HttpPost("verify-firebase-token")]
        [EnableRateLimiting("auth_policy")]
        public async Task<IActionResult> VerifyFirebaseToken([FromBody] VerifyFirebaseTokenRequest request)
        {
            if (string.IsNullOrEmpty(request.FirebaseIdToken))
                return BadRequest(new { Message = "Firebase ID token is required." });

            request.IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            if (string.IsNullOrEmpty(request.DeviceFingerprint))
            {
                request.DeviceFingerprint = Request.Headers["X-Device-Fingerprint"].ToString();
                if (string.IsNullOrEmpty(request.DeviceFingerprint))
                    request.DeviceFingerprint = "android_default";
            }

            var response = await _authService.VerifyFirebaseTokenAsync(request);

            if (response.Success)
                return Ok(response);

            return Unauthorized(response);
        }

        [HttpPost("set-mpin")]
        [Authorize]
        public async Task<IActionResult> SetMpin([FromBody] SetMpinRequest request)
        {
            var userId = GetAuthenticatedUserId();
            if (userId == Guid.Empty) return Unauthorized();
            
            // Force authenticated userId to prevent IDOR
            request.UserId = userId;

            if (string.IsNullOrEmpty(request.Mpin))
                return BadRequest(new { Message = "MPIN is required." });

            var response = await _authService.SetMpinAsync(request);
            if (response.Success)
                return Ok(response);

            return BadRequest(response);
        }

        [HttpPost("verify-mpin")]
        [Authorize]
        [EnableRateLimiting("auth_policy")]
        public async Task<IActionResult> VerifyMpin([FromBody] VerifyMpinRequest request)
        {
            var userId = GetAuthenticatedUserId();
            if (userId == Guid.Empty) return Unauthorized();
            
            // Force authenticated userId to prevent IDOR
            request.UserId = userId;

            if (string.IsNullOrEmpty(request.Mpin))
                return BadRequest(new { Message = "MPIN is required." });

            request.IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            
            if (string.IsNullOrEmpty(request.DeviceFingerprint))
            {
                request.DeviceFingerprint = Request.Headers["X-Device-Fingerprint"].ToString();
                if (string.IsNullOrEmpty(request.DeviceFingerprint))
                    request.DeviceFingerprint = "web_default";
            }

            var response = await _authService.VerifyMpinAsync(request);
            if (response.Success)
                return Ok(response);

            return Unauthorized(response);
        }

        [HttpPost("change-mpin")]
        [Authorize]
        public async Task<IActionResult> ChangeMpin([FromBody] ChangeMpinRequest request)
        {
            var userId = GetAuthenticatedUserId();
            if (userId == Guid.Empty) return Unauthorized();
            
            // Force authenticated userId to prevent IDOR
            request.UserId = userId;

            if (string.IsNullOrEmpty(request.OldMpin) || string.IsNullOrEmpty(request.NewMpin))
                return BadRequest(new { Message = "Old and new MPINs are required." });

            var response = await _authService.ChangeMpinAsync(request);
            if (response.Success)
                return Ok(response);

            return BadRequest(response);
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var userAgent = Request.Headers["User-Agent"].ToString();

            if (string.IsNullOrEmpty(request.DeviceFingerprint))
            {
                request.DeviceFingerprint = Request.Headers["X-Device-Fingerprint"].ToString();
                if (string.IsNullOrEmpty(request.DeviceFingerprint))
                    request.DeviceFingerprint = "web_default";
            }

            var response = await _authService.RefreshTokenAsync(request, ipAddress, userAgent);
            if (response.Success)
                return Ok(response);

            return Unauthorized(response);
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest request)
        {
            var response = await _authService.LogoutAsync(request.RefreshToken);
            return Ok(response);
        }

        [HttpPost("revoke-all-sessions")]
        [Authorize]
        public async Task<IActionResult> RevokeAllSessions()
        {
            var userId = GetAuthenticatedUserId();
            if (userId == Guid.Empty) return Unauthorized();

            var response = await _authService.RevokeAllSessionsAsync(userId);
            return Ok(response);
        }
    }
}
