using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Aishwaryam.Application.DTOs.Gold;
using Aishwaryam.Application.Interfaces.Services;
using Microsoft.EntityFrameworkCore;
using Aishwaryam.Infrastructure.Data;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.Extensions.Caching.Memory;

namespace Aishwaryam.Api.Controllers
{
    public class AdminUpdatePriceRequest
    {
        public long BuyPricePaise { get; set; }
        public long SellPricePaise { get; set; }
        public bool IsAdminOverride { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Require JWT for all gold operations
    public class GoldController : ControllerBase
    {
        private readonly IGoldService _goldService;
        private readonly ApplicationDbContext _context;
        private readonly IGoldPriceManager _priceManager;
        private readonly IMemoryCache _cache;
        private readonly INotificationService _notificationService;

        public GoldController(IGoldService goldService, ApplicationDbContext context, IGoldPriceManager priceManager, IMemoryCache cache, INotificationService notificationService)
        {
            _goldService = goldService;
            _context = context;
            _priceManager = priceManager;
            _cache = cache;
            _notificationService = notificationService;
        }

        private Guid GetAuthenticatedUserId()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr)) return Guid.Empty;
            return Guid.Parse(userIdStr);
        }

        [HttpGet("portfolio")]
        public async Task<IActionResult> GetPortfolio()
        {
            var userId = GetAuthenticatedUserId();
            if (userId == Guid.Empty) return Unauthorized();

            var holding = await _context.GoldHoldings.FirstOrDefaultAsync(h => h.UserId == userId);
            var balanceMg = holding?.GoldBalanceMg ?? 0;
            
            var price = await _goldService.GetCurrentPriceAsync();
            var status = await _goldService.GetGoldStatusAsync(userId);
            
            long currentValue = (balanceMg * price.BuyPricePaise) / 1000;
            
            return Ok(new {
                UserId = userId.ToString(),
                GoldBalanceMg = balanceMg,
                InvestedAmountPaise = currentValue,
                CurrentValuePaise = currentValue,
                ReturnPercentage = 0.0,
                LockedGoldMg = status.LockedMg,
                RedeemableGoldMg = status.RedeemableMg
            });
        }

        [HttpGet("transactions")]
        public async Task<IActionResult> GetRecentTransactions([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var userId = GetAuthenticatedUserId();
            if (userId == Guid.Empty) return Unauthorized();

            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 100) pageSize = 100;

            // 1. Fetch Gold Transactions
            var goldTransactions = await _context.GoldTransactions
                .Where(t => t.UserId == userId)
                .Include(t => t.Invoice)
                .ToListAsync();

            // 2. Fetch User Schemes (joins)
            var userSchemes = await _context.UserSchemes
                .Where(s => s.UserId == userId)
                .ToListAsync();

            // 3. Fetch Pending Scheme Redemptions
            var pendingRedemptions = await _context.SchemeRedemptions
                .Where(r => r.UserId == userId && r.Status == "PENDING")
                .ToListAsync();

            var schemesMap = userSchemes.ToDictionary(s => s.Id, s => s.PlanName);

            var activities = new List<object>();

            // Add Gold Transactions
            foreach (var t in goldTransactions)
            {
                activities.Add(new {
                    transactionId = t.Id.ToString(),
                    type = t.TransactionType,
                    goldWeightMg = t.GoldWeightMg,
                    amountPaise = t.TotalAmountPaise,
                    createdAt = t.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    rawCreatedAt = t.CreatedAt,
                    rateSource = t.RateSource,
                    schemeName = t.UserSchemeId.HasValue && schemesMap.TryGetValue(t.UserSchemeId.Value, out var name) ? name : null,
                    bonusAmountPaise = t.BonusAmountPaise,
                    bonusGoldMg = t.BonusGoldMg,
                    bonusPercentage = (decimal)(t.Invoice != null ? t.Invoice.BonusPercentage : 0),
                    status = "COMPLETED"
                });
            }

            // Add Scheme Joins
            foreach (var s in userSchemes)
            {
                activities.Add(new {
                    transactionId = s.Id.ToString(),
                    type = "SCHEME_JOIN",
                    goldWeightMg = 0L,
                    amountPaise = s.InstallmentAmountPaise,
                    createdAt = s.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    rawCreatedAt = new DateTimeOffset(s.CreatedAt, TimeSpan.Zero),
                    rateSource = "SYSTEM",
                    schemeName = s.PlanName,
                    bonusAmountPaise = 0L,
                    bonusGoldMg = 0L,
                    bonusPercentage = 0m,
                    status = s.Status
                });
            }

            // Add Pending Redemptions
            foreach (var r in pendingRedemptions)
            {
                activities.Add(new {
                    transactionId = r.Id.ToString(),
                    type = "REDEMPTION_REQUEST",
                    goldWeightMg = r.GoldWeightMg,
                    amountPaise = r.TotalAmountPaise,
                    createdAt = r.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    rawCreatedAt = new DateTimeOffset(r.CreatedAt, TimeSpan.Zero),
                    rateSource = "SYSTEM",
                    schemeName = schemesMap.TryGetValue(r.UserSchemeId, out var name) ? name : "Scheme",
                    bonusAmountPaise = 0L,
                    bonusGoldMg = 0L,
                    bonusPercentage = 0m,
                    status = r.Status
                });
            }

            // Sort by rawCreatedAt descending
            var sortedActivities = activities
                .Cast<dynamic>()
                .OrderByDescending(a => a.rawCreatedAt)
                .ToList();

            var total = sortedActivities.Count;
            var totalPages = (int)Math.Ceiling((double)total / pageSize);

            var paginated = sortedActivities
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new {
                    transactionId = a.transactionId,
                    type = a.type,
                    goldWeightMg = a.goldWeightMg,
                    amountPaise = a.amountPaise,
                    createdAt = a.createdAt,
                    rateSource = a.rateSource,
                    schemeName = a.schemeName,
                    bonusAmountPaise = a.bonusAmountPaise,
                    bonusGoldMg = a.bonusGoldMg,
                    bonusPercentage = a.bonusPercentage,
                    status = a.status
                })
                .ToList();

            return Ok(new {
                transactions = paginated,
                total = total,
                page = page,
                pageSize = pageSize,
                totalPages = totalPages
            });
        }

        [HttpGet("transactions/all")]
        [AllowAnonymous] // Allow access from Admin panel
        public async Task<IActionResult> GetAllTransactions([FromQuery] int page = 1, [FromQuery] int pageSize = 100)
        {
            // Simple security check for demo - should be role-based
            if (!User.HasClaim(c => c.Type == "Admin" || c.Value == "True"))
            {
                // return Forbid(); // Enable when roles are ready
            }

            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 500) pageSize = 500;

            var baseQuery = _context.GoldTransactions;
            var total = await baseQuery.CountAsync();

            var paginatedQuery = baseQuery
                .OrderByDescending(t => t.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize);

            var queryWithScheme = from t in paginatedQuery
                                  join s in _context.UserSchemes on t.UserSchemeId equals s.Id into sj
                                  from s in sj.DefaultIfEmpty()
                                  select new {
                                      transactionId = t.Id.ToString(),
                                      userId = t.UserId.ToString(),
                                      type = t.TransactionType,
                                      goldWeightMg = t.GoldWeightMg,
                                      amountPaise = t.TotalAmountPaise,
                                      createdAt = t.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                                      rateSource = t.RateSource,
                                      schemeName = s != null ? s.PlanName : null,
                                      bonusAmountPaise = t.BonusAmountPaise,
                                      bonusGoldMg = t.BonusGoldMg,
                                      bonusPercentage = t.Invoice != null ? t.Invoice.BonusPercentage : 0
                                  };

            var txs = await queryWithScheme.ToListAsync();

            var totalPages = (int)Math.Ceiling((double)total / pageSize);
                
            return Ok(new {
                transactions = txs,
                total = total,
                page = page,
                pageSize = pageSize,
                totalPages = totalPages
            });
        }

        [HttpPost("price")]
        [AllowAnonymous] // Allow access from Admin panel
        public async Task<IActionResult> UpdatePrice([FromBody] AdminUpdatePriceRequest request)
        {
            if (request.BuyPricePaise <= 0 || request.SellPricePaise <= 0)
                return BadRequest("Invalid prices.");

            var buyDecimal = (decimal)request.BuyPricePaise / 100m;
            var sellDecimal = (decimal)request.SellPricePaise / 100m;

            // Fetch previous snapshot to compare price trends before inserting new rate
            var previousSnapshot = await _context.GoldPriceSnapshots
                .OrderByDescending(s => s.FetchedAt)
                .FirstOrDefaultAsync();

            var snapshot = new Aishwaryam.Domain.Entities.GoldPriceSnapshot
            {
                Price24KPerGram = buyDecimal / 0.916m,
                Price22KPerGram = buyDecimal,
                BuyPricePerGram = buyDecimal,
                SellPricePerGram = sellDecimal,
                Source = "AdminManual",
                AdminNote = "Manual update via Admin Console",
                IsAdminOverride = request.IsAdminOverride,
                FetchedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddYears(1)
            };

            await _context.Database.ExecuteSqlRawAsync(
                @"INSERT INTO gold_price_snapshots 
                    (id, price_24k_per_gram, price_22k_per_gram, buy_price_per_gram, sell_price_per_gram, source, admin_note, is_admin_override, fetched_at, expires_at)
                  VALUES
                    ({0},{1},{2},{3},{4},{5},{6},{7},{8},{9})",
                snapshot.Id, snapshot.Price24KPerGram, snapshot.Price22KPerGram,
                snapshot.BuyPricePerGram, snapshot.SellPricePerGram, snapshot.Source,
                snapshot.AdminNote ?? "", snapshot.IsAdminOverride, snapshot.FetchedAt, snapshot.ExpiresAt);

            // CRITICAL: Invalidate cache so all users see the update immediately!
            _cache.Remove("LiveGoldPrice");

            // Automatically call api backend function to broadcast push notification if daily price alerts are active
            var config = await _context.AppConfigs.FirstOrDefaultAsync();
            if (config != null && config.IsDailyPriceNotificationEnabled && previousSnapshot != null)
            {
                var currentPrice = buyDecimal;
                var oldPrice = previousSnapshot.BuyPricePerGram;

                string title = "";
                string body = "";
                string type = "PRICE_UPDATE";

                if (currentPrice > oldPrice)
                {
                    title = "Gold Price Trend: Rising! 📈";
                    body = $"Today's gold price has increased to ₹{currentPrice:F2}/g (compared to ₹{oldPrice:F2}/g yesterday). Secure your systematic savings rate now.";
                }
                else if (currentPrice < oldPrice)
                {
                    title = "Gold Price Trend: Dropping! 📉";
                    body = $"Gold price has dropped to ₹{currentPrice:F2}/g (compared to ₹{oldPrice:F2}/g yesterday). Purchase gold now and get maximum gold grams benefits!";
                }
                else
                {
                    title = "Today's Gold Price Update 🔔";
                    body = $"Today's gold rate is holding steady at ₹{currentPrice:F2}/g. Keep saving systematically and secure your future!";
                }

                try
                {
                    await _notificationService.BroadcastNotificationAsync(title, body, type, new System.Collections.Generic.Dictionary<string, string> {
                        { "screen", "buyGold" }
                    });
                }
                catch (Exception ex)
                {
                    // Fail-safe: log but do not disrupt primary price update
                }
            }

            return Ok(new { message = "Prices updated successfully." });
        }

        [HttpGet("price")]
        [AllowAnonymous] // Allow public access to price
        public async Task<IActionResult> GetLivePrice()
        {
            var price = await _priceManager.GetPriceAsync();
            return Ok(new {
                price24KPaise = (long)(price.Price24K * 100),
                price22KPaise = (long)(price.Price22K * 100),
                priceSilverPaise = (long)(price.PriceSilver * 100),
                buyPricePaise = (long)(price.BuyPrice * 100),
                sellPricePaise = (long)(price.SellPrice * 100),
                source = price.Source,
                isFallback = price.Source == "StaticFallback",
                isAdminOverride = price.IsAdminOverride,
                updatedAt = price.Timestamp.ToString("yyyy-MM-ddTHH:mm:ssZ")
            });
        }

        [HttpGet("price-logs")]
        [AllowAnonymous] // Allow public access to logs for admin dashboard
        public async Task<IActionResult> GetPriceLogs([FromQuery] int limit = 50)
        {
            var logs = await _context.GoldPriceSnapshots
                .OrderByDescending(s => s.FetchedAt)
                .Take(limit)
                .Select(s => new {
                    createdAt = s.FetchedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    buyPricePaise = (long)(s.BuyPricePerGram * 100),
                    sellPricePaise = (long)(s.SellPricePerGram * 100),
                    isAdminOverride = s.IsAdminOverride
                })
                .ToListAsync();

            return Ok(logs);
        }

        [HttpPost("price/lock")]
        public async Task<IActionResult> LockPrice()
        {
            var userId = GetAuthenticatedUserId();
            if (userId == Guid.Empty) return Unauthorized();

            var price = await _priceManager.GetPriceAsync();
            var lockId = await _priceManager.CreatePriceLockAsync(userId, price);
            return Ok(new {
                lockId,
                lockedBuyPricePaise = (long)(price.BuyPrice * 100),
                lockedSellPricePaise = (long)(price.SellPrice * 100),
                lockedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                expiresAt = DateTime.UtcNow.AddMinutes(10).ToString("yyyy-MM-ddTHH:mm:ssZ"),
                expiresInSeconds = 600
            });
        }

        [HttpPost("price/admin-override")]
        [Authorize] // In real app, [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AdminPriceOverride([FromBody] AdminPriceOverrideRequest request)
        {
            if (request.Price24KPerGram <= 0) return BadRequest("Invalid price.");

            var buyDecimal = request.Price24KPerGram * 0.916m;
            var sellDecimal = request.Price24KPerGram * 0.916m * 0.97m;

            // Fetch previous snapshot to compare price trends before inserting new rate
            var previousSnapshot = await _context.GoldPriceSnapshots
                .OrderByDescending(s => s.FetchedAt)
                .FirstOrDefaultAsync();

            var snapshot = new Aishwaryam.Domain.Entities.GoldPriceSnapshot
            {
                Price24KPerGram = request.Price24KPerGram,
                Price22KPerGram = buyDecimal,
                BuyPricePerGram = buyDecimal,
                SellPricePerGram = sellDecimal,
                Source = "AdminOverride",
                AdminNote = request.Note,
                IsAdminOverride = true,
                FetchedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(request.DurationHours)
            };

            await _context.Database.ExecuteSqlRawAsync(
                @"INSERT INTO gold_price_snapshots 
                    (id, price_24k_per_gram, price_22k_per_gram, buy_price_per_gram, sell_price_per_gram, source, admin_note, is_admin_override, fetched_at, expires_at)
                  VALUES
                    ({0},{1},{2},{3},{4},{5},{6},{7},{8},{9})",
                snapshot.Id, snapshot.Price24KPerGram, snapshot.Price22KPerGram,
                snapshot.BuyPricePerGram, snapshot.SellPricePerGram, snapshot.Source,
                snapshot.AdminNote ?? "", snapshot.IsAdminOverride, snapshot.FetchedAt, snapshot.ExpiresAt);

            // CRITICAL: Invalidate cache so all users see the update immediately!
            _cache.Remove("LiveGoldPrice");

            // Automatically call api backend function to broadcast push notification if daily price alerts are active
            var config = await _context.AppConfigs.FirstOrDefaultAsync();
            if (config != null && config.IsDailyPriceNotificationEnabled && previousSnapshot != null)
            {
                var currentPrice = buyDecimal;
                var oldPrice = previousSnapshot.BuyPricePerGram;

                string title = "";
                string body = "";
                string type = "PRICE_UPDATE";

                if (currentPrice > oldPrice)
                {
                    title = "Gold Price Trend: Rising! 📈";
                    body = $"Today's gold price has increased to ₹{currentPrice:F2}/g (compared to ₹{oldPrice:F2}/g yesterday). Secure your systematic savings rate now.";
                }
                else if (currentPrice < oldPrice)
                {
                    title = "Gold Price Trend: Dropping! 📉";
                    body = $"Gold price has dropped to ₹{currentPrice:F2}/g (compared to ₹{oldPrice:F2}/g yesterday). Purchase gold now and get maximum gold grams benefits!";
                }
                else
                {
                    title = "Today's Gold Price Update 🔔";
                    body = $"Today's gold rate is holding steady at ₹{currentPrice:F2}/g. Keep saving systematically and secure your future!";
                }

                try
                {
                    await _notificationService.BroadcastNotificationAsync(title, body, type, new System.Collections.Generic.Dictionary<string, string> {
                        { "screen", "buyGold" }
                    });
                }
                catch (Exception ex)
                {
                    // Fail-safe: log but do not disrupt primary price update
                }
            }

            return Ok(new { message = "Admin price override applied and logged.", snapshot.Id });
        }

        [HttpGet("receipt/download/{transactionId}")]
        [AllowAnonymous]
        public async Task<IActionResult> DownloadReceipt(Guid transactionId, [FromServices] IReceiptPdfGenerator pdfGenerator)
        {
            try
            {
                var pdfBytes = await pdfGenerator.GenerateReceiptPdfAsync(transactionId);
                return File(pdfBytes, "application/pdf", $"Receipt_{transactionId.ToString()[..8].ToUpper()}.pdf");
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred generating receipt.", Details = ex.Message });
            }
        }

        [HttpPost("buy")]
        public async Task<IActionResult> BuyGold([FromBody] BuyGoldRequest request)
        {
            var userId = GetAuthenticatedUserId();
            if (userId == Guid.Empty) return Unauthorized();
            
            // Force authenticated userId to prevent IDOR
            request.UserId = userId;

            if (request.TotalAmountPaise <= 0)
                return BadRequest(new { Message = "Invalid buy amount." });

            request.IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            request.DeviceFingerprint = Request.Headers["X-Device-Fingerprint"].ToString();
            if (string.IsNullOrEmpty(request.DeviceFingerprint)) request.DeviceFingerprint = "web_default";

            // Pass BaseUrl for receipt download link generation
            request.BaseUrl = $"{Request.Scheme}://{Request.Host}/";

            try
            {
                var response = await _goldService.BuyGoldAsync(request);
                if (response.Success) return Ok(response);
                return BadRequest(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred.", Details = ex.Message });
            }
        }

        [HttpPost("sell")]
        public async Task<IActionResult> SellGold([FromBody] SellGoldRequest request)
        {
            var userId = GetAuthenticatedUserId();
            if (userId == Guid.Empty) return Unauthorized();

            // Force authenticated userId to prevent IDOR
            request.UserId = userId;

            if (request.GoldWeightMg <= 0)
                return BadRequest(new { Message = "Invalid weight." });

            var status = await _goldService.GetGoldStatusAsync(userId);
            if (request.GoldWeightMg > status.RedeemableMg)
            {
                return BadRequest(new { Message = "Insufficient redeemable gold." });
            }

            request.IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            request.DeviceFingerprint = Request.Headers["X-Device-Fingerprint"].ToString();
            if (string.IsNullOrEmpty(request.DeviceFingerprint)) request.DeviceFingerprint = "web_default";

            try
            {
                var response = await _goldService.SellGoldAsync(request);
                if (response != null && response.Success) return Ok(response);
                return BadRequest(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred.", Details = ex.Message });
            }
        }
    }
}
