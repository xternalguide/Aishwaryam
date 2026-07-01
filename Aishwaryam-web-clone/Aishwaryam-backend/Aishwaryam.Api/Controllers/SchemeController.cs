using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Aishwaryam.Infrastructure.Data;
using Aishwaryam.Domain.Entities;
using System.Linq;

using Aishwaryam.Application.Interfaces.Services;
using System.Collections.Generic;

namespace Aishwaryam.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SchemeController : ControllerBase
    {
        private readonly ISchemeService _schemeService;
        private readonly Aishwaryam.Infrastructure.Data.ApplicationDbContext _db;

        public SchemeController(ISchemeService schemeService, Aishwaryam.Infrastructure.Data.ApplicationDbContext db)
        {
            _schemeService = schemeService;
            _db = db;
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetAvailableSchemes()
        {
            var schemes = await _schemeService.GetAvailableSchemesAsync();
            return Ok(schemes);
        }

        [HttpGet("scrape-pothys")]
        public IActionResult ScrapePothysScheme()
        {
            var data = new
            {
                planName = "DiGiGOLD Purchase Plan",
                description = "Accumulate gold weight daily with instant bonuses. Lock-in period of 330 days. No cash refunds allowed.",
                installmentAmount = 100, // ₹100
                totalInstallments = 300, // 300 days duration
                frequency = "Flexible",
                bonusTiers = new[]
                {
                    new { startDay = 0, endDay = 75, bonusPercentage = 7.0 },
                    new { startDay = 76, endDay = 150, bonusPercentage = 5.0 },
                    new { startDay = 151, endDay = 225, bonusPercentage = 3.0 },
                    new { startDay = 226, endDay = 300, bonusPercentage = 1.0 }
                },
                customSections = new[]
                {
                    new { title = "Scheme Overview", content = "• Name: DiGiGOLD Purchase Plan\n• Minimum Investment: ₹100 per installment. Subsequent payments can be made for any amount starting from ₹100.\n• Tenure: The scheme tenure is 300 days from the date of the first payment. No further accumulation is allowed after 300 days.\n• Maturity: The maturity period is 330 days from the date of the first payment. The lock-in period is a minimum of 330 days.", type = 0 },
                    new { title = "Benefits & Bonus Structure", content = "An instant GOLD weight bonus is calculated and added to the member's account based on the date of each payment:\n• 0 to 75 days: 7% instant GOLD weight bonus (e.g., Rs. 10,000 paid yields Rs. 700 worth of bonus gold).\n• 76 to 150 days: 5% instant GOLD weight bonus (e.g., Rs. 6,000 paid yields Rs. 300 worth of bonus gold).\n• 151 to 225 days: 3% instant GOLD weight bonus (e.g., Rs. 7,000 paid yields Rs. 210 worth of bonus gold).\n• 226 to 300 days: 1% instant GOLD weight bonus (e.g., Rs. 12,000 paid yields Rs. 120 worth of bonus gold).\nNote: Accumulated instant bonus benefits are redeemable only upon successful completion of 330 days.", type = 1 },
                    new { title = "Redemption Policy", content = "• The accumulated gold weight can be redeemed after 330 days at any Aishwaryam Swarna Mahal store.\n• The gold weight can be used to purchase Gold, Platinum, Diamond Jewellery, Silver Articles, Gift items, or Coins.\n• No cash refunds are permitted under any circumstances.", type = 0 },
                    new { title = "Pre-closure & Terms", content = "• Pre-closure: If the account is closed prior to the 330-day maturity period, members can redeem their accumulated gold weight but will not receive any accumulated bonus gold benefits.\n• Taxes: Members shall bear all GST and other government levies applicable at the time of invoice/redemption.\n• Making Charges: Value Addition (V.A.) charges, stone charges, and other making charges are applicable as per store rules and must be borne by the customer.", type = 0 }
                },
                paymentRules = new
                {
                    minAmount = 100,
                    maxAmount = 50000,
                    multiplePerDay = true,
                    earlyExitAfterDays = 180,
                    rating = 4.9,
                    attributes = new[]
                    {
                        new { key = "maturity", enabled = 1, title = "Maturity benefits", description = "Get accumulated gold bonus automatically credited upon completing plan installments." },
                        new { key = "lockable", enabled = 1, title = "Lockable scheme", description = "Lock in lower gold rates during market drops to maximize profit yields." },
                        new { key = "known", enabled = 1, title = "Known rates", description = "Transparent processing and physical gold delivery rates with zero extra charges." }
                    }
                },
                keywords = new[] { "Flexible", "7% Gold Bonus", "Start ₹100", "330 Days Lock-in" }
            };

            return Ok(data);
        }


        [HttpPost("create")]
        public async Task<IActionResult> CreateScheme([FromBody] SchemeMaster scheme)
        {
            List<SchemeBonusTier>? tiers = null;
            if (!string.IsNullOrEmpty(scheme.BonusConfigJson))
            {
                try
                {
                    var parsed = System.Text.Json.JsonSerializer.Deserialize<List<SchemeBonusTierDto>>(scheme.BonusConfigJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (parsed != null)
                    {
                        tiers = parsed.Select(p => new SchemeBonusTier
                        {
                            StartDay = p.StartDay,
                            EndDay = p.EndDay,
                            BonusPercentage = p.BonusPercentage
                        }).ToList();
                    }
                }
                catch
                {
                    // Fallback
                }
            }

            var result = await _schemeService.CreateSchemeMasterAsync(scheme, tiers);
            return Ok(result);
        }

        [HttpPost("update")]
        public async Task<IActionResult> UpdateScheme([FromBody] SchemeMaster scheme)
        {
            List<SchemeBonusTier>? tiers = null;
            if (!string.IsNullOrEmpty(scheme.BonusConfigJson))
            {
                try
                {
                    var parsed = System.Text.Json.JsonSerializer.Deserialize<List<SchemeBonusTierDto>>(scheme.BonusConfigJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (parsed != null)
                    {
                        tiers = parsed.Select(p => new SchemeBonusTier
                        {
                            StartDay = p.StartDay,
                            EndDay = p.EndDay,
                            BonusPercentage = p.BonusPercentage
                        }).ToList();
                    }
                }
                catch
                {
                    // Fallback
                }
            }

            var result = await _schemeService.UpdateSchemeMasterAsync(scheme, tiers);
            return Ok(result);
        }

        [HttpGet("admin/list")]
        public async Task<IActionResult> GetAdminSchemes()
        {
            var schemes = await _schemeService.GetAllSchemeMastersAdminAsync();
            return Ok(schemes);
        }

        [HttpGet("dashboard/{userId}")]
        public async Task<IActionResult> GetDashboardOverview(Guid userId)
        {
            var dashboard = await _schemeService.GetUserSchemeDashboardAsync(userId);
            return Ok(dashboard);
        }

        [HttpPost("toggle-autopay")]
        public async Task<IActionResult> ToggleAutoPay([FromBody] ToggleAutoPayRequest request)
        {
            var success = await _schemeService.ToggleAutoPayAsync(request.UserId, request.SchemeId, request.EnableAutoPay);
            if (!success) return NotFound("Scheme not found.");

            return Ok(new { Message = "AutoPay setting updated successfully." });
        }

        [HttpPost("join")]
        public async Task<IActionResult> JoinScheme([FromBody] JoinSchemeRequest request)
        {
            var result = await _schemeService.JoinSchemeAsync(
                request.UserId, 
                request.SchemeMasterId,
                request.NomineeName,
                request.NomineePhone,
                request.NomineeRelationship,
                request.State,
                request.City,
                request.StreetAddress,
                request.Pincode
            );
            return Ok(result);
        }

        [HttpGet("enrollments")]
        public async Task<IActionResult> GetEnrollments([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 100) pageSize = 100;

            var (enrollments, total) = await _schemeService.GetAllEnrollmentsAsync(page, pageSize);
            var totalPages = (int)Math.Ceiling((double)total / pageSize);

            return Ok(new {
                enrollments = enrollments,
                total = total,
                page = page,
                pageSize = pageSize,
                totalPages = totalPages
            });
        }

        [HttpGet("maturity-summary/{schemeId}")]
        public async Task<IActionResult> GetMaturitySummary(Guid schemeId)
        {
            var summary = await _schemeService.GetMaturitySummaryAsync(schemeId);
            if (summary == null) return NotFound("Matured scheme not found.");
            return Ok(summary);
        }

        [HttpPost("claim")]
        public async Task<IActionResult> ClaimScheme([FromBody] ClaimSchemeRequest request)
        {
            var success = await _schemeService.ClaimMaturedSchemeAsync(request.UserId, request.SchemeId);
            if (!success) return BadRequest("Unable to claim scheme. It may not be matured or belongs to another user.");
            return Ok(new { Message = "Scheme claimed successfully!" });
        }

        [HttpGet("admin/matured")]
        public async Task<IActionResult> GetMaturedSchemes()
        {
            // Admin only view
            var matured = await _schemeService.GetMaturedSchemesForAdminAsync();
            return Ok(matured);
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteScheme(Guid id)
        {
            try
            {
                var success = await _schemeService.DeleteSchemeMasterAsync(id);
                if (!success) return NotFound("Scheme not found.");
                return Ok(new { Message = "Scheme deleted successfully." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        // Phase 3 Scheme Ledger & Redemption API
        [HttpPost("invest")]
        public async Task<IActionResult> InvestInScheme([FromBody] InvestSchemeRequest request)
        {
            var result = await _schemeService.InvestInSchemeAsync(
                request.UserId, 
                request.SchemeId, 
                request.AmountPaise, 
                request.RazorpayPaymentId, 
                request.IpAddress, 
                request.DeviceFingerprint
            );
            return Ok(result);
        }

        [HttpGet("{id:guid}/progress")]
        public async Task<IActionResult> GetSchemeProgress(Guid id)
        {
            var progress = await _schemeService.GetSchemeProgressAsync(id);
            if (progress == null) return NotFound("Scheme not found.");
            return Ok(progress);
        }

        [HttpGet("{id:guid}/ledger")]
        public async Task<IActionResult> GetSchemeLedger(Guid id)
        {
            var ledger = await _schemeService.GetSchemeLedgerAsync(id);
            return Ok(ledger);
        }

        [HttpPost("redeem-request")]
        public async Task<IActionResult> RequestRedemption([FromBody] RequestRedemptionRequest request)
        {
            var result = await _schemeService.RequestRedemptionAsync(
                request.UserId, 
                request.SchemeId, 
                request.RedemptionType, 
                request.Address,
                request.IncludeBonusGold
            );
            return Ok(result);
        }

        [HttpPost("admin/redemptions/{id:guid}/approve")]
        public async Task<IActionResult> ApproveRedemption(Guid id, [FromBody] AdminApproveRedemptionRequest request)
        {
            var success = await _schemeService.ApproveRedemptionAsync(id, request.AdminId, request.Notes);
            if (!success) return BadRequest("Could not approve redemption request.");
            return Ok(new { Message = "Redemption request approved successfully!" });
        }

        [HttpPost("admin/redemptions/{id:guid}/reject")]
        public async Task<IActionResult> RejectRedemption(Guid id, [FromBody] AdminRejectRedemptionRequest request)
        {
            var success = await _schemeService.RejectRedemptionAsync(id, request.AdminId, request.Reason);
            if (!success) return BadRequest("Could not reject redemption request.");
            return Ok(new { Message = "Redemption request rejected successfully." });
        }

        [HttpGet("admin/redemptions")]
        public async Task<IActionResult> GetPendingRedemptions()
        {
            var redemptions = await _schemeService.GetPendingRedemptionsForAdminAsync();
            return Ok(redemptions);
        }

        [HttpDelete("admin/wipe-all")]
        public async Task<IActionResult> WipeAllSchemes([FromHeader(Name = "X-Confirm")] string? confirm)
        {
            if (confirm != "WIPE") return BadRequest(new { error = "Send header X-Confirm: WIPE to confirm wipe." });
            // Delete in FK-safe order
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM scheme_investments;");
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM scheme_redemptions;");
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM redemption_status_history;");
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM scheme_bonus_tiers;");
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM user_schemes;");
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM schemes_master;");
            return Ok(new { message = "All scheme data wiped successfully. Users and gold wallets are untouched." });
        }

        [HttpPost("{id:guid}/submit-form")]
        public async Task<IActionResult> SubmitJoinForm(Guid id, [FromBody] SubmitJoinFormRequest request)
        {
            var result = await _schemeService.SubmitJoinFormAsync(
                id,
                request.UserId,
                request.NomineeName,
                request.NomineePhone,
                request.NomineeRelationship,
                request.State,
                request.City,
                request.StreetAddress,
                request.Pincode
            );
            return Ok(result);
        }
    }

    public class JoinSchemeRequest
    {
        public Guid UserId { get; set; }
        public Guid SchemeMasterId { get; set; }
        public string? NomineeName { get; set; }
        public string? NomineePhone { get; set; }
        public string? NomineeRelationship { get; set; }
        public string? State { get; set; }
        public string? City { get; set; }
        public string? StreetAddress { get; set; }
        public string? Pincode { get; set; }
    }

    public class ToggleAutoPayRequest
    {
        public Guid UserId { get; set; }
        public Guid SchemeId { get; set; }
        public bool EnableAutoPay { get; set; }
    }

    public class ClaimSchemeRequest
    {
        public Guid UserId { get; set; }
        public Guid SchemeId { get; set; }
    }

    public class InvestSchemeRequest
    {
        public Guid UserId { get; set; }
        public Guid SchemeId { get; set; }
        public long AmountPaise { get; set; }
        public string? RazorpayPaymentId { get; set; }
        public string IpAddress { get; set; } = "127.0.0.1";
        public string DeviceFingerprint { get; set; } = "WEB_BROWSER";
    }

    public class RequestRedemptionRequest
    {
        public Guid UserId { get; set; }
        public Guid SchemeId { get; set; }
        public string RedemptionType { get; set; } = "CASH"; // CASH, DELIVERY, JEWELLERY
        public string? Address { get; set; }
        public bool IncludeBonusGold { get; set; } = false;
    }

    public class AdminApproveRedemptionRequest
    {
        public string? AdminId { get; set; }
        public string? Notes { get; set; }
    }

    public class AdminRejectRedemptionRequest
    {
        public string? AdminId { get; set; }
        public string Reason { get; set; } = string.Empty;
    }

    public class SchemeBonusTierDto
    {
        public int StartDay { get; set; }
        public int EndDay { get; set; }
        public decimal BonusPercentage { get; set; }
    }

    public class SubmitJoinFormRequest
    {
        public Guid UserId { get; set; }
        public string NomineeName { get; set; } = string.Empty;
        public string NomineePhone { get; set; } = string.Empty;
        public string NomineeRelationship { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string StreetAddress { get; set; } = string.Empty;
        public string Pincode { get; set; } = string.Empty;
    }
}
