using System;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Aishwaryam.Infrastructure.Data;
using Aishwaryam.Domain.Entities;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;

namespace Aishwaryam.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SuperAdminController : ControllerBase
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly string _apiKey;

        public SuperAdminController(ApplicationDbContext dbContext, IConfiguration configuration)
        {
            _dbContext = dbContext;
            _apiKey = configuration["SuperAdmin:ApiKey"] ?? "AishwaryamSuperAdminSecretKey2026!";
        }

        private bool IsAuthorized()
        {
            if (!Request.Headers.TryGetValue("X-Super-Admin-Key", out var headerKey))
            {
                return false;
            }
            return headerKey.ToString() == _apiKey;
        }

        [HttpGet("tokens")]
        public async Task<IActionResult> GetTokens()
        {
            if (!IsAuthorized()) return Unauthorized(new { Message = "Unauthorized access." });

            var tokens = await _dbContext.TokenTrackers
                .OrderByDescending(t => t.CreatedAt)
                .Take(100)
                .ToListAsync();

            return Ok(tokens);
        }

        [HttpPost("tokens/revoke")]
        public async Task<IActionResult> RevokeToken([FromBody] RevokeTokenRequest request)
        {
            if (!IsAuthorized()) return Unauthorized(new { Message = "Unauthorized access." });

            var tracker = await _dbContext.TokenTrackers.FindAsync(request.Id);
            if (tracker == null) return NotFound(new { Message = "Token not found." });

            tracker.IsRevoked = true;
            await _dbContext.SaveChangesAsync();

            return Ok(new { Success = true, Message = "Token revoked successfully." });
        }

        [HttpGet("errors")]
        public async Task<IActionResult> GetErrors()
        {
            if (!IsAuthorized()) return Unauthorized(new { Message = "Unauthorized access." });

            var errors = await _dbContext.ApiErrorLogs
                .OrderByDescending(e => e.CreatedAt)
                .Take(100)
                .ToListAsync();

            return Ok(errors);
        }

        [HttpGet("admin-logs")]
        public async Task<IActionResult> GetAdminLogs()
        {
            if (!IsAuthorized()) return Unauthorized(new { Message = "Unauthorized access." });

            var logs = await _dbContext.AdminAuditLogs
                .OrderByDescending(l => l.CreatedAt)
                .Take(100)
                .ToListAsync();

            return Ok(logs);
        }

        [HttpGet("settings/emails")]
        public async Task<IActionResult> GetEmails()
        {
            if (!IsAuthorized()) return Unauthorized(new { Message = "Unauthorized access." });

            var setting = await _dbContext.SuperAdminSettings.FindAsync("alert_emails");
            var emails = new List<string> { "support@aishwaryamgold.com" };

            if (setting != null)
            {
                try
                {
                    var parsed = JsonSerializer.Deserialize<List<string>>(setting.Value);
                    if (parsed != null) emails = parsed;
                }
                catch
                {
                    var split = setting.Value.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries);
                    if (split.Length > 0) emails = split.Select(e => e.Trim()).ToList();
                }
            }

            return Ok(emails);
        }

        [HttpPost("settings/emails")]
        public async Task<IActionResult> UpdateEmails([FromBody] List<string> emails)
        {
            if (!IsAuthorized()) return Unauthorized(new { Message = "Unauthorized access." });

            var setting = await _dbContext.SuperAdminSettings.FindAsync("alert_emails");
            var jsonValue = JsonSerializer.Serialize(emails);

            if (setting == null)
            {
                setting = new SuperAdminSetting
                {
                    Key = "alert_emails",
                    Value = jsonValue,
                    UpdatedAt = DateTimeOffset.UtcNow
                };
                _dbContext.SuperAdminSettings.Add(setting);
            }
            else
            {
                setting.Value = jsonValue;
                setting.UpdatedAt = DateTimeOffset.UtcNow;
            }

            await _dbContext.SaveChangesAsync();
            return Ok(new { Success = true, Message = "Email list updated successfully." });
        }
    }

    public class RevokeTokenRequest
    {
        public Guid Id { get; set; }
    }
}
