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

        [HttpPost("digio/initiate")]
        public async Task<IActionResult> InitiateDigioKyc([FromBody] InitiateDigioRequest request, [FromServices] Aishwaryam.Infrastructure.Services.IDigioKycService digioKycService, [FromServices] Microsoft.Extensions.Configuration.IConfiguration configuration)
        {
            if (request.UserId == Guid.Empty || string.IsNullOrEmpty(request.DocumentType))
                return BadRequest(new { Message = "User ID and Document Type are required." });

            var user = await _context.Users.FindAsync(request.UserId);
            if (user == null) return NotFound(new { Message = "User not found." });

            // Choose template key from configuration
            string templateConfigKey = request.DocumentType.ToUpper() == "PAN" ? "Digio:PanTemplateKey" : "Digio:AadhaarTemplateKey";
            string templateKey = configuration[templateConfigKey] ?? "TMK240630123456"; // Default placeholder if not set

            var session = await digioKycService.CreateKycSessionAsync(user.Email ?? $"{user.PhoneNumber}@aishwaryam.com", templateKey);
            if (session == null)
            {
                return StatusCode(500, new { Message = "Failed to create e-KYC session with Digio." });
            }

            // Create under-review local KycDocument record
            var kycDoc = new Aishwaryam.Domain.Entities.KycDocument
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
                DocumentType = request.DocumentType.ToUpper(),
                DocumentNumber = "Digio Session",
                DocumentUrl = $"digio_req_id:{session.Id}",
                Status = "UNDER_REVIEW",
                CreatedAt = DateTimeOffset.UtcNow,
                UploadedAt = DateTimeOffset.UtcNow
            };
            await _context.KycDocuments.AddAsync(kycDoc);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Success = true,
                KycRequestId = session.Id,
                AccessToken = session.AccessToken?.Id ?? string.Empty,
                CustomerIdentifier = session.CustomerIdentifier ?? user.Email
            });
        }

        [HttpPost("digio/verify/{kycRequestId}")]
        public async Task<IActionResult> VerifyDigioKyc(string kycRequestId, [FromServices] Aishwaryam.Infrastructure.Services.IDigioKycService digioKycService)
        {
            if (string.IsNullOrEmpty(kycRequestId)) return BadRequest(new { Message = "KycRequestId is required." });

            var kycDoc = await _context.KycDocuments
                .FirstOrDefaultAsync(d => d.DocumentUrl == $"digio_req_id:{kycRequestId}");

            if (kycDoc == null) return NotFound(new { Message = "KYC Document record not found." });

            var status = await digioKycService.VerifyKycSessionAsync(kycRequestId);
            if (status == null) return StatusCode(500, new { Message = "Failed to fetch status from Digio." });

            if (status.Status.ToLower() == "approved" || status.Status.ToLower() == "completed")
            {
                kycDoc.Status = "VERIFIED";
                if (status.Details != null)
                {
                    kycDoc.DocumentNumber = status.Details.DocumentNumber ?? kycDoc.DocumentNumber;
                }

                // Update User table KycLevel as well
                var user = await _context.Users.FindAsync(kycDoc.UserId);
                if (user != null)
                {
                    user.KycLevel = "VERIFIED";
                    user.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
                await _notificationService.SendNotificationAsync(kycDoc.UserId, "KYC Approved! ✅", "Your e-KYC has been successfully verified via Digio.", "KYC_UPDATE");

                return Ok(new { Success = true, Status = "VERIFIED", Message = "e-KYC verified successfully!" });
            }
            else if (status.Status.ToLower() == "rejected" || status.Status.ToLower() == "failed")
            {
                kycDoc.Status = "REJECTED";
                kycDoc.RejectionReason = status.FailureReason ?? "Verification failed via Digio";

                var user = await _context.Users.FindAsync(kycDoc.UserId);
                if (user != null)
                {
                    user.KycLevel = "REJECTED";
                    user.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
                await _notificationService.SendNotificationAsync(kycDoc.UserId, "KYC Rejected ❌", kycDoc.RejectionReason, "KYC_UPDATE");

                return Ok(new { Success = false, Status = "REJECTED", Message = kycDoc.RejectionReason });
            }

            return Ok(new { Success = false, Status = status.Status.ToUpper(), Message = "KYC is still pending user completion." });
        }
    }

    public class InitiateDigioRequest
    {
        public Guid UserId { get; set; }
        public string DocumentType { get; set; } = string.Empty; // e.g. AADHAAR, PAN
    }

    public class UpdateKycStatusRequest
    {
        public Guid UserId { get; set; }
        public string NewLevel { get; set; } = string.Empty; // e.g. VERIFIED, REJECTED
    }
}
