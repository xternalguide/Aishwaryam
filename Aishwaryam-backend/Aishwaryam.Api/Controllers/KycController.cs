using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Aishwaryam.Application.DTOs.Kyc;
using Aishwaryam.Application.Interfaces.Services;
using System.Linq;
using Microsoft.EntityFrameworkCore;

namespace Aishwaryam.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class KycController : ControllerBase
    {
        private readonly IKycService _kycService;
        private readonly INotificationService _notificationService;
        private readonly IKycComplianceService _complianceService;
        private readonly Aishwaryam.Infrastructure.Data.ApplicationDbContext _context;

        public KycController(
            IKycService kycService, 
            INotificationService notificationService, 
            IKycComplianceService complianceService,
            Aishwaryam.Infrastructure.Data.ApplicationDbContext context)
        {
            _kycService = kycService;
            _notificationService = notificationService;
            _complianceService = complianceService;
            _context = context;
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllKycStatus()
        {
            var users = await _context.Users
                .OrderByDescending(u => u.CreatedAt)
                .Select(u => new {
                    u.Id,
                    u.FullName,
                    u.PhoneNumber,
                    u.KycLevel,
                    u.CreatedAt
                })
                .ToListAsync();
            return Ok(users);
        }

        [HttpGet("status/{userId}")]
        public async Task<IActionResult> GetKycStatus(Guid userId)
        {
            if (userId == Guid.Empty)
                return BadRequest(new { Message = "Invalid user ID." });

            try
            {
                var response = await _kycService.GetKycStatusAsync(userId);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred.", Details = ex.Message });
            }
        }

        [HttpGet("limits/{userId}")]
        public async Task<IActionResult> GetKycLimits(Guid userId)
        {
            var limits = await _complianceService.GetUserLimitsAsync(userId);
            return Ok(limits);
        }

        [HttpPost("submit")]
        public async Task<IActionResult> SubmitKyc([FromBody] SubmitKycRequest request)
        {
            if (request.UserId == Guid.Empty || string.IsNullOrEmpty(request.DocumentNumber))
                return BadRequest(new { Message = "Invalid KYC request." });

            try
            {
                var response = await _kycService.SubmitKycAsync(request);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while submitting KYC.", Details = ex.Message });
            }
        }
        [HttpPost("update-status")]
        public async Task<IActionResult> UpdateKycStatus([FromBody] UpdateKycStatusRequest request)
        {
            var user = await _context.Users.FindAsync(request.UserId);
            if (user == null) return NotFound("User not found.");

            user.KycLevel = request.NewLevel;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var title = request.NewLevel == "REJECTED" ? "KYC Rejected ❌" : "KYC Approved! ✅";
            var message = request.NewLevel == "REJECTED" 
                ? "Your KYC documents were rejected. Please re-upload valid documents." 
                : $"Congratulations! Your KYC is now at {request.NewLevel} level.";

            await _notificationService.SendNotificationAsync(request.UserId, title, message, "KYC_UPDATE");

            return Ok(new { Success = true, Message = $"KYC status updated to {request.NewLevel}" });
        }
    }

    public class UpdateKycStatusRequest
    {
        public Guid UserId { get; set; }
        public string NewLevel { get; set; } = string.Empty; // e.g. VERIFIED, REJECTED
    }
}
