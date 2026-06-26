using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Aishwaryam.Infrastructure.Data;
using System.Linq;

namespace Aishwaryam.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReferralNetworkController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReferralNetworkController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetReferralNetwork(Guid userId)
        {
            var network = await _context.ReferralEvents
                .Include(r => r.RefereeUser)
                .Where(r => r.ReferrerUserId == userId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    ReferredUserName = r.RefereeUser != null ? r.RefereeUser.FullName : "Unknown User",
                    JoinedAt = r.CreatedAt,
                    RewardStatus = r.RewardStatus,
                    BonusAwardedMg = r.BonusAwardedMg
                })
                .ToListAsync();

            long totalBonus = network.Sum(r => r.BonusAwardedMg);

            return Ok(new
            {
                TotalReferrals = network.Count,
                TotalBonusMg = totalBonus,
                Network = network
            });
        }
    }
}
