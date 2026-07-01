using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Aishwaryam.Application.DTOs.Wallet;
using Aishwaryam.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace Aishwaryam.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class WalletController : ControllerBase
    {
        private readonly IWalletService _walletService;

        public WalletController(IWalletService walletService)
        {
            _walletService = walletService;
        }

        private Guid GetAuthenticatedUserId()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr)) return Guid.Empty;
            return Guid.Parse(userIdStr);
        }

        [HttpGet("balance")]
        public async Task<IActionResult> GetBalance()
        {
            var userId = GetAuthenticatedUserId();
            if (userId == Guid.Empty) return Unauthorized();

            var response = await _walletService.GetBalanceAsync(userId);
            return Ok(response);
        }

        [HttpPost("transaction")]
        public async Task<IActionResult> ProcessTransaction([FromBody] WalletTransactionRequest request)
        {
            var userId = GetAuthenticatedUserId();
            if (userId == Guid.Empty) return Unauthorized();

            // Force authenticated userId to prevent IDOR
            request.UserId = userId;

            if (request.AmountPaise <= 0 || string.IsNullOrEmpty(request.TransactionType))
                return BadRequest(new { Message = "Invalid transaction request." });

            request.IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            request.DeviceFingerprint = Request.Headers["X-Device-Fingerprint"].ToString();
            if (string.IsNullOrEmpty(request.DeviceFingerprint)) request.DeviceFingerprint = "web_default";

            try
            {
                var response = await _walletService.ProcessTransactionAsync(request);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred.", Details = ex.Message });
            }
        }
    }
}
