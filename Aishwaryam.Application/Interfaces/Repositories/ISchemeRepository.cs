using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Aishwaryam.Domain.Entities;

namespace Aishwaryam.Application.Interfaces.Repositories
{
    public interface ISchemeRepository
    {
        Task<UserScheme?> GetActiveUserSchemeAsync(Guid userId);
        Task<List<UserScheme>> GetActiveUserSchemesAsync(Guid userId);
        Task<UserScheme> UpdateUserSchemeAsync(UserScheme scheme);
        Task<List<SchemeMaster>> GetAvailableSchemesAsync();
        Task<SchemeMaster?> GetSchemeMasterByIdAsync(Guid id);
        Task<UserScheme> JoinSchemeAsync(UserScheme userScheme);
        Task<List<UserScheme>> GetUserSchemesByStatusAsync(Guid userId, string status);
        Task<List<UserScheme>> GetSchemesPendingMaturityAsync();
        Task<List<UserScheme>> GetSchemesByStatusAsync(string status);
        Task<UserScheme?> GetUserSchemeByIdAsync(Guid schemeId);
        Task<bool> DeleteSchemeMasterAsync(Guid id);
        Task<SchemeMaster> CreateSchemeMasterAsync(SchemeMaster scheme);
        Task<SchemeMaster> UpdateSchemeMasterAsync(SchemeMaster scheme);
        Task SaveBonusTiersAsync(Guid schemeMasterId, List<SchemeBonusTier> tiers);
        Task<SchemeMaster?> GetSchemeMasterByPlanNameAsync(string planName);
        Task<List<SchemeMaster>> GetAllSchemeMastersAdminAsync();
        Task<(long TotalSavingsAdded, long TotalBonusEarned, long TotalBonusGoldMg)> GetSchemeSavingsSummaryAsync(Guid userSchemeId);
        Task<SchemeInvestment> RecordSchemeInvestmentAsync(SchemeInvestment investment);
        Task<List<SchemeInvestment>> GetSchemeLedgerAsync(Guid userSchemeId);
        Task<SchemeRedemption> RecordSchemeRedemptionAsync(SchemeRedemption redemption);
        Task<RedemptionStatusHistory> RecordRedemptionStatusHistoryAsync(RedemptionStatusHistory history);
        Task<SchemeRedemption?> GetSchemeRedemptionByIdAsync(Guid id);
        Task<SchemeRedemption> UpdateSchemeRedemptionAsync(SchemeRedemption redemption);
        Task<List<SchemeBonusTier>> GetBonusTiersAsync(Guid schemeMasterId);
        Task<List<SchemeRedemption>> GetPendingRedemptionsAsync();
        Task<(List<UserScheme> Enrollments, int Total)> GetEnrollmentsPaginatedAsync(int page, int pageSize);
    }
}
