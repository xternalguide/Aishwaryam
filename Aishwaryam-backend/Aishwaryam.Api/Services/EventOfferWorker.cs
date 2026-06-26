using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Aishwaryam.Infrastructure.Data;
using Aishwaryam.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Aishwaryam.Application.Interfaces.Services;

namespace Aishwaryam.Api.Services
{
    /// <summary>
    /// Runs daily at 9 AM IST (3:30 AM UTC).
    /// Finds all users with birthday or anniversary today → creates targeted offers → sends push notifications.
    /// </summary>
    public class EventOfferWorker : BackgroundService
    {
        private readonly ILogger<EventOfferWorker> _logger;
        private readonly IServiceScopeFactory _scopeFactory;

        public EventOfferWorker(ILogger<EventOfferWorker> logger, IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("EventOfferWorker started. Will fire daily at 9 AM IST.");
            await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken); // Startup delay

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var istNow = DateTime.UtcNow.AddHours(5).AddMinutes(30);
                    // Run at 9:00 AM IST — wait until next 9 AM
                    var nextRun = new DateTime(istNow.Year, istNow.Month, istNow.Day, 9, 0, 0);
                    if (istNow >= nextRun)
                        nextRun = nextRun.AddDays(1);

                    var delay = nextRun - istNow;
                    _logger.LogInformation("EventOfferWorker: next run at {NextRun} IST (in {Delay})", nextRun, delay);
                    await Task.Delay(delay, stoppingToken);

                    await FireTodayEventOffersAsync();
                }
                catch (TaskCanceledException) { break; }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "EventOfferWorker error. Will retry in 1 hour.");
                    await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
                }
            }
        }

        private async Task FireTodayEventOffersAsync()
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

            var istNow = DateTime.UtcNow.AddHours(5).AddMinutes(30);
            var todayMonth = istNow.Month;
            var todayDay = istNow.Day;

            // Process BIRTHDAY offers
            await FireEventTypeAsync(context, notificationService, "BIRTHDAY", todayMonth, todayDay);

            // Process ANNIVERSARY offers
            await FireEventTypeAsync(context, notificationService, "ANNIVERSARY", todayMonth, todayDay);

            await context.SaveChangesAsync();
            _logger.LogInformation("EventOfferWorker: completed firing event offers for {Month}/{Day}", todayMonth, todayDay);
        }

        private async Task FireEventTypeAsync(
            ApplicationDbContext context,
            INotificationService notificationService,
            string offerType,
            int todayMonth,
            int todayDay)
        {
            // Get the latest active template for this event type
            var template = await context.PromotionalOffers
                .Where(o => o.OfferType == offerType && !o.IsActive && o.TargetUserId == null)
                .OrderByDescending(o => o.CreatedAt)
                .FirstOrDefaultAsync();

            if (template == null)
            {
                _logger.LogInformation("EventOfferWorker: No {OfferType} template configured. Skipping.", offerType);
                return;
            }

            List<User> targetUsers;
            if (offerType == "BIRTHDAY")
            {
                targetUsers = await context.Users
                    .Where(u => u.IsActive && u.DateOfBirth != null
                        && u.DateOfBirth.Value.Month == todayMonth
                        && u.DateOfBirth.Value.Day == todayDay)
                    .ToListAsync();
            }
            else
            {
                targetUsers = await context.Users
                    .Where(u => u.IsActive && u.WeddingAnniversaryDate != null
                        && u.WeddingAnniversaryDate.Value.Month == todayMonth
                        && u.WeddingAnniversaryDate.Value.Day == todayDay)
                    .ToListAsync();
            }

            var expiresAt = DateTime.UtcNow.AddHours(template.DurationHours);
            int fired = 0;

            foreach (var user in targetUsers)
            {
                // Skip if already has active offer of this type today
                var alreadyHasOffer = await context.PromotionalOffers
                    .AnyAsync(o => o.TargetUserId == user.Id && o.OfferType == offerType
                        && o.IsActive && o.ExpiresAt > DateTime.UtcNow);
                if (alreadyHasOffer) continue;

                var userOffer = new PromotionalOffer
                {
                    Id = Guid.NewGuid(),
                    Title = template.Title,
                    Description = template.Description,
                    OfferType = offerType,
                    TargetUserId = user.Id,
                    BonusPercent = template.BonusPercent,
                    MinPurchaseAmountPaise = template.MinPurchaseAmountPaise,
                    DurationHours = template.DurationHours,
                    ExpiresAt = expiresAt,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                context.PromotionalOffers.Add(userOffer);

                var eventLabel = offerType == "BIRTHDAY" ? "🎂 Happy Birthday" : "💍 Happy Anniversary";
                var minPurchaseText = template.MinPurchaseAmountPaise > 0
                    ? $" on purchases above ₹{template.MinPurchaseAmountPaise / 100}"
                    : "";
                var notifTitle = $"{eventLabel}, {user.FullName?.Split(' ')[0] ?? ""}! 🎉";
                var notifBody = $"Special offer just for you! Get {template.BonusPercent}% bonus gold{minPurchaseText}. Valid for {template.DurationHours} hour(s). Buy gold now!";

                try
                {
                    await notificationService.SendNotificationAsync(
                        user.Id,
                        notifTitle,
                        notifBody,
                        offerType == "BIRTHDAY" ? "BIRTHDAY_OFFER" : "ANNIVERSARY_OFFER");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "EventOfferWorker: Failed to send push to user {UserId}", user.Id);
                }

                fired++;
            }

            _logger.LogInformation("EventOfferWorker: Fired {Count} {OfferType} offers.", fired, offerType);
        }
    }
}
