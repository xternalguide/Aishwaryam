using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Aishwaryam.Application.DTOs.Admin;
using Aishwaryam.Application.Interfaces.Services;
using Microsoft.EntityFrameworkCore;
using Aishwaryam.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;

namespace Aishwaryam.Api.Controllers
{
    public class ReceiptConfigRequest
    {
        public string ReceiptCompanyName { get; set; }
        public string ReceiptSubtitle { get; set; }
        public string ReceiptCorpName { get; set; }
        public string ReceiptAddress1 { get; set; }
        public string ReceiptAddress2 { get; set; }
        public string ReceiptPhone { get; set; }
        public string ReceiptEmail { get; set; }
        public string ReceiptColorPrimary { get; set; }
        public string ReceiptColorSecondary { get; set; }
        public string ReceiptDisclaimerGold { get; set; }
        public string ReceiptDisclaimerSilver { get; set; }
        public string ReceiptRegisteredOffice { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    // [Authorize(Roles = "Admin")] // Uncomment when auth is fully hooked up
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public AdminController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        [HttpGet("db-version")]
        public IActionResult GetDatabaseVersion()
        {
            return Ok(new { version = ApplicationDbContext.LastDbChangeTimestamp });
        }

        [HttpGet("kpis")]
        public async Task<IActionResult> GetOperationalKpis()
        {
            try
            {
                var kpis = await _adminService.GetOperationalKpisAsync();
                return Ok(kpis);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching KPIs", error = ex.Message });
            }
        }

        [HttpGet("audit-logs")]
        public async Task<IActionResult> GetAuditLogs([FromQuery] int limit = 100)
        {
            try
            {
                var logs = await _adminService.GetAuditLogsAsync(limit);
                return Ok(logs);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching audit logs", error = ex.Message });
            }
        }

        [HttpPost("kyc-action")]
        public async Task<IActionResult> ProcessKycAction([FromBody] KycActionRequest request)
        {
            try
            {
                // In production, get AdminEmail and IpAddress from User Claims/Context
                request.AdminEmail = "admin@aishwaryam.com"; 
                
                var success = await _adminService.ProcessKycActionAsync(request);
                if (success)
                    return Ok(new { success = true, message = "KYC status updated successfully." });
                return BadRequest(new { success = false, message = "Failed to update KYC status." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error processing KYC action", error = ex.Message });
            }
        }

        [HttpPost("users/{userId}/toggle-active")]
        public async Task<IActionResult> ToggleUserActive(Guid userId)
        {
            try
            {
                var success = await _adminService.ToggleUserActiveAsync(userId, "admin@aishwaryam.com");
                if (success)
                    return Ok(new { success = true, message = "User active status toggled successfully." });
                return BadRequest(new { success = false, message = "Failed to toggle user status." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error toggling user status", error = ex.Message });
            }
        }

        [HttpGet("reports/daily-reconciliation")]
        public async Task<IActionResult> DownloadDailyReconciliation([FromQuery] string date)
        {
            try
            {
                if (!DateTime.TryParse(date, out DateTime parsedDate))
                    parsedDate = DateTime.UtcNow.Date;

                var csvBytes = await _adminService.GenerateDailyReconciliationReportAsync(parsedDate);
                return File(csvBytes, "text/csv", $"Reconciliation_{parsedDate:yyyyMMdd}.csv");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error generating report", error = ex.Message });
            }
        }

        [HttpGet("daily-notification-setting")]
        public async Task<IActionResult> GetDailyNotificationSetting([FromServices] ApplicationDbContext db)
        {
            try
            {
                var config = await db.AppConfigs.FirstOrDefaultAsync();
                if (config == null) return NotFound("App configuration not found.");
                return Ok(new { isEnabled = config.IsDailyPriceNotificationEnabled });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching daily price notification setting", error = ex.Message });
            }
        }

        [HttpPost("daily-notification-setting/toggle")]
        public async Task<IActionResult> ToggleDailyNotificationSetting([FromServices] ApplicationDbContext db)
        {
            try
            {
                var config = await db.AppConfigs.FirstOrDefaultAsync();
                if (config == null) return NotFound("App configuration not found.");
                
                config.IsDailyPriceNotificationEnabled = !config.IsDailyPriceNotificationEnabled;
                config.UpdatedAt = DateTimeOffset.UtcNow;
                await db.SaveChangesAsync();

                return Ok(new { success = true, isEnabled = config.IsDailyPriceNotificationEnabled, message = $"Automated daily price notification set to {config.IsDailyPriceNotificationEnabled}" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error toggling daily price notification setting", error = ex.Message });
            }
        }

        [HttpGet("receipt-config")]
        [AllowAnonymous] // Allow access from Admin panel
        public async Task<IActionResult> GetReceiptConfig([FromServices] ApplicationDbContext db)
        {
            try
            {
                var config = await db.AppConfigs.FirstOrDefaultAsync();
                if (config == null) return NotFound("App configuration not found.");
                return Ok(config);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching receipt config", error = ex.Message });
            }
        }

        [HttpPost("receipt-config")]
        [AllowAnonymous] // Allow access from Admin panel
        public async Task<IActionResult> UpdateReceiptConfig([FromBody] ReceiptConfigRequest request, [FromServices] ApplicationDbContext db)
        {
            try
            {
                var config = await db.AppConfigs.FirstOrDefaultAsync();
                if (config == null) return NotFound("App configuration not found.");

                config.ReceiptCompanyName = request.ReceiptCompanyName ?? config.ReceiptCompanyName;
                config.ReceiptSubtitle = request.ReceiptSubtitle ?? config.ReceiptSubtitle;
                config.ReceiptCorpName = request.ReceiptCorpName ?? config.ReceiptCorpName;
                config.ReceiptAddress1 = request.ReceiptAddress1 ?? config.ReceiptAddress1;
                config.ReceiptAddress2 = request.ReceiptAddress2 ?? config.ReceiptAddress2;
                config.ReceiptPhone = request.ReceiptPhone ?? config.ReceiptPhone;
                config.ReceiptEmail = request.ReceiptEmail ?? config.ReceiptEmail;
                config.ReceiptColorPrimary = request.ReceiptColorPrimary ?? config.ReceiptColorPrimary;
                config.ReceiptColorSecondary = request.ReceiptColorSecondary ?? config.ReceiptColorSecondary;
                config.ReceiptDisclaimerGold = request.ReceiptDisclaimerGold ?? config.ReceiptDisclaimerGold;
                config.ReceiptDisclaimerSilver = request.ReceiptDisclaimerSilver ?? config.ReceiptDisclaimerSilver;
                config.ReceiptRegisteredOffice = request.ReceiptRegisteredOffice ?? config.ReceiptRegisteredOffice;
                config.UpdatedAt = DateTimeOffset.UtcNow;

                await db.SaveChangesAsync();
                return Ok(new { success = true, message = "Receipt configuration updated successfully.", config });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating receipt config", error = ex.Message });
            }
        }

        [HttpPost("receipt-logo")]
        [AllowAnonymous] // Allow access from Admin panel
        public async Task<IActionResult> UploadReceiptLogo(IFormFile file, [FromServices] Microsoft.Extensions.Hosting.IHostEnvironment env)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest("No file uploaded.");

                var uploadsFolder = Path.Combine(env.ContentRootPath, "wwwroot");
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                var filePath = Path.Combine(uploadsFolder, "logo.png");
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                return Ok(new { success = true, message = "Logo uploaded successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error uploading logo", error = ex.Message });
            }
        }

        [HttpPost("clear-user-data")]
        public async Task<IActionResult> ClearUserData([FromServices] IServiceProvider serviceProvider)
        {
            try
            {
                // Resolve ApplicationDbContext dynamically to avoid circular references
                using var scope = serviceProvider.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<Aishwaryam.Infrastructure.Data.ApplicationDbContext>();
                
                var tablesToTruncate = new[]
                {
                    "login_attempt_logs", "gold_holdings", "wallets", "dispute_messages", "user_devices",
                    "notifications", "otp_logs", "kyc_details", "kyc_documents", "referrals", "payments",
                    "bank_accounts", "referral_events", "user_activity_logs", "users", "user_claimed_offers",
                    "user_schemes", "user_notifications", "email_logs", "user_offer_redemptions", "invoices",
                    "idempotency_keys", "disputes", "wallet_ledger", "gold_transactions", "auth_sessions",
                    "webhook_event_logs", "withdrawals", "platform_audit_logs", "admin_alerts"
                };
                
                var sql = $"TRUNCATE TABLE {string.Join(", ", tablesToTruncate.Select(t => $"\"{t}\""))} CASCADE;";
                await Microsoft.EntityFrameworkCore.RelationalDatabaseFacadeExtensions.ExecuteSqlRawAsync(dbContext.Database, sql);
                
                return Ok(new { success = true, message = "User data cleared successfully!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to clear database.", error = ex.Message });
            }
        }
    }
}
