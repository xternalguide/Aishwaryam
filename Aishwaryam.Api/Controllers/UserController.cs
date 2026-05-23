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

        public UserController(
            Aishwaryam.Infrastructure.Data.ApplicationDbContext context,
            IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
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
                    u.CreatedAt
                })
                .ToListAsync();
            return Ok(users);
        }

        [HttpGet("profile/{userId}")]
        public async Task<IActionResult> GetProfile(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();
            
            return Ok(new {
                user.FullName,
                user.PhoneNumber,
                user.Email,
                user.KycLevel,
                user.IsActive,
                user.BiometricEnabled,
                user.ReferralCode,
                DateOfBirth = user.DateOfBirth?.ToString("yyyy-MM-dd"),
                user.NomineeName,
                user.PreferredLanguage
            });
        }

        [HttpPut("profile/{userId}")]
        public async Task<IActionResult> UpdateProfile(Guid userId, [FromBody] UpdateProfileRequest updateObj)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) 
            {
                // If Guid lookup fails, try finding by string ID just in case
                user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
                if (user == null) return NotFound(new { Message = $"User with ID {userId} not found in database." });
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
            if (!string.IsNullOrEmpty(updateObj.PreferredLanguage)) user.PreferredLanguage = updateObj.PreferredLanguage;
            if (updateObj.DateOfBirth.HasValue) user.DateOfBirth = updateObj.DateOfBirth.Value;
            if (updateObj.BiometricEnabled.HasValue) user.BiometricEnabled = updateObj.BiometricEnabled.Value;

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

        [HttpGet("migrate-temp")]
        public async Task<IActionResult> MigrateTemp()
        {
            try {
                await Microsoft.EntityFrameworkCore.RelationalDatabaseFacadeExtensions.ExecuteSqlRawAsync(
                    _context.Database,
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS mpin_hash character varying(255); ALTER TABLE users ADD COLUMN IF NOT EXISTS biometric_enabled boolean DEFAULT false; ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code character varying(50); ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth date; ALTER TABLE users ADD COLUMN IF NOT EXISTS nominee_name character varying(100); ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language character varying(10) DEFAULT 'en';"
                );
                return Ok("Migrated");
            } catch (Exception e) {
                return BadRequest(e.Message);
            }
        }
    }

    public class UpdateProfileRequest
    {
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? NomineeName { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public bool? BiometricEnabled { get; set; }
        public string? PreferredLanguage { get; set; }
    }
}
