using System.Collections.Generic;
using System.Threading.Tasks;
using Aishwaryam.Domain.Entities;

namespace Aishwaryam.Application.Interfaces.Repositories
{
    public interface IAdminRepository
    {
        Task LogAdminActionAsync(AdminAuditLog log);
        Task<IEnumerable<AdminAuditLog>> GetAuditLogsAsync(int limit);
        
        // Aggregate Methods for Dashboard
        Task<int> GetTotalUsersCountAsync();
        Task<int> GetKycPendingCountAsync();
        Task<int> GetKycVerifiedCountAsync();
        Task<int> GetHighValueInvestorsCountAsync();
        Task<long> GetTotalGoldLiabilityMgAsync();
        Task<int> GetActiveSchemesCountAsync();
        Task<int> GetFailedPayments24hCountAsync();
        Task<int> GetPendingRedemptionsCountAsync();
        Task<IEnumerable<Aishwaryam.Application.DTOs.Admin.PaymentReportItem>> GetDailyPaymentsReportAsync(DateTime date);
    }
}
