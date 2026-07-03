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
using Aishwaryam.Domain.Entities;

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

        [HttpPost("mature-silver-schemes")]
        public async Task<IActionResult> MatureSilverSchemes()
        {
            var context = HttpContext.RequestServices.GetRequiredService<ApplicationDbContext>();
            
            // Find all active UserSchemes where plan name contains 'silver'
            var silverSchemes = await context.UserSchemes
                .Where(s => s.Status == "Active" && s.PlanName.ToLower().Contains("silver"))
                .ToListAsync();

            foreach (var scheme in silverSchemes)
            {
                // Make the scheme completed by today (joined 12 months ago)
                scheme.CreatedAt = DateTime.UtcNow.AddMonths(-12);
                scheme.MaturityDate = DateTime.UtcNow; 
                scheme.Status = "Matured";
                scheme.UpdatedAt = DateTime.UtcNow;
            }

            await context.SaveChangesAsync();
            return Ok(new { message = $"Successfully updated and matured {silverSchemes.Count} silver schemes.", schemes = silverSchemes });
        }

        [HttpPost("mature-sri-venkatesh-silver")]
        public async Task<IActionResult> MatureSriVenkateshSilver()
        {
            var context = HttpContext.RequestServices.GetRequiredService<ApplicationDbContext>();
            
            // 1. Find the user named 'Sri Venkatesh'
            var user = await context.Users
                .FirstOrDefaultAsync(u => u.FullName.ToLower().Contains("sri venkatesh"));
                
            if (user == null)
            {
                return NotFound(new { message = "User Sri Venkatesh not found." });
            }

            // 2. Find the active silver scheme for this user
            var silverScheme = await context.UserSchemes
                .FirstOrDefaultAsync(s => s.UserId == user.Id && s.Status == "Active" && s.PlanName.ToLower().Contains("silver"));

            if (silverScheme == null)
            {
                return NotFound(new { message = "No active silver scheme found for Sri Venkatesh." });
            }

            // 3. Set CreatedAt to 334 days ago, and MaturityDate to today
            silverScheme.CreatedAt = DateTime.UtcNow.AddDays(-334);
            silverScheme.MaturityDate = DateTime.UtcNow;
            silverScheme.Status = "Matured"; // Mark it matured directly so it instantly unlocks
            silverScheme.UpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();
            return Ok(new { message = "Successfully updated Sri Venkatesh silver scheme to 334 days matured.", scheme = silverScheme });
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

        [HttpPost("users/{userId}/reset-data")]
        public async Task<IActionResult> ResetSpecificUserData(Guid userId, [FromServices] ApplicationDbContext dbContext)
        {
            try
            {
                var user = await dbContext.Users.FindAsync(userId);
                if (user == null) return NotFound(new { message = "User not found" });

                // 1. Delete user schemes
                var schemes = await dbContext.UserSchemes.Where(s => s.UserId == userId).ToListAsync();
                dbContext.UserSchemes.RemoveRange(schemes);

                // 2. Delete gold transactions
                var goldTxs = await dbContext.GoldTransactions.Where(t => t.UserId == userId).ToListAsync();
                dbContext.GoldTransactions.RemoveRange(goldTxs);

                // 3. Delete payments
                var payments = await dbContext.Payments.Where(p => p.UserId == userId).ToListAsync();
                dbContext.Payments.RemoveRange(payments);

                // 4. Delete wallet ledger
                var ledger = await dbContext.WalletLedgers.Where(w => w.UserId == userId).ToListAsync();
                dbContext.WalletLedgers.RemoveRange(ledger);

                // 5. Delete withdrawals / withdrawal requests
                var withdrawals = await dbContext.WithdrawalRequests.Where(w => w.UserId == userId).ToListAsync();
                dbContext.WithdrawalRequests.RemoveRange(withdrawals);

                // 6. Delete scheme investments
                var investments = await dbContext.SchemeInvestments.Where(i => i.UserId == userId).ToListAsync();
                dbContext.SchemeInvestments.RemoveRange(investments);

                // 7. Delete scheme redemptions
                var redemptions = await dbContext.SchemeRedemptions.Where(r => r.UserId == userId).ToListAsync();
                dbContext.SchemeRedemptions.RemoveRange(redemptions);

                // 8. Delete user notifications
                var notifications = await dbContext.UserNotifications.Where(n => n.UserId == userId).ToListAsync();
                dbContext.UserNotifications.RemoveRange(notifications);

                // 9. Reset Gold Holdings to zero
                var goldHolding = await dbContext.GoldHoldings.FirstOrDefaultAsync(h => h.UserId == userId);
                if (goldHolding != null)
                {
                    goldHolding.GoldBalanceMg = 0;
                    goldHolding.BonusGoldBalanceMg = 0;
                    goldHolding.UpdatedAt = DateTimeOffset.UtcNow;
                    dbContext.GoldHoldings.Update(goldHolding);
                }

                // 10. Reset Wallet balance to zero
                var wallet = await dbContext.Wallets.FirstOrDefaultAsync(w => w.UserId == userId);
                if (wallet != null)
                {
                    wallet.InrBalancePaise = 0;
                    wallet.UpdatedAt = DateTimeOffset.UtcNow;
                    dbContext.Wallets.Update(wallet);
                }

                // Update database timestamp to force dashboard refresh
                ApplicationDbContext.LastDbChangeTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

                await dbContext.SaveChangesAsync();
                return Ok(new { success = true, message = $"Successfully reset transactional activity data for user {user.FullName}." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error resetting user data", error = ex.Message });
            }
        }

        // ==========================================
        // SUPER ADMIN CRUD FOR USERS
        // ==========================================

        [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request, [FromServices] ApplicationDbContext dbContext)
        {
            try
            {
                if (string.IsNullOrEmpty(request.PhoneNumber))
                    return BadRequest(new { message = "Phone number is required." });

                var exists = await dbContext.Users.AnyAsync(u => u.PhoneNumber == request.PhoneNumber);
                if (exists)
                    return BadRequest(new { message = "User with this phone number already exists." });

                var userId = Guid.NewGuid();
                var random = new Random();
                string code;
                bool isUnique = false;
                do
                {
                    code = "AISH" + random.Next(100000, 999999).ToString();
                    isUnique = !await dbContext.Users.AnyAsync(u => u.ReferralCode == code);
                } while (!isUnique);

                var user = new User
                {
                    Id = userId,
                    FullName = request.FullName,
                    PhoneNumber = request.PhoneNumber,
                    Email = request.Email,
                    KycLevel = request.KycLevel ?? "BASIC",
                    IsActive = request.IsActive,
                    ReferralCode = code,
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                };

                dbContext.Users.Add(user);

                var wallet = new Wallet { UserId = userId, InrBalancePaise = 0, UpdatedAt = DateTimeOffset.UtcNow };
                dbContext.Wallets.Add(wallet);

                var goldHolding = new GoldHolding { UserId = userId, GoldBalanceMg = 0, BonusGoldBalanceMg = 0, UpdatedAt = DateTimeOffset.UtcNow };
                dbContext.GoldHoldings.Add(goldHolding);

                ApplicationDbContext.LastDbChangeTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                await dbContext.SaveChangesAsync();

                return Ok(new { success = true, message = "User created successfully.", user });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating user", error = ex.Message });
            }
        }

        [HttpPut("users/{userId}")]
        public async Task<IActionResult> UpdateUser(Guid userId, [FromBody] AdminUpdateUserRequest request, [FromServices] ApplicationDbContext dbContext)
        {
            try
            {
                var user = await dbContext.Users.FindAsync(userId);
                if (user == null) return NotFound(new { message = "User not found" });

                if (!string.IsNullOrEmpty(request.PhoneNumber))
                {
                    var phoneTaken = await dbContext.Users.AnyAsync(u => u.PhoneNumber == request.PhoneNumber && u.Id != userId);
                    if (phoneTaken) return BadRequest(new { message = "Phone number is already in use by another user." });
                    user.PhoneNumber = request.PhoneNumber;
                }

                if (!string.IsNullOrEmpty(request.Email))
                {
                    var emailTaken = await dbContext.Users.AnyAsync(u => u.Email == request.Email && u.Id != userId);
                    if (emailTaken) return BadRequest(new { message = "Email is already in use by another user." });
                    user.Email = request.Email;
                }

                user.FullName = request.FullName ?? user.FullName;
                user.KycLevel = request.KycLevel ?? user.KycLevel;
                user.IsActive = request.IsActive;
                user.UpdatedAt = DateTimeOffset.UtcNow;

                dbContext.Users.Update(user);

                ApplicationDbContext.LastDbChangeTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                await dbContext.SaveChangesAsync();

                return Ok(new { success = true, message = "User details updated successfully.", user });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating user details", error = ex.Message });
            }
        }

        [HttpDelete("users/{userId}")]
        public async Task<IActionResult> HardDeleteUser(Guid userId, [FromServices] ApplicationDbContext dbContext)
        {
            try
            {
                var user = await dbContext.Users.FindAsync(userId);
                if (user == null) return NotFound(new { message = "User not found" });

                // Delete linked entities cascade
                var schemes = await dbContext.UserSchemes.Where(s => s.UserId == userId).ToListAsync();
                dbContext.UserSchemes.RemoveRange(schemes);

                var goldTxs = await dbContext.GoldTransactions.Where(t => t.UserId == userId).ToListAsync();
                dbContext.GoldTransactions.RemoveRange(goldTxs);

                var payments = await dbContext.Payments.Where(p => p.UserId == userId).ToListAsync();
                dbContext.Payments.RemoveRange(payments);

                var ledger = await dbContext.WalletLedgers.Where(w => w.UserId == userId).ToListAsync();
                dbContext.WalletLedgers.RemoveRange(ledger);

                var withdrawals = await dbContext.WithdrawalRequests.Where(w => w.UserId == userId).ToListAsync();
                dbContext.WithdrawalRequests.RemoveRange(withdrawals);

                var investments = await dbContext.SchemeInvestments.Where(i => i.UserId == userId).ToListAsync();
                dbContext.SchemeInvestments.RemoveRange(investments);

                var redemptions = await dbContext.SchemeRedemptions.Where(r => r.UserId == userId).ToListAsync();
                dbContext.SchemeRedemptions.RemoveRange(redemptions);

                var notifications = await dbContext.UserNotifications.Where(n => n.UserId == userId).ToListAsync();
                dbContext.UserNotifications.RemoveRange(notifications);

                var deviceLogs = await dbContext.UserDevices.Where(d => d.UserId == userId).ToListAsync();
                dbContext.UserDevices.RemoveRange(deviceLogs);

                var bankAccounts = await dbContext.BankAccounts.Where(b => b.UserId == userId).ToListAsync();
                dbContext.BankAccounts.RemoveRange(bankAccounts);

                var goldHolding = await dbContext.GoldHoldings.FirstOrDefaultAsync(h => h.UserId == userId);
                if (goldHolding != null) dbContext.GoldHoldings.Remove(goldHolding);

                var wallet = await dbContext.Wallets.FirstOrDefaultAsync(w => w.UserId == userId);
                if (wallet != null) dbContext.Wallets.Remove(wallet);

                dbContext.Users.Remove(user);

                ApplicationDbContext.LastDbChangeTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                await dbContext.SaveChangesAsync();

                return Ok(new { success = true, message = $"User {user.FullName} and all associated data records hard-deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error during user hard delete", error = ex.Message });
            }
        }

        // ==========================================
        // SUPER ADMIN CRUD FOR TRANSACTIONS
        // ==========================================

        [HttpPost("transactions")]
        public async Task<IActionResult> CreateTransaction([FromBody] CreateTransactionRequest request, [FromServices] ApplicationDbContext dbContext)
        {
            try
            {
                var userExists = await dbContext.Users.AnyAsync(u => u.Id == request.UserId);
                if (!userExists) return BadRequest(new { message = "Target user not found." });

                var transactionId = Guid.NewGuid();
                var tx = new GoldTransaction
                {
                    Id = transactionId,
                    UserId = request.UserId,
                    TransactionType = request.TransactionType ?? "BUY",
                    GoldWeightMg = request.GoldWeightMg,
                    TotalAmountPaise = request.TotalAmountPaise,
                    PricePerGmPaise = request.PricePerGmPaise,
                    CreatedAt = DateTimeOffset.UtcNow,
                    RateSource = "MANUAL_SUPERADMIN",
                    RateTimestamp = DateTimeOffset.UtcNow
                };

                dbContext.GoldTransactions.Add(tx);

                // Update Gold Holdings
                var goldHolding = await dbContext.GoldHoldings.FirstOrDefaultAsync(h => h.UserId == request.UserId);
                if (goldHolding != null)
                {
                    if (tx.TransactionType == "BUY" || tx.TransactionType == "BONUS")
                        goldHolding.GoldBalanceMg += request.GoldWeightMg;
                    else if (tx.TransactionType == "SELL")
                        goldHolding.GoldBalanceMg = Math.Max(0, goldHolding.GoldBalanceMg - request.GoldWeightMg);

                    goldHolding.UpdatedAt = DateTimeOffset.UtcNow;
                    dbContext.GoldHoldings.Update(goldHolding);
                }

                ApplicationDbContext.LastDbChangeTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                await dbContext.SaveChangesAsync();

                return Ok(new { success = true, message = "Transaction logged successfully.", transaction = tx });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error logging transaction", error = ex.Message });
            }
        }

        [HttpPut("transactions/{transactionId}")]
        public async Task<IActionResult> UpdateTransaction(Guid transactionId, [FromBody] UpdateTransactionRequest request, [FromServices] ApplicationDbContext dbContext)
        {
            try
            {
                var tx = await dbContext.GoldTransactions.FindAsync(transactionId);
                if (tx == null) return NotFound(new { message = "Transaction not found." });

                var goldHolding = await dbContext.GoldHoldings.FirstOrDefaultAsync(h => h.UserId == tx.UserId);
                if (goldHolding != null)
                {
                    // Revert old transaction weight
                    if (tx.TransactionType == "BUY" || tx.TransactionType == "BONUS")
                        goldHolding.GoldBalanceMg = Math.Max(0, goldHolding.GoldBalanceMg - tx.GoldWeightMg);
                    else if (tx.TransactionType == "SELL")
                        goldHolding.GoldBalanceMg += tx.GoldWeightMg;

                    // Apply new transaction type and details
                    tx.TransactionType = request.TransactionType ?? tx.TransactionType;
                    tx.GoldWeightMg = request.GoldWeightMg;
                    tx.TotalAmountPaise = request.TotalAmountPaise;
                    tx.PricePerGmPaise = request.PricePerGmPaise;
                    tx.RateTimestamp = DateTimeOffset.UtcNow;

                    // Re-apply weight
                    if (tx.TransactionType == "BUY" || tx.TransactionType == "BONUS")
                        goldHolding.GoldBalanceMg += request.GoldWeightMg;
                    else if (tx.TransactionType == "SELL")
                        goldHolding.GoldBalanceMg = Math.Max(0, goldHolding.GoldBalanceMg - request.GoldWeightMg);

                    goldHolding.UpdatedAt = DateTimeOffset.UtcNow;
                    dbContext.GoldHoldings.Update(goldHolding);
                }

                dbContext.GoldTransactions.Update(tx);

                ApplicationDbContext.LastDbChangeTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                await dbContext.SaveChangesAsync();

                return Ok(new { success = true, message = "Transaction updated successfully.", transaction = tx });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating transaction details", error = ex.Message });
            }
        }

        [HttpDelete("transactions/{transactionId}")]
        public async Task<IActionResult> DeleteTransaction(Guid transactionId, [FromServices] ApplicationDbContext dbContext)
        {
            try
            {
                var tx = await dbContext.GoldTransactions.FindAsync(transactionId);
                if (tx == null) return NotFound(new { message = "Transaction not found." });

                var goldHolding = await dbContext.GoldHoldings.FirstOrDefaultAsync(h => h.UserId == tx.UserId);
                if (goldHolding != null)
                {
                    // Revert transaction weight
                    if (tx.TransactionType == "BUY" || tx.TransactionType == "BONUS")
                        goldHolding.GoldBalanceMg = Math.Max(0, goldHolding.GoldBalanceMg - tx.GoldWeightMg);
                    else if (tx.TransactionType == "SELL")
                        goldHolding.GoldBalanceMg += tx.GoldWeightMg;

                    goldHolding.UpdatedAt = DateTimeOffset.UtcNow;
                    dbContext.GoldHoldings.Update(goldHolding);
                }

                dbContext.GoldTransactions.Remove(tx);

                ApplicationDbContext.LastDbChangeTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                await dbContext.SaveChangesAsync();

                return Ok(new { success = true, message = "Transaction reversed and deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting transaction", error = ex.Message });
            }
        }
    }

    public class CreateUserRequest
    {
        public string PhoneNumber { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
        public string KycLevel { get; set; }
        public bool IsActive { get; set; }
    }

    public class AdminUpdateUserRequest
    {
        public string PhoneNumber { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
        public string KycLevel { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateTransactionRequest
    {
        public Guid UserId { get; set; }
        public string TransactionType { get; set; }
        public long GoldWeightMg { get; set; }
        public long TotalAmountPaise { get; set; }
        public long PricePerGmPaise { get; set; }
    }

    public class UpdateTransactionRequest
    {
        public string TransactionType { get; set; }
        public long GoldWeightMg { get; set; }
        public long TotalAmountPaise { get; set; }
        public long PricePerGmPaise { get; set; }
    }
}

