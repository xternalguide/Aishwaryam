using Microsoft.AspNetCore.Mvc;
using Aishwaryam.Application.Interfaces.Services;
using System;
using System.Threading.Tasks;

namespace Aishwaryam.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpPost("register-token")]
        public async Task<IActionResult> RegisterToken([FromBody] RegisterTokenRequest request)
        {
            Guid? mappedUserId = request.UserId == Guid.Empty ? null : request.UserId;
            await _notificationService.RegisterDeviceTokenAsync(mappedUserId, request.Token, request.DeviceType);
            return Ok(new { Message = "Device token registered successfully." });
        }

        [HttpPost("unregister-token")]
        public async Task<IActionResult> UnregisterToken([FromBody] UnregisterTokenRequest request)
        {
            await _notificationService.UnregisterDeviceTokenAsync(request.Token);
            return Ok(new { Message = "Device token unregistered successfully." });
        }

        [HttpGet]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> GetUserNotifications()
        {
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            var notifications = await _notificationService.GetUserNotificationsAsync(userId);
            return Ok(notifications);
        }

        [HttpGet("unread-count")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> GetUnreadCount()
        {
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            var count = await _notificationService.GetUnreadCountAsync(userId);
            return Ok(new { Count = count });
        }

        [HttpPut("{id}/read")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> MarkAsRead(Guid id)
        {
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            await _notificationService.MarkAsReadAsync(id, userId);
            return Ok(new { Message = "Notification marked as read" });
        }

        [HttpPut("read-all")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            await _notificationService.MarkAllAsReadAsync(userId);
            return Ok(new { Message = "All notifications marked as read" });
        }

        [HttpDelete("{id}")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> DeleteNotification(Guid id)
        {
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            await _notificationService.DeleteNotificationAsync(id, userId);
            return Ok(new { Message = "Notification deleted" });
        }

        [HttpDelete("clear-all")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> ClearAllNotifications()
        {
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            await _notificationService.DeleteAllNotificationsAsync(userId);
            return Ok(new { Message = "All notifications cleared" });
        }

        [HttpPost("broadcast")]
        public async Task<IActionResult> BroadcastNotification([FromBody] BroadcastNotificationRequest request)
        {
            try
            {
                await _notificationService.BroadcastNotificationAsync(request.Title, request.Message, request.Type, request.PushData, request.ImageUrl);
                return Ok(new { success = true, message = "Broadcast notification dispatched successfully to all installed devices!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error dispatching broadcast notification", error = ex.Message });
            }
        }
    }

    public class RegisterTokenRequest
    {
        public Guid? UserId { get; set; }
        public string Token { get; set; } = string.Empty;
        public string DeviceType { get; set; } = "ANDROID";
    }

    public class UnregisterTokenRequest
    {
        public string Token { get; set; } = string.Empty;
    }

    public class BroadcastNotificationRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = "GENERAL";
        public System.Collections.Generic.Dictionary<string, string>? PushData { get; set; }
        public string? ImageUrl { get; set; }
    }
}
