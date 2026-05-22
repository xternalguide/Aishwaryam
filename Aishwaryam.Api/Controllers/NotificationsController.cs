using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using Aishwaryam.Infrastructure.Data;
using Aishwaryam.Domain.Entities;

namespace Aishwaryam.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public NotificationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost("send")]
        public async Task<IActionResult> SendNotification([FromBody] UserNotification request)
        {
            if (request.UserId == Guid.Empty) return BadRequest("Invalid UserId");
            
            request.Id = Guid.NewGuid();
            request.CreatedAt = DateTime.UtcNow;
            
            _context.UserNotifications.Add(request);
            await _context.SaveChangesAsync();
            return Ok(request);
        }

        [HttpGet("unread/{userId}")]
        public async Task<IActionResult> GetUnreadNotifications(Guid userId)
        {
            var notifications = await _context.UserNotifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();
            return Ok(notifications);
        }

        [HttpPost("mark-read/{notificationId}")]
        public async Task<IActionResult> MarkAsRead(Guid notificationId)
        {
            var notif = await _context.UserNotifications.FindAsync(notificationId);
            if (notif == null) return NotFound();
            
            notif.IsRead = true;
            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}
