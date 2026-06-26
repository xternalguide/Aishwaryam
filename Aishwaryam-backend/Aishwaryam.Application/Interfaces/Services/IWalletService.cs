using System;
using System.Threading.Tasks;
using Aishwaryam.Application.DTOs.Wallet;

namespace Aishwaryam.Application.Interfaces.Services
{
    public interface IWalletService
    {
        Task<WalletBalanceResponse> GetBalanceAsync(Guid userId);
        Task<WalletBalanceResponse> ProcessTransactionAsync(WalletTransactionRequest request);
    }
}
