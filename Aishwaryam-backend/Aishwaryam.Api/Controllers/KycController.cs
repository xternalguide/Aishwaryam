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

        [HttpPost("ai-verify")]
        public async Task<IActionResult> VerifyKycWithAi([FromBody] AiVerifyKycRequest request)
        {
            if (request.UserId == Guid.Empty || string.IsNullOrEmpty(request.DocumentType) || string.IsNullOrEmpty(request.CardNumber))
                return BadRequest(new { Success = false, Message = "User ID, Document Type, and Card Number are required." });

            var user = await _context.Users.FindAsync(request.UserId);
            if (user == null) return NotFound(new { Success = false, Message = "User not found." });

            string docTypeUpper = request.DocumentType.ToUpper();
            string cleanCardNum = request.CardNumber.Replace(" ", "").ToUpper();

            // Validate format as a pre-check
            if (docTypeUpper == "AADHAAR")
            {
                if (cleanCardNum.Length != 12 || !System.Text.RegularExpressions.Regex.IsMatch(cleanCardNum, @"^\d{12}$"))
                {
                    return BadRequest(new { Success = false, Message = "Invalid Aadhaar number format. Must be 12 digits." });
                }
            }
            else if (docTypeUpper == "PAN")
            {
                if (cleanCardNum.Length != 10 || !System.Text.RegularExpressions.Regex.IsMatch(cleanCardNum, @"^[A-Z]{5}[0-9]{4}[A-Z]{1}$"))
                {
                    return BadRequest(new { Success = false, Message = "Invalid PAN number format. Must be 10 characters (e.g., ABCDE1234F)." });
                }
            }
            else
            {
                return BadRequest(new { Success = false, Message = "Unsupported document type. Use AADHAAR or PAN." });
            }

            if (string.IsNullOrEmpty(request.ImageBase64))
            {
                return BadRequest(new { Success = false, Message = "Document image is required for AI scan." });
            }

            // --- PYTHON MICROSERVICE INTEGRATION SIMULATION ---
            // In the future, you can invoke your Python AI container here via HTTP:
            // var client = new HttpClient();
            // var pythonResponse = await client.PostAsync("http://python-ai-service/ocr", ...);
            
            // For now, we simulate success and automatically approve the user instantly!
            var kycDoc = new Aishwaryam.Domain.Entities.KycDocument
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
                DocumentType = docTypeUpper,
                DocumentNumber = cleanCardNum,
                DocumentUrl = "ai_scanned_ocr_success",
                Status = "VERIFIED",
                CreatedAt = DateTimeOffset.UtcNow,
                UploadedAt = DateTimeOffset.UtcNow
            };
            
            await _context.KycDocuments.AddAsync(kycDoc);

            // Update user KYC level
            user.KycLevel = "VERIFIED";
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await _notificationService.SendNotificationAsync(request.UserId, "KYC Approved! ✅", $"Your {docTypeUpper} e-KYC has been successfully auto-verified by our AI system.", "KYC_UPDATE");

            return Ok(new { Success = true, Status = "VERIFIED", Message = $"{docTypeUpper} verified successfully by AI service!" });
        }
    }

    public class AiVerifyKycRequest
    {
        public Guid UserId { get; set; }
        public string DocumentType { get; set; } = string.Empty; // AADHAAR or PAN
        public string CardNumber { get; set; } = string.Empty;
        public string ImageBase64 { get; set; } = string.Empty; // Base64 document image
    }

    public class UpdateKycStatusRequest
    {
        public Guid UserId { get; set; }
        public string NewLevel { get; set; } = string.Empty; // e.g. VERIFIED, REJECTED
    }
}
