using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Aishwaryam.Application.Interfaces.Repositories;
using Aishwaryam.Application.Interfaces.Services;
using Aishwaryam.Domain.Entities;
using System.Linq;
using Microsoft.EntityFrameworkCore;

namespace Aishwaryam.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly Aishwaryam.Infrastructure.Data.ApplicationDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IGoldRepository _goldRepository;
        private readonly INotificationService _notificationService;
        private readonly IGoldService _goldService;

        public UserController(
            Aishwaryam.Infrastructure.Data.ApplicationDbContext context,
            IEmailService emailService,
            IGoldRepository goldRepository,
            INotificationService notificationService,
            IGoldService goldService)
        {
            _context = context;
            _emailService = emailService;
            _goldRepository = goldRepository;
            _notificationService = notificationService;
            _goldService = goldService;
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Users
                .OrderByDescending(u => u.CreatedAt)
                .Select(u => new {
                    u.Id,
                    u.FullName,
                    u.PhoneNumber,
                    u.Email,
                    u.KycLevel,
                    u.IsActive,
                    u.DateOfBirth,
                    u.WeddingAnniversaryDate,
                    u.CreatedAt
                })
                .ToListAsync();
            return Ok(users);
        }

        [HttpGet("profile/{userId}")]
        public async Task<IActionResult> GetProfile(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) 
            {
                user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
                if (user == null) return NotFound();
            }

            if (string.IsNullOrEmpty(user.ReferralCode))
            {
                var random = new Random();
                string code;
                bool isUnique = false;
                do
                {
                    code = "AISH" + random.Next(100000, 999999).ToString();
                    isUnique = !await _context.Users.AnyAsync(u => u.ReferralCode == code);
                } while (!isUnique);
                
                user.ReferralCode = code;
                await _context.SaveChangesAsync();
            }
            
            var referralEvent = await _context.ReferralEvents
                .Include(r => r.ReferrerUser)
                .FirstOrDefaultAsync(r => r.RefereeUserId == userId);
            string? referredByCode = referralEvent?.ReferrerUser?.ReferralCode;
            
            return Ok(new {
                user.FullName,
                user.PhoneNumber,
                user.Email,
                user.KycLevel,
                user.IsActive,
                user.BiometricEnabled,
                user.ReferralCode,
                ReferredByCode = referredByCode,
                DateOfBirth = user.DateOfBirth?.ToString("yyyy-MM-dd"),
                WeddingAnniversaryDate = user.WeddingAnniversaryDate?.ToString("yyyy-MM-dd"),
                user.NomineeName,
                user.NomineePhoneNumber,
                user.NomineeRelationship,
                user.PreferredLanguage,
                user.ProfilePictureBase64,
                user.Gender
            });
        }

        [HttpPut("profile/{userId}")]
        public async Task<IActionResult> UpdateProfile(Guid userId, [FromBody] UpdateProfileRequest updateObj)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) 
            {
                user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
                if (user == null) return NotFound(new { Message = $"User with ID {userId} not found in database." });
            }

            if (string.IsNullOrEmpty(user.ReferralCode))
            {
                var random = new Random();
                string code;
                bool isUnique = false;
                do
                {
                    code = "AISH" + random.Next(100000, 999999).ToString();
                    isUnique = !await _context.Users.AnyAsync(u => u.ReferralCode == code);
                } while (!isUnique);
                
                user.ReferralCode = code;
            }

            if (!string.IsNullOrEmpty(updateObj.FullName)) user.FullName = updateObj.FullName;
            
            // Check if we need to send the Welcome email (only when email goes from empty/null to a non-empty value)
            bool shouldSendWelcomeEmail = string.IsNullOrEmpty(user.Email) && !string.IsNullOrEmpty(updateObj.Email);

            if (!string.IsNullOrEmpty(updateObj.Email))
            {
                // Validate that email is not already taken by another account
                var existingUserWithEmail = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == updateObj.Email && u.Id != user.Id);
                if (existingUserWithEmail != null)
                {
                    return BadRequest(new { Message = "This email address is already registered to another account. Please use a different one.", Success = false });
                }
                user.Email = updateObj.Email;
            }

            if (!string.IsNullOrEmpty(updateObj.NomineeName)) user.NomineeName = updateObj.NomineeName;
            if (updateObj.NomineePhoneNumber != null) user.NomineePhoneNumber = updateObj.NomineePhoneNumber;
            if (updateObj.NomineeRelationship != null) user.NomineeRelationship = updateObj.NomineeRelationship;
            if (!string.IsNullOrEmpty(updateObj.PreferredLanguage)) user.PreferredLanguage = updateObj.PreferredLanguage;
            if (updateObj.DateOfBirth.HasValue) user.DateOfBirth = updateObj.DateOfBirth.Value;
            if (updateObj.WeddingAnniversaryDate.HasValue) user.WeddingAnniversaryDate = updateObj.WeddingAnniversaryDate.Value;
            if (updateObj.BiometricEnabled.HasValue) user.BiometricEnabled = updateObj.BiometricEnabled.Value;
            if (updateObj.ProfilePictureBase64 != null) user.ProfilePictureBase64 = updateObj.ProfilePictureBase64;
            if (updateObj.Gender != null) user.Gender = updateObj.Gender;

            // Handle Referral Registration
            if (!string.IsNullOrEmpty(updateObj.ReferredByCode))
            {
                // 1. Verify referrer exists
                var referrer = await _context.Users.FirstOrDefaultAsync(u => u.ReferralCode == updateObj.ReferredByCode);
                if (referrer == null)
                {
                    return BadRequest(new { Message = "Invalid referral code. Please check the code and try again.", Success = false });
                }

                // 2. Prevent self-referral
                if (referrer.Id == user.Id || string.Equals(updateObj.ReferredByCode, user.ReferralCode, StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new { Message = "You cannot use your own referral code.", Success = false });
                }

                // 3. Ensure no duplicate referral record (i.e. referee hasn't been referred yet)
                var alreadyReferred = await _context.ReferralEvents.AnyAsync(r => r.RefereeUserId == user.Id);
                if (alreadyReferred)
                {
                    return BadRequest(new { Message = "You have already applied a referral code.", Success = false });
                }

                // 4. Fetch reward configs
                var config = await _context.AppConfigs.FirstOrDefaultAsync();
                if (config == null)
                {
                    config = new AppConfig();
                    _context.AppConfigs.Add(config);
                    await _context.SaveChangesAsync();
                }

                // 5. Create referral event as "Pending" (to be credited on referee's first gold purchase)
                var referralEvent = new ReferralEvent
                {
                    Id = Guid.NewGuid(),
                    ReferrerUserId = referrer.Id,
                    RefereeUserId = user.Id,
                    RewardStatus = "Pending",
                    BonusAwardedMg = config.ReferrerRewardMg,
                    CreatedAt = DateTime.UtcNow
                };
                _context.ReferralEvents.Add(referralEvent);
            }

            user.UpdatedAt = DateTimeOffset.UtcNow;
            await _context.SaveChangesAsync();

            if (shouldSendWelcomeEmail && !string.IsNullOrEmpty(user.Email))
            {
                try
                {
                    await _emailService.SendTemplatedAsync(
                        user.Email,
                        user.FullName ?? "Valued Customer",
                        EmailTemplate.Welcome,
                        new { UserName = user.FullName ?? "Valued Customer" }
                    );
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[ERROR] Failed to send welcome email to {user.Email}: {ex.Message}");
                }
            }

            return Ok(new { Message = "Profile updated successfully.", Success = true });
        }

        [HttpGet("config")]
        public IActionResult GetConfig()
        {
            var config = _context.AppConfigs.FirstOrDefault();
            if (config == null)
            {
                config = new AppConfig();
                _context.AppConfigs.Add(config);
                _context.SaveChanges();
            }
            return Ok(config);
        }

        [HttpPost("config")]
        public IActionResult UpdateConfig([FromBody] UpdateConfigRequest request)
        {
            var config = _context.AppConfigs.FirstOrDefault();
            if (config == null)
            {
                config = new AppConfig();
                _context.AppConfigs.Add(config);
            }
            config.ReferrerRewardMg = request.ReferrerRewardMg;
            config.RefereeRewardMg = request.RefereeRewardMg;
            if (request.TermsAndConditionsUrl != null)
            {
                config.TermsAndConditionsUrl = request.TermsAndConditionsUrl;
            }
            if (request.PrivacyPolicyUrl != null)
            {
                config.PrivacyPolicyUrl = request.PrivacyPolicyUrl;
            }
            config.UpdatedAt = DateTimeOffset.UtcNow;
            _context.SaveChanges();
            return Ok(config);
        }

        [HttpGet("migrate-temp")]
        public async Task<IActionResult> MigrateTemp()
        {
            try {
                await Microsoft.EntityFrameworkCore.RelationalDatabaseFacadeExtensions.ExecuteSqlRawAsync(
                    _context.Database,
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS mpin_hash character varying(255); " +
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS biometric_enabled boolean DEFAULT false; " +
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code character varying(50); " +
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth date; " +
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS wedding_anniversary_date date; " +
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS nominee_name character varying(100); " +
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language character varying(10) DEFAULT 'en'; " +
                    "ALTER TABLE gold_holdings ADD COLUMN IF NOT EXISTS bonus_gold_balance_mg bigint DEFAULT 0 NOT NULL; " +
                    "ALTER TABLE promotional_offers ADD COLUMN IF NOT EXISTS offer_type varchar(30) DEFAULT 'FLASH_SALE' NOT NULL; " +
                    "ALTER TABLE promotional_offers ADD COLUMN IF NOT EXISTS bonus_percent decimal(5,2) DEFAULT 0 NOT NULL; " +
                    "ALTER TABLE promotional_offers ADD COLUMN IF NOT EXISTS min_purchase_amount_paise bigint DEFAULT 0 NOT NULL; " +
                    "ALTER TABLE promotional_offers ADD COLUMN IF NOT EXISTS duration_hours int DEFAULT 24 NOT NULL;"
                );
                return Ok("Migrated successfully");
            } catch (Exception e) {
                return BadRequest(e.Message);
            }
        }

        [HttpDelete("{userId}")]
        public async Task<IActionResult> DeleteAccount(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound(new { Message = "User not found." });

            // Remove associated schemes and related investments/redemptions
            var schemes = await _context.UserSchemes.Where(s => s.UserId == userId).ToListAsync();
            foreach (var scheme in schemes)
            {
                var investments = await _context.SchemeInvestments.Where(i => i.UserSchemeId == scheme.Id).ToListAsync();
                _context.SchemeInvestments.RemoveRange(investments);

                var redemptions = await _context.SchemeRedemptions.Where(r => r.UserSchemeId == scheme.Id).ToListAsync();
                _context.SchemeRedemptions.RemoveRange(redemptions);
            }
            _context.UserSchemes.RemoveRange(schemes);

            // Remove wallets and ledger
            var wallet = await _context.Wallets.FindAsync(userId);
            if (wallet != null) _context.Wallets.Remove(wallet);

            var ledgerEntries = await _context.WalletLedgers.Where(l => l.UserId == userId).ToListAsync();
            _context.WalletLedgers.RemoveRange(ledgerEntries);

            // Remove gold holdings and transactions
            var goldHolding = await _context.GoldHoldings.FindAsync(userId);
            if (goldHolding != null) _context.GoldHoldings.Remove(goldHolding);

            var transactions = await _context.GoldTransactions.Where(t => t.UserId == userId).ToListAsync();
            _context.GoldTransactions.RemoveRange(transactions);

            // Remove user devices
            var devices = await _context.UserDevices.Where(d => d.UserId == userId).ToListAsync();
            _context.UserDevices.RemoveRange(devices);

            // Remove KYC documents
            var kycDocs = await _context.KycDocuments.Where(d => d.UserId == userId).ToListAsync();
            _context.KycDocuments.RemoveRange(kycDocs);

            // Finally delete the user
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Account deleted successfully.", Success = true });
        }
    }


    public class UpdateProfileRequest
    {
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? NomineeName { get; set; }
        public string? NomineePhoneNumber { get; set; }
        public string? NomineeRelationship { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public DateTime? WeddingAnniversaryDate { get; set; }
        public bool? BiometricEnabled { get; set; }
        public string? PreferredLanguage { get; set; }
        public string? ReferredByCode { get; set; }
        public string? ProfilePictureBase64 { get; set; }
        public string? Gender { get; set; }
    }

    public class UpdateConfigRequest
    {
        public long ReferrerRewardMg { get; set; }
        public long RefereeRewardMg { get; set; }
        public string? TermsAndConditionsUrl { get; set; }
        public string? PrivacyPolicyUrl { get; set; }
    }
}
