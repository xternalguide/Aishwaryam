using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Aishwaryam.Infrastructure.Data;
using Aishwaryam.Domain.Entities;
using Aishwaryam.Application.Interfaces.Services;

namespace Aishwaryam.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IGoldPriceManager _priceManager;
        private readonly IGoldService _goldService;
        private readonly ISchemeService _schemeService;

        public DashboardController(
            ApplicationDbContext context,
            IGoldPriceManager priceManager,
            IGoldService goldService,
            ISchemeService schemeService)
        {
            _context = context;
            _priceManager = priceManager;
            _goldService = goldService;
            _schemeService = schemeService;
        }

        [HttpGet("overview/{userId}")]
        public async Task<IActionResult> GetDashboardOverview(Guid userId)
        {
            // 1. Get Live Gold Price
            var price = await _priceManager.GetPriceAsync();
            long buyPricePaise = (long)(price.BuyPrice * 100);
            long sellPricePaise = (long)(price.SellPrice * 100);
            long price24KPaise = (long)(price.Price24K * 100);
            long price22KPaise = (long)(price.Price22K * 100);
            long priceSilverPaise = (long)(price.PriceSilver * 100);
            string priceUpdatedAt = price.Timestamp.ToString("yyyy-MM-ddTHH:mm:ssZ");

            // 2. Get Balances Separately
            long silverBalanceMg = await (from t in _context.GoldTransactions
                                          join s in _context.UserSchemes on t.UserSchemeId equals s.Id
                                          where t.UserId == userId && s.PlanName.ToLower().Contains("silver")
                                          select t.TransactionType == "SELL" ? -t.GoldWeightMg : t.GoldWeightMg)
                                         .SumAsync();

            long goldBalanceMg = await (from t in _context.GoldTransactions
                                        join s in _context.UserSchemes on t.UserSchemeId equals s.Id into sj
                                        from s in sj.DefaultIfEmpty()
                                        where t.UserId == userId && (s == null || !s.PlanName.ToLower().Contains("silver"))
                                        select t.TransactionType == "SELL" ? -t.GoldWeightMg : t.GoldWeightMg)
                                       .SumAsync();

            long investedAmountPaise = await _context.GoldTransactions
                .Where(t => t.UserId == userId)
                .SumAsync(t => t.TransactionType == "SELL" ? -t.TotalAmountPaise : t.TotalAmountPaise);

            long currentValuePaise = (long)(((goldBalanceMg * buyPricePaise) / 1000.0) + ((silverBalanceMg * priceSilverPaise) / 1000.0));

            // 3. Get Recent Transactions
            var paginatedOverviewTxs = _context.GoldTransactions
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.CreatedAt)
                .Take(5);

            var txs = await (from t in paginatedOverviewTxs
                             join s in _context.UserSchemes on t.UserSchemeId equals s.Id into sj
                             from s in sj.DefaultIfEmpty()
                             select new {
                                 transactionId = t.Id.ToString(),
                                 type = t.TransactionType,
                                 goldWeightMg = (long)t.GoldWeightMg,
                                 amountPaise = (long)t.TotalAmountPaise,
                                 createdAt = t.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                                 rateSource = t.RateSource,
                                 schemeName = s != null ? s.PlanName : null,
                                 bonusAmountPaise = t.BonusAmountPaise,
                                 bonusGoldMg = t.BonusGoldMg,
                                 bonusPercentage = t.Invoice != null ? t.Invoice.BonusPercentage : 0
                             })
                             .ToListAsync();

            // 4. Get Active Banners (Dashboard location only)
            var banners = await _context.AppBanners
                .Where(b => b.IsActive && b.Location == "DASHBOARD")
                .OrderBy(b => b.DisplayOrder)
                .Select(b => new {
                    id = b.Id.ToString(),
                    title = b.Title,
                    imageBase64 = b.ImageBase64,
                    tapActionUrl = b.TapActionUrl
                })
                .ToListAsync();

            // 5. Get Active Schemes (if any)
            var activeScheme = await _context.UserSchemes
                .Where(s => s.UserId == userId && (s.Status == "Active" || s.Status == "Matured"))
                .OrderByDescending(s => s.CreatedAt)
                .FirstOrDefaultAsync();

            bool hasActiveScheme = activeScheme != null;
            string? schemePlanName = activeScheme?.PlanName;
            int schemeInstallmentsPaid = activeScheme?.InstallmentsPaid ?? 0;
            int schemeTotalInstallments = activeScheme?.TotalInstallments ?? 0;
            long schemeInstallmentAmountPaise = activeScheme?.InstallmentAmountPaise ?? 0;
            string? schemeNextDueDate = activeScheme?.NextDueDate.ToString("yyyy-MM-ddTHH:mm:ssZ");
            bool autoPayEnabled = activeScheme?.AutoPayEnabled ?? false;

            return Ok(new {
                goldBalanceMg,
                silverBalanceMg,
                buyPricePaise,
                sellPricePaise,
                price24KPaise,
                price22KPaise,
                priceSilverPaise,
                priceUpdatedAt,
                investedAmountPaise,
                currentValuePaise,
                returnPercentage = 0.0,
                recentTransactions = txs,
                activeBanners = banners,
                hasActiveScheme,
                schemePlanName,
                schemeInstallmentsPaid,
                schemeTotalInstallments,
                schemeInstallmentAmountPaise,
                schemeNextDueDate,
                goldAddedTodayMg = 0L,
                autoPayEnabled
            });
        }

        [HttpGet("portfolio/{userId}")]
        public async Task<IActionResult> GetPortfolio(Guid userId)
        {
            var price = await _priceManager.GetPriceAsync();
            long buyPricePaise = (long)(price.BuyPrice * 100);
            long priceSilverPaise = (long)(price.PriceSilver * 100);

            // 1. Get Balances Separately
            long silverBalanceMg = await (from t in _context.GoldTransactions
                                          join s in _context.UserSchemes on t.UserSchemeId equals s.Id
                                          where t.UserId == userId && s.PlanName.ToLower().Contains("silver")
                                          select t.TransactionType == "SELL" ? -t.GoldWeightMg : t.GoldWeightMg)
                                         .SumAsync();

            long goldBalanceMg = await (from t in _context.GoldTransactions
                                        join s in _context.UserSchemes on t.UserSchemeId equals s.Id into sj
                                        from s in sj.DefaultIfEmpty()
                                        where t.UserId == userId && (s == null || !s.PlanName.ToLower().Contains("silver"))
                                        select t.TransactionType == "SELL" ? -t.GoldWeightMg : t.GoldWeightMg)
                                       .SumAsync();

            // 2. Calculate actual dynamic invested amount (sum of all BUY transactions minus SELL transactions)
            long totalBuyAmount = await _context.GoldTransactions
                .Where(t => t.UserId == userId && t.TransactionType == "BUY")
                .SumAsync(t => (long?)t.TotalAmountPaise) ?? 0L;

            long totalSellAmount = await _context.GoldTransactions
                .Where(t => t.UserId == userId && t.TransactionType == "SELL")
                .SumAsync(t => (long?)t.TotalAmountPaise) ?? 0L;

            long investedAmountPaise = totalBuyAmount - totalSellAmount;
            long currentValuePaise = (long)(((goldBalanceMg * buyPricePaise) / 1000.0) + ((silverBalanceMg * priceSilverPaise) / 1000.0));

            // Safety fallback for test/migration users who have gold balance but no transaction history
            if (investedAmountPaise <= 0 && goldBalanceMg > 0)
            {
                investedAmountPaise = (long)(currentValuePaise * 0.90);
            }

            double returnPercentage = 0.0;
            if (investedAmountPaise > 0)
            {
                returnPercentage = ((double)currentValuePaise - investedAmountPaise) / investedAmountPaise * 100;
            }

            long totalBonusGoldMg = await _context.GoldTransactions
                .Where(t => t.UserId == userId && (t.TransactionType == "BONUS" || t.TransactionType == "EVENT_BONUS"))
                .SumAsync(t => (long?)t.GoldWeightMg) ?? 0L;

            var status = await _goldService.GetGoldStatusAsync(userId);

            // 3. Reconstruct monthly balances over the last 6 months for real graph data
            var transactions = await _context.GoldTransactions
                .Where(t => t.UserId == userId)
                .OrderBy(t => t.CreatedAt)
                .ToListAsync();

            var monthlyBalances = new List<long>();
            var now = DateTime.UtcNow;
            
            for (int i = 5; i >= 0; i--)
            {
                var monthEnd = new DateTime(now.Year, now.Month, 1).AddMonths(-i + 1).AddTicks(-1);
                var monthEndUtc = DateTime.SpecifyKind(monthEnd, DateTimeKind.Utc);
                
                long balanceAtMonthEnd = transactions
                    .Where(t => t.CreatedAt <= monthEndUtc)
                    .Sum(t => t.TransactionType == "SELL" ? -(long)t.GoldWeightMg : (long)t.GoldWeightMg);
                
                monthlyBalances.Add(balanceAtMonthEnd);
            }

            return Ok(new {
                userId = userId.ToString(),
                goldBalanceMg,
                silverBalanceMg,
                investedAmountPaise,
                currentValuePaise,
                returnPercentage,
                lockedGoldMg = status.LockedMg,
                maturedRedeemableGoldMg = status.MaturedRedeemableMg,
                redeemableGoldMg = status.RedeemableMg,
                redeemedGoldMg = status.RedeemedMg,
                totalBonusGoldMg,
                monthlyBalances
            });
        }

        [HttpGet("transactions/{userId}")]
        public async Task<IActionResult> GetRecentTransactions(Guid userId)
        {
            var baseQuery = _context.GoldTransactions
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.CreatedAt);

            var txs = await (from t in baseQuery
                             join s in _context.UserSchemes on t.UserSchemeId equals s.Id into sj
                             from s in sj.DefaultIfEmpty()
                             select new {
                                 transactionId = t.Id.ToString(),
                                 type = t.TransactionType,
                                 goldWeightMg = (long)t.GoldWeightMg,
                                 amountPaise = (long)t.TotalAmountPaise,
                                 createdAt = t.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                                 rateSource = t.RateSource,
                                 schemeName = s != null ? s.PlanName : null,
                                 bonusAmountPaise = t.BonusAmountPaise,
                                 bonusGoldMg = t.BonusGoldMg,
                                 bonusPercentage = t.Invoice != null ? t.Invoice.BonusPercentage : 0
                             })
                             .ToListAsync();

            return Ok(txs);
        }

        [HttpGet("config")]
        public async Task<IActionResult> GetConfig()
        {
            var config = await _context.AppConfigs.FirstOrDefaultAsync();
            if (config == null)
            {
                config = new AppConfig();
                _context.AppConfigs.Add(config);
                await _context.SaveChangesAsync();
            }

            return Ok(new {
                faqJson = config.FaqJson,
                referralBonusMsg = config.ReferralBonusMsg
            });
        }
    }
}
