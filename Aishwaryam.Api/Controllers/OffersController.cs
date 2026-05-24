using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Aishwaryam.Infrastructure.Data;
using Aishwaryam.Domain.Entities;
using Aishwaryam.Application.Interfaces.Services;

namespace Aishwaryam.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OffersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IGoldPriceManager _priceManager;

        public OffersController(ApplicationDbContext context, INotificationService notificationService, IGoldPriceManager priceManager)
        {
            _context = context;
            _notificationService = notificationService;
            _priceManager = priceManager;
        }

        // ─── CREATE: Flash Sale (Flat bonus to all users) ───────────────────────
        [HttpPost("create")]
        public async Task<IActionResult> CreateOffer([FromBody] PromotionalOffer request)
        {
            if (string.IsNullOrEmpty(request.Title) || request.ExpiresAt <= DateTime.UtcNow)
                return BadRequest(new { message = "Invalid offer details" });

            request.Id = Guid.NewGuid();
            request.CreatedAt = DateTime.UtcNow;
            if (string.IsNullOrEmpty(request.OfferType)) request.OfferType = "FLASH_SALE";

            _context.PromotionalOffers.Add(request);
            _context.PlatformAuditLogs.Add(new PlatformAuditLog
            {
                Action = "CREATE_OFFER",
                Details = $"Admin created {request.OfferType} offer: {request.Title}. Expires: {request.ExpiresAt}",
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown",
                Status = "SUCCESS"
            });
            await _context.SaveChangesAsync();
            return Ok(request);
        }

        // ─── CREATE: Event Offer Template (Birthday/Anniversary with % bonus) ───
        [HttpPost("create-event-offer")]
        public async Task<IActionResult> CreateEventOffer([FromBody] CreateEventOfferRequest req)
        {
            if (string.IsNullOrEmpty(req.Title) || req.BonusPercent <= 0 || req.DurationHours <= 0)
                return BadRequest(new { message = "Invalid event offer: title, bonusPercent, and durationHours are required." });

            // Create an INACTIVE template — actual offers are fired per-user on the event day
            var offer = new PromotionalOffer
            {
                Id = Guid.NewGuid(),
                Title = req.Title,
                Description = req.Description ?? string.Empty,
                OfferType = req.OfferType, // "BIRTHDAY" or "ANNIVERSARY"
                TargetUserId = null, // Templates have no target — targeting happens at fire time
                BonusWorthPaise = 0,
                BonusPercent = req.BonusPercent,
                MinPurchaseAmountPaise = req.MinPurchaseAmountPaise,
                DurationHours = req.DurationHours,
                ExpiresAt = DateTime.UtcNow.AddYears(10), // Templates don't expire themselves
                IsActive = false, // Templates are inactive — individual offers get created per user
                CreatedAt = DateTime.UtcNow
            };
            _context.PromotionalOffers.Add(offer);
            _context.PlatformAuditLogs.Add(new PlatformAuditLog
            {
                Action = "CREATE_EVENT_OFFER_TEMPLATE",
                Details = $"Admin created {req.OfferType} offer template: {req.Title}. Bonus: {req.BonusPercent}%, Duration: {req.DurationHours}h",
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown",
                Status = "SUCCESS"
            });
            await _context.SaveChangesAsync();
            return Ok(new { success = true, templateId = offer.Id, message = $"{req.OfferType} offer template created. Use 'fire-event-offers' to send to today's users." });
        }

        // ─── FIRE: Send event offers to today's birthday/anniversary users ──────
        [HttpPost("fire-event-offers")]
        public async Task<IActionResult> FireEventOffers([FromBody] FireEventOffersRequest req)
        {
            if (string.IsNullOrEmpty(req.OfferType) || (req.OfferType != "BIRTHDAY" && req.OfferType != "ANNIVERSARY"))
                return BadRequest(new { message = "offerType must be 'BIRTHDAY' or 'ANNIVERSARY'" });

            // Get the latest active template of this type (or use the request directly)
            var template = req.TemplateId.HasValue
                ? await _context.PromotionalOffers.FindAsync(req.TemplateId.Value)
                : await _context.PromotionalOffers
                    .Where(o => o.OfferType == req.OfferType && !o.IsActive)
                    .OrderByDescending(o => o.CreatedAt)
                    .FirstOrDefaultAsync();

            if (template == null)
                return BadRequest(new { message = $"No {req.OfferType} offer template found. Create one first using create-event-offer." });

            // IST = UTC+5:30
            var istNow = DateTime.UtcNow.AddHours(5).AddMinutes(30);
            var todayMonth = istNow.Month;
            var todayDay = istNow.Day;

            List<User> targetUsers;
            if (req.OfferType == "BIRTHDAY")
            {
                targetUsers = await _context.Users
                    .Where(u => u.IsActive && u.DateOfBirth != null
                        && u.DateOfBirth.Value.Month == todayMonth
                        && u.DateOfBirth.Value.Day == todayDay)
                    .ToListAsync();
            }
            else // ANNIVERSARY
            {
                targetUsers = await _context.Users
                    .Where(u => u.IsActive && u.WeddingAnniversaryDate != null
                        && u.WeddingAnniversaryDate.Value.Month == todayMonth
                        && u.WeddingAnniversaryDate.Value.Day == todayDay)
                    .ToListAsync();
            }

            if (!targetUsers.Any())
                return Ok(new { success = true, fired = 0, message = $"No users have {req.OfferType.ToLower()} today." });

            var expiresAt = DateTime.UtcNow.AddHours(template.DurationHours);
            int fired = 0;

            foreach (var user in targetUsers)
            {
                // Check if user already has an active offer of this type today
                var alreadyHasOffer = await _context.PromotionalOffers
                    .AnyAsync(o => o.TargetUserId == user.Id && o.OfferType == req.OfferType
                        && o.IsActive && o.ExpiresAt > DateTime.UtcNow);
                if (alreadyHasOffer) continue;

                // Create individual targeted offer for this user
                var userOffer = new PromotionalOffer
                {
                    Id = Guid.NewGuid(),
                    Title = template.Title,
                    Description = template.Description,
                    OfferType = template.OfferType,
                    TargetUserId = user.Id,
                    BonusWorthPaise = 0,
                    BonusPercent = template.BonusPercent,
                    MinPurchaseAmountPaise = template.MinPurchaseAmountPaise,
                    DurationHours = template.DurationHours,
                    ExpiresAt = expiresAt,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                _context.PromotionalOffers.Add(userOffer);

                // Send push notification
                var eventLabel = req.OfferType == "BIRTHDAY" ? "🎂 Happy Birthday" : "💍 Happy Anniversary";
                var minPurchaseText = template.MinPurchaseAmountPaise > 0
                    ? $" on purchases above ₹{template.MinPurchaseAmountPaise / 100}"
                    : "";
                var notifTitle = $"{eventLabel}, {user.FullName?.Split(' ')[0] ?? ""}! 🎉";
                var notifBody = $"Special offer just for you! Get {template.BonusPercent}% bonus gold{minPurchaseText} on any direct gold purchase. Valid for {template.DurationHours} hour(s)!";

                try
                {
                    await _notificationService.SendNotificationAsync(user.Id, notifTitle, notifBody, req.OfferType == "BIRTHDAY" ? "BIRTHDAY_OFFER" : "ANNIVERSARY_OFFER");
                }
                catch { /* don't block if push fails */ }

                fired++;
            }

            _context.PlatformAuditLogs.Add(new PlatformAuditLog
            {
                Action = $"FIRE_{req.OfferType}_OFFERS",
                Details = $"Fired {req.OfferType} offers to {fired} users. Template: {template.Title}. Expires: {expiresAt}",
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown",
                Status = "SUCCESS"
            });

            await _context.SaveChangesAsync();
            return Ok(new { success = true, fired, expiresAt, message = $"{req.OfferType} offers sent to {fired} user(s)." });
        }

        // ─── GET: Active offers for a user (app-side) ───────────────────────────
        [HttpGet("active/{userId}")]
        public async Task<IActionResult> GetActiveOffers(Guid userId)
        {
            var now = DateTime.UtcNow;
            var activeOffers = await _context.PromotionalOffers
                .Where(o => o.IsActive && o.ExpiresAt > now && (o.TargetUserId == null || o.TargetUserId == userId))
                .ToListAsync();

            var claimedOfferIds = await _context.UserClaimedOffers
                .Where(c => c.UserId == userId)
                .Select(c => c.OfferId)
                .ToListAsync();

            var availableOffers = activeOffers.Where(o => !claimedOfferIds.Contains(o.Id)).ToList();
            return Ok(availableOffers);
        }

        // ─── GET: All offers (admin) ─────────────────────────────────────────────
        [HttpGet("all")]
        public async Task<IActionResult> GetAllOffers()
        {
            var offers = await _context.PromotionalOffers
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();
            return Ok(offers);
        }

        // ─── GET: All offers enriched with user name (admin) ─────────────────────
        [HttpGet("all-enriched")]
        public async Task<IActionResult> GetAllOffersEnriched()
        {
            var offers = await _context.PromotionalOffers
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            var userIds = offers.Where(o => o.TargetUserId.HasValue).Select(o => o.TargetUserId!.Value).Distinct().ToList();
            var users = await _context.Users
                .Where(u => userIds.Contains(u.Id))
                .Select(u => new { u.Id, u.FullName, u.PhoneNumber })
                .ToListAsync();
            var userMap = users.ToDictionary(u => u.Id);

            var result = offers.Select(o => new
            {
                o.Id,
                o.Title,
                o.Description,
                o.OfferType,
                o.TargetUserId,
                TargetUserName = o.TargetUserId.HasValue && userMap.ContainsKey(o.TargetUserId.Value)
                    ? userMap[o.TargetUserId.Value].FullName : null,
                TargetUserPhone = o.TargetUserId.HasValue && userMap.ContainsKey(o.TargetUserId.Value)
                    ? userMap[o.TargetUserId.Value].PhoneNumber : null,
                o.BonusWorthPaise,
                o.BonusPercent,
                o.MinPurchaseAmountPaise,
                o.DurationHours,
                o.ExpiresAt,
                o.IsActive,
                o.CreatedAt
            });

            return Ok(result);
        }

        // ─── GET: Templates only (admin) ─────────────────────────────────────────
        [HttpGet("templates")]
        public async Task<IActionResult> GetTemplates()
        {
            var templates = await _context.PromotionalOffers
                .Where(o => !o.IsActive && o.TargetUserId == null && (o.OfferType == "BIRTHDAY" || o.OfferType == "ANNIVERSARY"))
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();
            return Ok(templates);
        }

        // ─── CLAIM: Claim an offer (and credit bonus gold on next purchase) ──────
        [HttpPost("claim")]
        public async Task<IActionResult> ClaimOffer([FromBody] ClaimRequest req)
        {
            var now = DateTime.UtcNow;
            var offer = await _context.PromotionalOffers.FindAsync(req.OfferId);

            if (offer == null || !offer.IsActive || offer.ExpiresAt <= now)
                return BadRequest(new { message = "Offer is invalid or expired." });

            if (offer.TargetUserId != null && offer.TargetUserId != req.UserId)
                return BadRequest(new { message = "You are not eligible for this offer." });

            var alreadyClaimed = await _context.UserClaimedOffers
                .AnyAsync(c => c.UserId == req.UserId && c.OfferId == req.OfferId);
            if (alreadyClaimed)
                return BadRequest(new { message = "Offer already claimed." });

            _context.UserClaimedOffers.Add(new UserClaimedOffer { OfferId = req.OfferId, UserId = req.UserId, ClaimedAt = now });
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Offer claimed! Bonus gold will be credited automatically when you make a direct gold purchase.",
                bonusPaise = offer.BonusWorthPaise,
                bonusPercent = offer.BonusPercent,
                isPercentBonus = offer.BonusPercent > 0
            });
        }

        // ─── PURCHASE HOOK: Called after direct gold buy to apply event bonus ────
        [HttpPost("apply-purchase-bonus")]
        public async Task<IActionResult> ApplyPurchaseBonus([FromBody] ApplyBonusRequest req)
        {
            var now = DateTime.UtcNow;

            // Find active event offer for this user (BIRTHDAY or ANNIVERSARY, unclaimed)
            var activeEventOffer = await _context.PromotionalOffers
                .Where(o => o.IsActive && o.ExpiresAt > now && o.TargetUserId == req.UserId
                    && (o.OfferType == "BIRTHDAY" || o.OfferType == "ANNIVERSARY")
                    && o.BonusPercent > 0)
                .OrderByDescending(o => o.BonusPercent)
                .FirstOrDefaultAsync();

            if (activeEventOffer == null)
                return Ok(new { bonusApplied = false, bonusGoldMg = 0L });

            // Check already claimed for this purchase (use offer claim for idempotency)
            var alreadyClaimed = await _context.UserClaimedOffers
                .AnyAsync(c => c.UserId == req.UserId && c.OfferId == activeEventOffer.Id);
            if (alreadyClaimed)
                return Ok(new { bonusApplied = false, bonusGoldMg = 0L, reason = "Already claimed" });

            // Check min purchase threshold
            if (req.PurchaseAmountPaise < activeEventOffer.MinPurchaseAmountPaise)
                return Ok(new { bonusApplied = false, bonusGoldMg = 0L, reason = "Below minimum purchase" });

            // Calculate bonus amount in paise
            var bonusAmountPaise = (long)(req.PurchaseAmountPaise * (double)(activeEventOffer.BonusPercent / 100m));

            // Convert bonus amount to gold (using live price)
            var price = await _priceManager.GetPriceAsync();
            var buyPricePaise = (long)(price.BuyPrice * 100);
            // base amount for gold calc (remove GST from bonus too for fairness)
            var bonusBaseAmountPaise = (bonusAmountPaise * 100) / 103;
            var bonusGoldMg = (bonusBaseAmountPaise * 1000) / buyPricePaise;

            if (bonusGoldMg <= 0)
                return Ok(new { bonusApplied = false, bonusGoldMg = 0L });

            // Credit bonus gold to the user's BonusGoldBalanceMg (separate balance)
            var holding = await _context.GoldHoldings.FirstOrDefaultAsync(h => h.UserId == req.UserId);
            if (holding == null)
            {
                holding = new GoldHolding { UserId = req.UserId, GoldBalanceMg = 0, BonusGoldBalanceMg = 0 };
                _context.GoldHoldings.Add(holding);
            }
            holding.BonusGoldBalanceMg += bonusGoldMg;
            holding.UpdatedAt = DateTimeOffset.UtcNow;

            // Record bonus gold transaction
            _context.GoldTransactions.Add(new GoldTransaction
            {
                Id = Guid.NewGuid(),
                UserId = req.UserId,
                TransactionType = "EVENT_BONUS",
                GoldWeightMg = bonusGoldMg,
                PricePerGmPaise = buyPricePaise,
                TotalAmountPaise = 0,
                IpAddress = "SYSTEM",
                DeviceFingerprint = "SYSTEM",
                RateSource = $"{activeEventOffer.OfferType}_OFFER",
                RateTimestamp = DateTimeOffset.UtcNow,
                BonusAmountPaise = bonusAmountPaise,
                BonusGoldMg = bonusGoldMg,
                CreatedAt = DateTime.UtcNow
            });

            // Mark offer as claimed
            _context.UserClaimedOffers.Add(new UserClaimedOffer
            {
                OfferId = activeEventOffer.Id,
                UserId = req.UserId,
                ClaimedAt = now
            });

            _context.PlatformAuditLogs.Add(new PlatformAuditLog
            {
                UserId = req.UserId,
                Action = $"{activeEventOffer.OfferType}_BONUS_CREDITED",
                Details = $"{activeEventOffer.BonusPercent}% bonus = ₹{bonusAmountPaise / 100.0:F2} → {bonusGoldMg}mg bonus gold credited (separate balance)",
                IpAddress = "SYSTEM",
                Status = "SUCCESS"
            });

            await _context.SaveChangesAsync();

            // Send notification to user
            try
            {
                await _notificationService.SendNotificationAsync(req.UserId,
                    $"🎁 {activeEventOffer.BonusPercent}% Bonus Gold Credited!",
                    $"You received {bonusGoldMg / 1000.0:F4}g of bonus gold from your {activeEventOffer.OfferType.ToLower()} offer!",
                    "OFFER_BONUS_CREDITED");
            }
            catch { }

            return Ok(new { bonusApplied = true, bonusGoldMg, bonusAmountPaise, offerType = activeEventOffer.OfferType });
        }

        // ─── TOGGLE: Activate/Deactivate offer ────────────────────────────────────
        [HttpPost("{offerId}/toggle")]
        public async Task<IActionResult> ToggleOffer(Guid offerId)
        {
            var offer = await _context.PromotionalOffers.FindAsync(offerId);
            if (offer == null) return NotFound();
            offer.IsActive = !offer.IsActive;
            await _context.SaveChangesAsync();
            return Ok(new { success = true, isActive = offer.IsActive });
        }
    }

    // ─── Request DTOs ─────────────────────────────────────────────────────────────
    public class ClaimRequest
    {
        public Guid UserId { get; set; }
        public Guid OfferId { get; set; }
    }

    public class CreateEventOfferRequest
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string OfferType { get; set; } = "BIRTHDAY"; // BIRTHDAY or ANNIVERSARY
        public decimal BonusPercent { get; set; }
        public long MinPurchaseAmountPaise { get; set; } = 0;
        public int DurationHours { get; set; } = 24;
    }

    public class FireEventOffersRequest
    {
        public string OfferType { get; set; } = "BIRTHDAY";
        public Guid? TemplateId { get; set; }
    }

    public class ApplyBonusRequest
    {
        public Guid UserId { get; set; }
        public long PurchaseAmountPaise { get; set; }
    }
}
