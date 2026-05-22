using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Aishwaryam.Application.DTOs.Banking;

namespace Aishwaryam.Application.Interfaces.Services
{
    public interface IBankingService
    {
        Task<BankingResponse> AddBankAccountAsync(AddBankAccountRequest request);
        Task<BankingResponse> RequestWithdrawalAsync(WithdrawalRequestDto request);
        Task<List<BankAccountDto>> GetBankAccountsAsync(Guid userId);
    }
}
