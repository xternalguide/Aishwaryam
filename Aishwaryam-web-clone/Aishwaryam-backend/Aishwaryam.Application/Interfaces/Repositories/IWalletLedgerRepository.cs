using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Aishwaryam.Domain.Entities;

namespace Aishwaryam.Application.Interfaces.Repositories
{
    public interface IWalletLedgerRepository
    {
        // EF Core mapping for immutable writes
        Task<WalletLedger> RecordTransactionAsync(WalletLedger transaction);
        
        // Dapper for fast ledger calculation
        Task<long> CalculateBalanceAsync(Guid userId);
        
        // Dapper for fast list retrieval
        Task<IEnumerable<WalletLedger>> GetUserTransactionsAsync(Guid userId);
        
        // EF Core read replica update
        Task UpdateWalletCacheAsync(Guid userId, long newBalance);
    }
}
