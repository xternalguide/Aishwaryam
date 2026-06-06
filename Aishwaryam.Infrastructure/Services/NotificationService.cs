using System;
using System.Threading.Tasks;
using Aishwaryam.Application.Interfaces.Services;
using Aishwaryam.Domain.Entities;
using Aishwaryam.Infrastructure.Data;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;

namespace Aishwaryam.Infrastructure.Services
{
    public class NotificationService : INotificationService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(ApplicationDbContext context, ILogger<NotificationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task SendNotificationAsync(Guid userId, string title, string message, string type = "GENERAL")
        {
            await SendNotificationWithDataAsync(userId, title, message, type, new Dictionary<string, string>());
        }

        public async Task SendNotificationWithDataAsync(Guid userId, string title, string message, string type, Dictionary<string, string> pushData)
        {
            try
            {
                // 1. Persist in History (In-App)
                string? entityId = null;
                if (pushData != null && pushData.TryGetValue("entityId", out var extEntityId))
                {
                    entityId = extEntityId;
                }

                var notification = new UserNotification
                {
                    UserId = userId,
                    Title = title,
                    Message = message,
                    Type = type,
                    EntityId = entityId,
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                };

                _context.UserNotifications.Add(notification);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"[NOTIFICATION] Persisted for {userId}: {title}");

                // 2. Fetch Active FCM Tokens for User
                var devices = await _context.UserDevices
                    .Where(d => d.UserId == userId && d.IsActive)
                    .ToListAsync();

                if (devices.Any())
                {
                    // Ensure the 'type' is set in pushData, this is a fallback
                    if (!pushData.ContainsKey("type"))
                    {
                        pushData["type"] = type;
                    }
                    if (!pushData.ContainsKey("click_action"))
                    {
                        pushData["click_action"] = "FLUTTER_NOTIFICATION_CLICK";
                    }

                    foreach (var device in devices)
                    {
                        await SendPushToDeviceAsync(device, title, message, pushData);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to send notification to {userId}");
            }
        }

        private async Task SendPushToDeviceAsync(UserDevice device, string title, string message, Dictionary<string, string> data, string? imageUrl = null)
        {
            try
            {
                if (FirebaseAdmin.FirebaseApp.DefaultInstance == null) return;

                // Sanitize ImageUrl to make sure relative paths are resolved and invalid URIs don't crash the Firebase Admin SDK.
                string? fcmImageUrl = null;
                if (!string.IsNullOrWhiteSpace(imageUrl))
                {
                    if (imageUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase) || 
                        imageUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                    {
                        fcmImageUrl = imageUrl;
                    }
                    else
                    {
                        // Prefix relative image path with the backend's base URL
                        string baseUrl = "https://aishwaryam.blazewing.in";
                        fcmImageUrl = $"{baseUrl.TrimEnd('/')}/{imageUrl.TrimStart('/')}";
                    }

                    // Validate that the constructed URL is a well-formed absolute URI. If not, fallback to null rather than crash.
                    if (!Uri.TryCreate(fcmImageUrl, UriKind.Absolute, out _))
                    {
                        fcmImageUrl = null;
                    }
                }

                var fcmMessage = new FirebaseAdmin.Messaging.Message()
                {
                    Token = device.FcmToken,
                    Notification = new FirebaseAdmin.Messaging.Notification()
                    {
                        Title = title,
                        Body = message,
                        ImageUrl = fcmImageUrl
                    },
                    Data = data,
                    Android = new FirebaseAdmin.Messaging.AndroidConfig()
                    {
                        Priority = FirebaseAdmin.Messaging.Priority.High,
                        Notification = new FirebaseAdmin.Messaging.AndroidNotification()
                        {
                            ChannelId = "aishwaryam_push_notifs",
                            Icon = "ic_launcher",
                            Sound = "default",
                            DefaultSound = true,
                            DefaultVibrateTimings = true,
                            ClickAction = "FLUTTER_NOTIFICATION_CLICK"
                        }
                    }
                };

                string response = await FirebaseAdmin.Messaging.FirebaseMessaging.DefaultInstance.SendAsync(fcmMessage);
                _logger.LogInformation($"[FCM] Sent to {device.UserId} (Device: {device.Id}): {response}");
            }
            catch (FirebaseAdmin.Messaging.FirebaseMessagingException ex)
            {
                if (ex.MessagingErrorCode == FirebaseAdmin.Messaging.MessagingErrorCode.Unregistered ||
                    ex.MessagingErrorCode == FirebaseAdmin.Messaging.MessagingErrorCode.InvalidArgument)
                {
                    _logger.LogWarning($"[FCM] Token invalid for {device.UserId}. Deactivating device {device.Id}.");
                    device.IsActive = false;
                    _context.UserDevices.Update(device);
                    await _context.SaveChangesAsync();
                }
                else
                {
                    _logger.LogError(ex, $"[FCM] Error sending to {device.UserId}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[FCM] Critical error sending to {device.UserId}");
            }
        }

        public async Task RegisterDeviceTokenAsync(Guid? userId, string token, string deviceType = "ANDROID")
        {
            var existing = await _context.UserDevices.FirstOrDefaultAsync(d => d.FcmToken == token);
            if (existing != null)
            {
                existing.UserId = userId;
                existing.IsActive = true;
                existing.LastUsedAt = DateTime.UtcNow;
                _context.UserDevices.Update(existing);
            }
            else
            {
                var newDevice = new UserDevice
                {
                    UserId = userId,
                    FcmToken = token,
                    DeviceType = deviceType,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    LastUsedAt = DateTime.UtcNow
                };
                _context.UserDevices.Add(newDevice);
            }

            await _context.SaveChangesAsync();
        }

        public async Task UnregisterDeviceTokenAsync(string token)
        {
            var device = await _context.UserDevices.FirstOrDefaultAsync(d => d.FcmToken == token);
            if (device != null)
            {
                device.IsActive = false;
                _context.UserDevices.Update(device);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<List<UserNotification>> GetUserNotificationsAsync(Guid userId)
        {
            return await _context.UserNotifications
                .Where(n => n.UserId == userId && !n.IsDeleted)
                .OrderByDescending(n => n.CreatedAt)
                .Take(50) // Limit to latest 50 for performance
                .ToListAsync();
        }

        public async Task MarkAsReadAsync(Guid notificationId, Guid userId)
        {
            var notification = await _context.UserNotifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);
            
            if (notification != null && !notification.IsRead)
            {
                notification.IsRead = true;
                _context.UserNotifications.Update(notification);
                await _context.SaveChangesAsync();
            }
        }

        public async Task DeleteNotificationAsync(Guid notificationId, Guid userId)
        {
            var notification = await _context.UserNotifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);
            
            if (notification != null && !notification.IsDeleted)
            {
                notification.IsDeleted = true;
                _context.UserNotifications.Update(notification);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<int> GetUnreadCountAsync(Guid userId)
        {
            return await _context.UserNotifications
                .CountAsync(n => n.UserId == userId && !n.IsRead && !n.IsDeleted);
        }

        public async Task BroadcastNotificationAsync(string title, string message, string type = "GENERAL", System.Collections.Generic.Dictionary<string, string>? pushData = null, string? imageUrl = null)
        {
            try
            {
                pushData ??= new System.Collections.Generic.Dictionary<string, string>();
                if (!pushData.ContainsKey("type")) pushData["type"] = type;
                if (!pushData.ContainsKey("click_action")) pushData["click_action"] = "FLUTTER_NOTIFICATION_CLICK";

                // 1. Get all active users
                var users = await _context.Users.Where(u => u.IsActive).ToListAsync();
                
                // 2. Persist in history in bulk for all active users
                var notifications = users.Select(u => new UserNotification
                {
                    UserId = u.Id,
                    Title = title,
                    Message = message,
                    Type = type,
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                }).ToList();

                _context.UserNotifications.AddRange(notifications);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"[NOTIFICATION] Broadcasted in-app history for {users.Count} users: {title}");

                // 3. Get all active devices
                var devices = await _context.UserDevices.Where(d => d.IsActive).ToListAsync();
                if (devices.Any())
                {
                    foreach (var device in devices)
                    {
                        await SendPushToDeviceAsync(device, title, message, pushData, imageUrl);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to broadcast notification");
            }
        }
    }
}
