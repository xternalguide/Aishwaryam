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
    public class OffersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public OffersController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateOffer([FromBody] PromotionalOffer request)
        {
            // Validate
            if (string.IsNullOrEmpty(request.Title) || request.BonusWorthPaise <= 0 || request.ExpiresAt <= DateTime.UtcNow)
                return BadRequest(new { message = "Invalid offer details" });

            request.Id = Guid.NewGuid();
            request.CreatedAt = DateTime.UtcNow;
            
            _context.PromotionalOffers.Add(request);
            
            // Log the action
            _context.PlatformAuditLogs.Add(new PlatformAuditLog {
                Action = "CREATE_OFFER",
                Details = $"Admin created offer: {request.Title}. Expires at {request.ExpiresAt}",
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown",
                Status = "SUCCESS"
            });
            
            await _context.SaveChangesAsync();
            return Ok(request);
        }

        [HttpGet("active/{userId}")]
        public async Task<IActionResult> GetActiveOffers(Guid userId)
        {
            var now = DateTime.UtcNow;
            
            // Get all active, non-expired offers that are either bulk (TargetUserId == null) or specifically for this user
            var activeOffers = await _context.PromotionalOffers
                .Where(o => o.IsActive && o.ExpiresAt > now && (o.TargetUserId == null || o.TargetUserId == userId))
                .ToListAsync();
                
            // Filter out the ones the user has already claimed
            var claimedOfferIds = await _context.UserClaimedOffers
                .Where(c => c.UserId == userId)
                .Select(c => c.OfferId)
                .ToListAsync();
                
            var availableOffers = activeOffers.Where(o => !claimedOfferIds.Contains(o.Id)).ToList();
            
            return Ok(availableOffers);
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllOffers()
        {
            var offers = await _context.PromotionalOffers
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();
            return Ok(offers);
        }

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
                
            // Register claim
            var claim = new UserClaimedOffer {
                OfferId = req.OfferId,
                UserId = req.UserId,
                ClaimedAt = now
            };
            
            _context.UserClaimedOffers.Add(claim);
            
            // Note: In a real flow, the bonus gold would be added to GoldHoldings here or in the transaction flow.
            // For now, we just record the claim.
            
            await _context.SaveChangesAsync();
            return Ok(new { message = "Offer claimed successfully!", bonusPaise = offer.BonusWorthPaise });
        }
    }
    
    public class ClaimRequest {
        public Guid UserId { get; set; }
        public Guid OfferId { get; set; }
    }
}
