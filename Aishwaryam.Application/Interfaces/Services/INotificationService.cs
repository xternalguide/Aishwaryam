using System;
using System.Threading.Tasks;

namespace Aishwaryam.Application.Interfaces.Services
{
    public interface INotificationService
    {
        Task SendNotificationAsync(Guid userId, string title, string message, string type = "GENERAL");
        Task SendNotificationWithDataAsync(Guid userId, string title, string message, string type, System.Collections.Generic.Dictionary<string, string> pushData);
        Task RegisterDeviceTokenAsync(Guid? userId, string token, string deviceType = "ANDROID");
        Task UnregisterDeviceTokenAsync(string token);
        Task<System.Collections.Generic.List<Aishwaryam.Domain.Entities.UserNotification>> GetUserNotificationsAsync(Guid userId);
        Task MarkAsReadAsync(Guid notificationId, Guid userId);
        Task DeleteNotificationAsync(Guid notificationId, Guid userId);
        Task<int> GetUnreadCountAsync(Guid userId);
        Task BroadcastNotificationAsync(string title, string message, string type = "GENERAL", System.Collections.Generic.Dictionary<string, string>? pushData = null, string? imageUrl = null);
    }
}
