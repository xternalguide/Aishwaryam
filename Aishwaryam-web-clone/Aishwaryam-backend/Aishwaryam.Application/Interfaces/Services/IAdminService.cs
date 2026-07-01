using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Aishwaryam.Application.DTOs.Admin;
using Aishwaryam.Domain.Entities;

namespace Aishwaryam.Application.Interfaces.Services
{
    public interface IAdminService
    {
        Task<OperationalKpisResponse> GetOperationalKpisAsync();
        Task LogAdminActionAsync(string adminEmail, string actionType, string targetEntityId, string notes, string ipAddress);
        Task<IEnumerable<AdminAuditLogResponse>> GetAuditLogsAsync(int limit = 100);
        
        // KYC Operations
        Task<bool> ProcessKycActionAsync(KycActionRequest request);
        
        // User Operations
        Task<bool> ToggleUserActiveAsync(Guid userId, string adminEmail);
        // Reporting
        Task<byte[]> GenerateDailyReconciliationReportAsync(DateTime date);
    }
}
