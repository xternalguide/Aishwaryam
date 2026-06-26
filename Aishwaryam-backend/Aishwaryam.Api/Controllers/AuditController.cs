using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Aishwaryam.Infrastructure.Data;
using Aishwaryam.Domain.Entities;

namespace Aishwaryam.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuditController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AuditController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("logs")]
        public async Task<IActionResult> GetLogs([FromQuery] string? userId, [FromQuery] string? action, [FromQuery] int limit = 100)
        {
            var query = _context.PlatformAuditLogs.AsQueryable();

            if (!string.IsNullOrEmpty(userId) && Guid.TryParse(userId, out var uid))
                query = query.Where(l => l.UserId == uid);

            if (!string.IsNullOrEmpty(action))
                query = query.Where(l => l.Action == action);

            var logs = await query
                .OrderByDescending(l => l.CreatedAt)
                .Take(limit)
                .ToListAsync();

            return Ok(logs);
        }

        [HttpPost("report")]
        public async Task<IActionResult> ReportError([FromBody] PlatformAuditLog log)
        {
            log.Id = Guid.NewGuid();
            log.CreatedAt = DateTime.UtcNow;
            log.IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            
            _context.PlatformAuditLogs.Add(log);
            await _context.SaveChangesAsync();
            
            return Ok(new { Message = "Error reported." });
        }

        [HttpGet("errors")]
        public async Task<IActionResult> GetErrors([FromQuery] int limit = 50)
        {
            var errors = await _context.PlatformAuditLogs
                .Where(l => l.Status != "SUCCESS")
                .OrderByDescending(l => l.CreatedAt)
                .Take(limit)
                .ToListAsync();

            return Ok(errors);
        }
    }
}
