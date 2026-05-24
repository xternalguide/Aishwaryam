using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Aishwaryam.Application.Interfaces.Repositories;
using Aishwaryam.Domain.Entities;
using Aishwaryam.Infrastructure.Data;

namespace Aishwaryam.Infrastructure.Repositories
{
    public class BankingRepository : IBankingRepository
    {
        private readonly ApplicationDbContext _context;

        public BankingRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<BankAccount> AddBankAccountAsync(BankAccount account)
        {
            _context.BankAccounts.Add(account);
            await _context.SaveChangesAsync();
            return account;
        }

        public async Task<List<BankAccount>> GetUserBankAccountsAsync(Guid userId)
        {
            return await _context.BankAccounts
                .Where(b => b.UserId == userId)
                .ToListAsync();
        }

        public async Task<WithdrawalRequest> AddWithdrawalRequestAsync(WithdrawalRequest request)
        {
            _context.WithdrawalRequests.Add(request);
            await _context.SaveChangesAsync();
            return request;
        }

        public async Task<Payment?> GetPaymentByOrderIdAsync(string orderId)
        {
            return await _context.Payments.FirstOrDefaultAsync(p => p.ProviderOrderId == orderId);
        }

        public async Task UpdatePaymentAsync(Payment payment)
        {
            _context.Payments.Update(payment);
            await _context.SaveChangesAsync();
        }

        public async Task<Payment> AddPaymentAsync(Payment payment)
        {
            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();
            return payment;
        }
    }
}
