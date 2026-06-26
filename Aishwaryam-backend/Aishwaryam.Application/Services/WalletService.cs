using System;
using System.Threading.Tasks;
using Aishwaryam.Application.DTOs.Wallet;
using Aishwaryam.Application.Interfaces.Repositories;
using Aishwaryam.Application.Interfaces.Services;
using Aishwaryam.Domain.Entities;

namespace Aishwaryam.Application.Services
{
    public class WalletService : IWalletService
    {
        private readonly IWalletLedgerRepository _walletLedgerRepository;

        public WalletService(IWalletLedgerRepository walletLedgerRepository)
        {
            _walletLedgerRepository = walletLedgerRepository;
        }

        public async Task<WalletBalanceResponse> GetBalanceAsync(Guid userId)
        {
            long balance = await _walletLedgerRepository.CalculateBalanceAsync(userId);
            
            return new WalletBalanceResponse
            {
                UserId = userId,
                BalancePaise = balance
            };
        }

        public async Task<WalletBalanceResponse> ProcessTransactionAsync(WalletTransactionRequest request)
        {
            // 1. Immutable append to Ledger
            var ledgerEntry = new WalletLedger
            {
                UserId = request.UserId,
                TransactionType = request.TransactionType, // "CREDIT" or "DEBIT"
                AmountPaise = request.AmountPaise,
                ReferenceId = request.ReferenceId,
                Description = request.Description,
                IpAddress = request.IpAddress,
                DeviceFingerprint = request.DeviceFingerprint
            };

            await _walletLedgerRepository.RecordTransactionAsync(ledgerEntry);

            // 2. Re-calculate absolute truth balance using Dapper
            long updatedBalance = await _walletLedgerRepository.CalculateBalanceAsync(request.UserId);

            // 3. Update the read-replica cache
            await _walletLedgerRepository.UpdateWalletCacheAsync(request.UserId, updatedBalance);

            return new WalletBalanceResponse
            {
                UserId = request.UserId,
                BalancePaise = updatedBalance
            };
        }
    }
}
