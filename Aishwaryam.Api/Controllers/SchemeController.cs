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

        public SchemeController(ISchemeService schemeService)
        {
            _schemeService = schemeService;
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetAvailableSchemes()
        {
            var schemes = await _schemeService.GetAvailableSchemesAsync();
            return Ok(schemes);
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
            var result = await _schemeService.JoinSchemeAsync(request.UserId, request.SchemeMasterId);
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
            var success = await _schemeService.DeleteSchemeMasterAsync(id);
            if (!success) return NotFound("Scheme not found.");
            return Ok(new { Message = "Scheme deleted successfully." });
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
                request.Address
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
    }

    public class JoinSchemeRequest
    {
        public Guid UserId { get; set; }
        public Guid SchemeMasterId { get; set; }
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
}
