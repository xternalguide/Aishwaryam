using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Aishwaryam.Application.Interfaces.Repositories;
using Aishwaryam.Domain.Entities;
using Aishwaryam.Infrastructure.Data;
using Dapper;

namespace Aishwaryam.Infrastructure.Repositories
{
    public class AdminRepository : IAdminRepository
    {
        private readonly ApplicationDbContext _context;

        public AdminRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task LogAdminActionAsync(AdminAuditLog log)
        {
            var connection = _context.Database.GetDbConnection();
            var query = @"
                INSERT INTO admin_audit_logs 
                (id, admin_email, action_type, target_entity_id, notes, ip_address, created_at) 
                VALUES (@Id, @AdminEmail, @ActionType, @TargetEntityId, @Notes, @IpAddress, @CreatedAt)";
            
            await connection.ExecuteAsync(query, log);
        }

        public async Task<IEnumerable<AdminAuditLog>> GetAuditLogsAsync(int limit)
        {
            var connection = _context.Database.GetDbConnection();
            var query = @"
                SELECT id, admin_email as AdminEmail, action_type as ActionType, 
                       target_entity_id as TargetEntityId, notes as Notes, 
                       ip_address as IpAddress, created_at as CreatedAt 
                FROM admin_audit_logs 
                ORDER BY created_at DESC 
                LIMIT @Limit";
            
            return await connection.QueryAsync<AdminAuditLog>(query, new { Limit = limit });
        }

        public async Task<int> GetTotalUsersCountAsync()
        {
            var connection = _context.Database.GetDbConnection();
            return await connection.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM users");
        }

        public async Task<int> GetKycPendingCountAsync()
        {
            var connection = _context.Database.GetDbConnection();
            return await connection.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM users WHERE kyc_level = 'PENDING'");
        }

        public async Task<int> GetKycVerifiedCountAsync()
        {
            var connection = _context.Database.GetDbConnection();
            return await connection.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM users WHERE kyc_level IN ('FULL', 'VERIFIED')");
        }

        public async Task<int> GetHighValueInvestorsCountAsync()
        {
            var connection = _context.Database.GetDbConnection();
            // Assuming high value is > 100g (100,000 mg)
            return await connection.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM gold_holdings WHERE gold_balance_mg > 100000");
        }

        public async Task<long> GetTotalGoldLiabilityMgAsync()
        {
            var connection = _context.Database.GetDbConnection();
            return await connection.ExecuteScalarAsync<long?>("SELECT SUM(gold_balance_mg) FROM gold_holdings") ?? 0;
        }

        public async Task<int> GetActiveSchemesCountAsync()
        {
            var connection = _context.Database.GetDbConnection();
            return await connection.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM user_schemes WHERE status = 'ACTIVE'");
        }

        public async Task<int> GetFailedPayments24hCountAsync()
        {
            // Placeholder: Assuming we have a payment_logs table or checking transactions.
            // Right now, we might not have a dedicated failed payments table with timestamps natively implemented in Dapper context, 
            // but we can query `wallet_transactions` or `gold_transactions` if we stored failures.
            // Returning 0 for now as stub.
            return await Task.FromResult(0);
        }

        public async Task<int> GetPendingRedemptionsCountAsync()
        {
            var connection = _context.Database.GetDbConnection();
            return await connection.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM scheme_redemptions WHERE status = 'PENDING'");
        }
    }
}
