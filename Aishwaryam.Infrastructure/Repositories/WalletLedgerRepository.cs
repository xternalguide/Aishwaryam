using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Dapper;
using Aishwaryam.Application.Interfaces.Repositories;
using Aishwaryam.Domain.Entities;
using Aishwaryam.Infrastructure.Data;

namespace Aishwaryam.Infrastructure.Repositories
{
    public class WalletLedgerRepository : IWalletLedgerRepository
    {
        private readonly ApplicationDbContext _context;

        public WalletLedgerRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<WalletLedger> RecordTransactionAsync(WalletLedger transaction)
        {
            _context.WalletLedgers.Add(transaction);
            await _context.SaveChangesAsync();
            return transaction;
        }

        public async Task<long> CalculateBalanceAsync(Guid userId)
        {
            var connection = _context.Database.GetDbConnection();
            
            var sql = @"
                SELECT COALESCE(SUM(
                    CASE 
                        WHEN transaction_type = 'CREDIT' THEN amount_paise 
                        WHEN transaction_type = 'DEBIT' THEN -amount_paise 
                        ELSE 0 
                    END
                ), 0)
                FROM wallet_ledger
                WHERE user_id = @UserId";

            var balance = await connection.QuerySingleAsync<long>(sql, new { UserId = userId });
            return balance;
        }

        public async Task<IEnumerable<WalletLedger>> GetUserTransactionsAsync(Guid userId)
        {
            var connection = _context.Database.GetDbConnection();
            
            var sql = @"
                SELECT id, user_id as UserId, transaction_type as TransactionType, 
                       amount_paise as AmountPaise, reference_id as ReferenceId, 
                       description as Description, ip_address as IpAddress, 
                       device_fingerprint as DeviceFingerprint, created_at as CreatedAt
                FROM wallet_ledger
                WHERE user_id = @UserId
                ORDER BY created_at DESC";

            return await connection.QueryAsync<WalletLedger>(sql, new { UserId = userId });
        }

        public async Task UpdateWalletCacheAsync(Guid userId, long newBalance)
        {
            var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == userId);
            
            if (wallet == null)
            {
                wallet = new Wallet { UserId = userId, InrBalancePaise = newBalance, UpdatedAt = DateTimeOffset.UtcNow };
                _context.Wallets.Add(wallet);
            }
            else
            {
                wallet.InrBalancePaise = newBalance;
                wallet.UpdatedAt = DateTimeOffset.UtcNow;
                _context.Wallets.Update(wallet);
            }

            await _context.SaveChangesAsync();
        }
    }
}
