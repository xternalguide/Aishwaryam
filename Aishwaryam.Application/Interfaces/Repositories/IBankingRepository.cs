using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Aishwaryam.Domain.Entities;

namespace Aishwaryam.Application.Interfaces.Repositories
{
    public interface IBankingRepository
    {
        Task<BankAccount> AddBankAccountAsync(BankAccount account);
        Task<List<BankAccount>> GetUserBankAccountsAsync(Guid userId);
        Task<WithdrawalRequest> AddWithdrawalRequestAsync(WithdrawalRequest request);
        Task<Payment?> GetPaymentByOrderIdAsync(string orderId);
        Task UpdatePaymentAsync(Payment payment);
    }
}
