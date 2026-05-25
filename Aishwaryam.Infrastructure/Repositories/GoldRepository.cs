using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Dapper;
using Aishwaryam.Application.Interfaces.Repositories;
using Aishwaryam.Domain.Entities;
using Aishwaryam.Infrastructure.Data;

namespace Aishwaryam.Infrastructure.Repositories
{
    public class GoldRepository : IGoldRepository
    {
        private readonly ApplicationDbContext _context;

        public GoldRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<GoldPriceLog?> GetLatestPriceAsync()
        {
            return await _context.GoldPriceLogs
                .OrderByDescending(g => g.CreatedAt)
                .FirstOrDefaultAsync();
        }

        public async Task<long> CalculateGoldBalanceAsync(Guid userId)
        {
            var connection = _context.Database.GetDbConnection();
            
            var sql = @"
                SELECT COALESCE(SUM(
                    CASE 
                        WHEN transaction_type IN ('BUY', 'BONUS', 'EVENT_BONUS') THEN gold_weight_mg 
                        WHEN transaction_type = 'SELL' THEN -gold_weight_mg 
                        ELSE 0 
                    END
                ), 0)
                FROM gold_transactions
                WHERE user_id = @UserId";

            var balance = await connection.QuerySingleAsync<long>(sql, new { UserId = userId });
            return balance;
        }

        public async Task UpdateGoldCacheAsync(Guid userId, long newBalanceMg)
        {
            var holding = await _context.GoldHoldings.FirstOrDefaultAsync(w => w.UserId == userId);
            
            if (holding == null)
            {
                holding = new GoldHolding { UserId = userId, GoldBalanceMg = newBalanceMg, BonusGoldBalanceMg = 0, UpdatedAt = DateTimeOffset.UtcNow };
                _context.GoldHoldings.Add(holding);
            }
            else
            {
                holding.GoldBalanceMg = newBalanceMg;
                holding.UpdatedAt = DateTimeOffset.UtcNow;
                _context.GoldHoldings.Update(holding);
            }

            await _context.SaveChangesAsync();
        }

        public async Task<GoldTransaction> RecordGoldTransactionAsync(GoldTransaction transaction)
        {
            _context.GoldTransactions.Add(transaction);
            await _context.SaveChangesAsync();
            return transaction;
        }

        public async Task<(long LockedMg, long MaturedRedeemableMg, long RedeemableMg, long RedeemedMg)> GetGoldStatusAsync(Guid userId)
        {
            var connection = _context.Database.GetDbConnection();
            
            // Logic: 
            // 1. Gold from 'BUY' transactions without a UserSchemeId or with a 'Matured/Completed' UserScheme is Redeemable.
            // 2. Gold from 'BONUS' or 'BUY' transactions with an 'Active' UserScheme is Locked.
            // 3. 'SELL' transactions deduct from the total gold.
            
            var sql = @"
                WITH tx_status AS (
                    SELECT 
                        t.gold_weight_mg,
                        t.transaction_type,
                        t.""UserSchemeId"",
                        COALESCE(s.status, 'NONE') as scheme_status
                    FROM gold_transactions t
                    LEFT JOIN user_schemes s ON t.""UserSchemeId"" = s.id
                    WHERE t.user_id = @UserId
                ),
                scheme_stats AS (
                    SELECT 
                        COALESCE(SUM(""RedeemedGoldMg""), 0) as total_redeemed
                    FROM user_schemes 
                    WHERE user_id = @UserId
                )
                SELECT 
                    SUM(CASE 
                        WHEN (transaction_type IN ('BUY', 'BONUS') AND ""UserSchemeId"" IS NOT NULL AND scheme_status IN ('Matured', 'Completed')) 
                        THEN gold_weight_mg 
                        ELSE 0 
                    END) as matured_redeemable,
                    SUM(CASE 
                        WHEN (transaction_type IN ('BUY', 'EVENT_BONUS') AND (""UserSchemeId"" IS NULL OR scheme_status NOT IN ('Active', 'Matured', 'Completed'))) 
                        THEN gold_weight_mg 
                        WHEN transaction_type = 'SELL' 
                        THEN -gold_weight_mg 
                        ELSE 0 
                    END) as regular_redeemable,
                    SUM(CASE 
                        WHEN (transaction_type = 'BONUS' AND scheme_status = 'Active') 
                        OR (transaction_type = 'BUY' AND ""UserSchemeId"" IS NOT NULL AND scheme_status = 'Active') 
                        THEN gold_weight_mg 
                        ELSE 0 
                    END) as locked,
                    (SELECT total_redeemed FROM scheme_stats) as redeemed
                FROM tx_status";

            var result = await connection.QuerySingleAsync<dynamic>(sql, new { UserId = userId });
            
            long maturedRedeemable = (long)(result.matured_redeemable ?? 0L);
            long regularRedeemable = (long)(result.regular_redeemable ?? 0L);
            long locked = (long)(result.locked ?? 0L);
            long redeemed = (long)(result.redeemed ?? 0L);
            
            return (locked, maturedRedeemable, maturedRedeemable + regularRedeemable, redeemed);
        }

        public async Task<GoldTransaction?> GetTransactionByPaymentIdAsync(string paymentId)
        {
            return await _context.GoldTransactions
                .Include(t => t.Invoice)
                .FirstOrDefaultAsync(t => t.RazorpayPaymentId == paymentId);
        }

        public async Task<PromotionalOffer?> GetActiveEventOfferAsync(Guid userId)
        {
            var now = DateTime.UtcNow;
            return await _context.PromotionalOffers
                .Where(o => o.IsActive && o.ExpiresAt > now && o.TargetUserId == userId
                    && (o.OfferType == "BIRTHDAY" || o.OfferType == "ANNIVERSARY")
                    && o.BonusPercent > 0)
                .OrderByDescending(o => o.BonusPercent)
                .FirstOrDefaultAsync();
        }

        public async Task<bool> IsOfferClaimedAsync(Guid userId, Guid offerId)
        {
            return await _context.UserClaimedOffers
                .AnyAsync(c => c.UserId == userId && c.OfferId == offerId);
        }

        public async Task RecordClaimedOfferAsync(UserClaimedOffer claimedOffer)
        {
            _context.UserClaimedOffers.Add(claimedOffer);
            await _context.SaveChangesAsync();
        }

        public async Task RecordAuditLogAsync(PlatformAuditLog auditLog)
        {
            _context.PlatformAuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();
        }

        public async Task IncrementBonusGoldBalanceAsync(Guid userId, long bonusGoldMg)
        {
            var holding = await _context.GoldHoldings.FirstOrDefaultAsync(h => h.UserId == userId);
            if (holding == null)
            {
                holding = new GoldHolding { UserId = userId, GoldBalanceMg = 0, BonusGoldBalanceMg = bonusGoldMg, UpdatedAt = DateTimeOffset.UtcNow };
                _context.GoldHoldings.Add(holding);
            }
            else
            {
                holding.BonusGoldBalanceMg += bonusGoldMg;
                holding.UpdatedAt = DateTimeOffset.UtcNow;
                _context.GoldHoldings.Update(holding);
            }
            await _context.SaveChangesAsync();
        }
    }
}
