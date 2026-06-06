using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Aishwaryam.Application.Interfaces.Services;
using Aishwaryam.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Aishwaryam.Infrastructure.Services
{
    public class FirebaseSmsService : ISmsService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<FirebaseSmsService> _logger;

        public FirebaseSmsService(ApplicationDbContext context, ILogger<FirebaseSmsService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<(bool Success, string ErrorMessage)> SendSmsAsync(string phoneNumber, string message)
        {
            try
            {
                var phone = phoneNumber;
                if (phone.StartsWith("+"))
                {
                    phone = phone.Replace("+91", "").Trim();
                }
                var cleanPhone = phone.Replace("+", "").Trim();

                _logger.LogInformation($"[FIREBASE-SMS] Attempting to send OTP via FCM to phone: {cleanPhone}");

                // Find user by phone number
                var user = await _context.Users.FirstOrDefaultAsync(u => u.PhoneNumber == cleanPhone);
                if (user == null)
                {
                    _logger.LogWarning($"[FIREBASE-SMS] No user found with phone: {cleanPhone}. Cannot send FCM. Falling back to simulated success.");
                    return (true, "No user found, simulated success");
                }

                // Fetch active devices
                var devices = await _context.UserDevices
                    .Where(d => d.UserId == user.Id && d.IsActive)
                    .ToListAsync();

                if (!devices.Any())
                {
                    _logger.LogWarning($"[FIREBASE-SMS] No active devices found for user: {user.Id}. Cannot send FCM. Falling back to simulated success.");
                    return (true, "No devices found, simulated success");
                }

                if (FirebaseAdmin.FirebaseApp.DefaultInstance == null)
                {
                    _logger.LogError("[FIREBASE-SMS] Firebase Admin SDK is not initialized on the server.");
                    return (false, "Firebase Admin SDK not initialized");
                }

                foreach (var device in devices)
                {
                    try
                    {
                        var fcmMessage = new FirebaseAdmin.Messaging.Message()
                        {
                            Token = device.FcmToken,
                            Notification = new FirebaseAdmin.Messaging.Notification()
                            {
                                Title = "Aishwaryam OTP ✦",
                                Body = message
                            },
                            Data = new Dictionary<string, string>
                            {
                                { "type", "AUTH" },
                                { "click_action", "FLUTTER_NOTIFICATION_CLICK" }
                            },
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
                        _logger.LogInformation($"[FIREBASE-SMS] FCM sent successfully to device {device.Id} for user {user.Id}: {response}");
                    }
                    catch (FirebaseAdmin.Messaging.FirebaseMessagingException ex)
                    {
                        if (ex.MessagingErrorCode == FirebaseAdmin.Messaging.MessagingErrorCode.Unregistered ||
                            ex.MessagingErrorCode == FirebaseAdmin.Messaging.MessagingErrorCode.InvalidArgument)
                        {
                            _logger.LogWarning($"[FIREBASE-SMS] Token invalid for device {device.Id}. Deactivating.");
                            device.IsActive = false;
                            _context.UserDevices.Update(device);
                        }
                        else
                        {
                            _logger.LogError(ex, $"[FIREBASE-SMS] FCM sending failed for device {device.Id}");
                        }
                    }
                }

                await _context.SaveChangesAsync();
                return (true, "");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[FIREBASE-SMS] Exception in SendSmsAsync for {phoneNumber}");
                return (false, ex.Message);
            }
        }
    }
}
