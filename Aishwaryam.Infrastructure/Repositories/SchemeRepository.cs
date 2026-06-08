using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Aishwaryam.Application.Interfaces.Repositories;
using Aishwaryam.Domain.Entities;
using Aishwaryam.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Aishwaryam.Infrastructure.Repositories
{
    public class SchemeRepository : ISchemeRepository
    {
        private readonly ApplicationDbContext _context;

        public SchemeRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<UserScheme?> GetActiveUserSchemeAsync(Guid userId)
        {
            return await _context.UserSchemes
                .Where(s => s.UserId == userId && (s.Status == "Active" || s.Status == "Matured"))
                .OrderByDescending(s => s.CreatedAt)
                .FirstOrDefaultAsync();
        }

        public async Task<List<UserScheme>> GetActiveUserSchemesAsync(Guid userId)
        {
            return await _context.UserSchemes
                .Where(s => s.UserId == userId && (s.Status == "Active" || s.Status == "Matured" || s.Status == "Claimed"))
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();
        }

        public async Task<UserScheme> UpdateUserSchemeAsync(UserScheme scheme)
        {
            _context.UserSchemes.Update(scheme);
            await _context.SaveChangesAsync();
            return scheme;
        }

        public async Task<List<SchemeMaster>> GetAvailableSchemesAsync()
        {
            return await _context.SchemesMaster
                .Where(s => s.IsActive)
                .OrderBy(s => s.InstallmentAmountPaise)
                .ToListAsync();
        }

        public async Task<SchemeMaster?> GetSchemeMasterByIdAsync(Guid id)
        {
            return await _context.SchemesMaster.FindAsync(id);
        }

        public async Task<UserScheme> JoinSchemeAsync(UserScheme userScheme)
        {
            _context.UserSchemes.Add(userScheme);
            await _context.SaveChangesAsync();
            return userScheme;
        }

        public async Task<List<UserScheme>> GetUserSchemesByStatusAsync(Guid userId, string status)
        {
            return await _context.UserSchemes
                .Where(s => s.UserId == userId && s.Status == status)
                .ToListAsync();
        }

        public async Task<List<UserScheme>> GetSchemesPendingMaturityAsync()
        {
            var nowUnspecified = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
            return await _context.UserSchemes
                .Where(s => s.Status == "Active" && s.MaturityDate <= nowUnspecified)
                .ToListAsync();
        }

        public async Task<List<UserScheme>> GetSchemesByStatusAsync(string status)
        {
            return await _context.UserSchemes
                .Where(s => s.Status == status)
                .ToListAsync();
        }

        public async Task<UserScheme?> GetUserSchemeByIdAsync(Guid schemeId)
        {
            return await _context.UserSchemes.FindAsync(schemeId);
        }

        public async Task<bool> DeleteSchemeMasterAsync(Guid id)
        {
            var scheme = await _context.SchemesMaster.FindAsync(id);
            if (scheme == null) return false;

            _context.SchemesMaster.Remove(scheme);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<SchemeMaster> CreateSchemeMasterAsync(SchemeMaster scheme)
        {
            _context.SchemesMaster.Add(scheme);
            await _context.SaveChangesAsync();
            return scheme;
        }

        public async Task<(long TotalSavingsAdded, long TotalBonusEarned, long TotalBonusGoldMg)> GetSchemeSavingsSummaryAsync(Guid userSchemeId)
        {
            var txs = await _context.GoldTransactions
                .Where(t => t.UserSchemeId == userSchemeId && (t.TransactionType == "BUY" || t.TransactionType == "BONUS"))
                .ToListAsync();

            long totalSavings = txs.Where(t => t.TransactionType == "BUY").Sum(t => t.TotalAmountPaise);
            long totalBonusEarned = txs.Where(t => t.TransactionType == "BUY").Sum(t => t.BonusAmountPaise)
                                   + txs.Where(t => t.TransactionType == "BONUS").Sum(t => (t.GoldWeightMg * t.PricePerGmPaise) / 1000);
            long totalBonusGoldMg = txs.Where(t => t.TransactionType == "BUY").Sum(t => t.BonusGoldMg)
                                    + txs.Where(t => t.TransactionType == "BONUS").Sum(t => t.GoldWeightMg);

            return (totalSavings, totalBonusEarned, totalBonusGoldMg);
        }

        public async Task<SchemeInvestment> RecordSchemeInvestmentAsync(SchemeInvestment investment)
        {
            _context.SchemeInvestments.Add(investment);
            await _context.SaveChangesAsync();
            return investment;
        }

        public async Task<List<SchemeInvestment>> GetSchemeLedgerAsync(Guid userSchemeId)
        {
            return await _context.SchemeInvestments
                .Where(t => t.UserSchemeId == userSchemeId)
                .OrderBy(t => t.CreatedAt)
                .ToListAsync();
        }

        public async Task<SchemeRedemption> RecordSchemeRedemptionAsync(SchemeRedemption redemption)
        {
            _context.SchemeRedemptions.Add(redemption);
            await _context.SaveChangesAsync();
            return redemption;
        }

        public async Task<RedemptionStatusHistory> RecordRedemptionStatusHistoryAsync(RedemptionStatusHistory history)
        {
            _context.RedemptionStatusHistories.Add(history);
            await _context.SaveChangesAsync();
            return history;
        }

        public async Task<SchemeRedemption?> GetSchemeRedemptionByIdAsync(Guid id)
        {
            return await _context.SchemeRedemptions.FindAsync(id);
        }

        public async Task<SchemeRedemption> UpdateSchemeRedemptionAsync(SchemeRedemption redemption)
        {
            _context.SchemeRedemptions.Update(redemption);
            await _context.SaveChangesAsync();
            return redemption;
        }

        public async Task<List<SchemeBonusTier>> GetBonusTiersAsync(Guid schemeMasterId)
        {
            return await _context.SchemeBonusTiers
                .Where(t => t.SchemeMasterId == schemeMasterId)
                .OrderBy(t => t.StartDay)
                .ToListAsync();
        }
        public async Task<List<SchemeRedemption>> GetPendingRedemptionsAsync()
        {
            return await _context.SchemeRedemptions
                .Where(r => r.Status == "PENDING")
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<SchemeMaster> UpdateSchemeMasterAsync(SchemeMaster scheme)
        {
            _context.SchemesMaster.Update(scheme);
            await _context.SaveChangesAsync();
            return scheme;
        }

        public async Task SaveBonusTiersAsync(Guid schemeMasterId, List<SchemeBonusTier> tiers)
        {
            var existing = await _context.SchemeBonusTiers
                .Where(t => t.SchemeMasterId == schemeMasterId)
                .ToListAsync();
            _context.SchemeBonusTiers.RemoveRange(existing);

            foreach (var tier in tiers)
            {
                tier.SchemeMasterId = schemeMasterId;
                if (tier.Id == Guid.Empty) tier.Id = Guid.NewGuid();
                _context.SchemeBonusTiers.Add(tier);
            }

            await _context.SaveChangesAsync();
        }

        public async Task<SchemeMaster?> GetSchemeMasterByPlanNameAsync(string planName)
        {
            return await _context.SchemesMaster
                .Where(s => s.PlanName == planName)
                .OrderByDescending(s => s.CreatedAt)
                .FirstOrDefaultAsync();
        }

        public async Task<List<SchemeMaster>> GetAllSchemeMastersAdminAsync()
        {
            return await _context.SchemesMaster
                .OrderBy(s => s.InstallmentAmountPaise)
                .ToListAsync();
        }

        public async Task<(List<UserScheme> Enrollments, int Total)> GetEnrollmentsPaginatedAsync(int page, int pageSize)
        {
            var query = _context.UserSchemes;
            var total = await query.CountAsync();
            var enrollments = await query
                .OrderByDescending(s => s.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
            return (enrollments, total);
        }
    }
}
