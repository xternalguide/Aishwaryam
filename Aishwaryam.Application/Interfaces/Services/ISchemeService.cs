using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Aishwaryam.Domain.Entities;

namespace Aishwaryam.Application.Interfaces.Services
{
    public interface ISchemeService
    {
        Task<IEnumerable<SchemeMaster>> GetAvailableSchemesAsync();
        Task<object> GetUserSchemeDashboardAsync(Guid userId);
        Task<object> JoinSchemeAsync(Guid userId, Guid schemeMasterId);
        Task<bool> ToggleAutoPayAsync(Guid userId, Guid schemeId, bool enableAutoPay);
        Task<(IEnumerable<object> Enrollments, int Total)> GetAllEnrollmentsAsync(int page, int pageSize);
        Task ProcessMaturityAsync(); // Background job entry point
        Task<object> GetMaturitySummaryAsync(Guid schemeId);
        Task<bool> ClaimMaturedSchemeAsync(Guid userId, Guid schemeId);
        Task<IEnumerable<object>> GetMaturedSchemesForAdminAsync();
        Task<bool> DeleteSchemeMasterAsync(Guid id);
        Task<SchemeMaster> CreateSchemeMasterAsync(SchemeMaster scheme, List<SchemeBonusTier>? tiers = null);
        Task<SchemeMaster> UpdateSchemeMasterAsync(SchemeMaster scheme, List<SchemeBonusTier>? tiers = null);
        Task<IEnumerable<SchemeMaster>> GetAllSchemeMastersAdminAsync();
        
        // Phase 3 Scheme Ledger & Redemption Engine
        Task<object> InvestInSchemeAsync(Guid userId, Guid schemeId, long amountPaise, string? razorpayPaymentId, string ipAddress, string deviceFingerprint);
        Task<object> GetSchemeProgressAsync(Guid schemeId);
        Task<IEnumerable<SchemeInvestment>> GetSchemeLedgerAsync(Guid schemeId);
        Task<object> RequestRedemptionAsync(Guid userId, Guid schemeId, string redemptionType, string? address);
        Task<bool> ApproveRedemptionAsync(Guid redemptionId, string? adminId, string? notes);
        Task<bool> RejectRedemptionAsync(Guid redemptionId, string? adminId, string reason);
        Task<IEnumerable<object>> GetPendingRedemptionsForAdminAsync();
    }
}
