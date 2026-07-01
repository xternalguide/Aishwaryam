using System;
using System.Threading.Tasks;
using Aishwaryam.Application.DTOs.Banking;
using Aishwaryam.Application.DTOs.Wallet;
using Aishwaryam.Application.Interfaces.Repositories;
using Aishwaryam.Application.Interfaces.Services;
using Aishwaryam.Domain.Entities;

namespace Aishwaryam.Application.Services
{
    public class BankingService : IBankingService
    {
        private readonly IBankingRepository _bankingRepository;
        private readonly IWalletService _walletService;

        public BankingService(IBankingRepository bankingRepository, IWalletService walletService)
        {
            _bankingRepository = bankingRepository;
            _walletService = walletService;
        }

        public async Task<BankingResponse> AddBankAccountAsync(AddBankAccountRequest request)
        {
            var account = new BankAccount
            {
                UserId = request.UserId,
                AccountNumberEncrypted = request.AccountNumber, // Mock encryption
                IfscCode = request.IfscCode,
                BankName = request.BankName,
                IsVerified = false // Needs verification (e.g. penny drop)
            };

            await _bankingRepository.AddBankAccountAsync(account);

            return new BankingResponse
            {
                Success = true,
                Message = "Bank account added successfully."
            };
        }

        public async Task<BankingResponse> RequestWithdrawalAsync(WithdrawalRequestDto request)
        {
            // 1. Check Wallet Balance
            var walletResponse = await _walletService.GetBalanceAsync(request.UserId);
            if (walletResponse.BalancePaise < request.AmountPaise)
            {
                return new BankingResponse { Success = false, Message = "Insufficient wallet balance for withdrawal." };
            }

            // 2. Deduct from Wallet (HOLD / WITHDRAWAL_INITIATED)
            var walletTx = await _walletService.ProcessTransactionAsync(new WalletTransactionRequest
            {
                UserId = request.UserId,
                AmountPaise = request.AmountPaise,
                TransactionType = "DEBIT",
                ReferenceId = "WITHDRAW_" + Guid.NewGuid().ToString("N").Substring(0, 8),
                Description = $"Withdrawal to Bank Account",
                IpAddress = request.IpAddress,
                DeviceFingerprint = "backend_service"
            });

            // 3. Create Withdrawal Request
            var withdrawalRequest = new WithdrawalRequest
            {
                UserId = request.UserId,
                BankAccountId = request.BankAccountId,
                AmountPaise = request.AmountPaise,
                Status = "PENDING",
                IpAddress = request.IpAddress
            };

            await _bankingRepository.AddWithdrawalRequestAsync(withdrawalRequest);

            return new BankingResponse
            {
                Success = true,
                Message = "Withdrawal request initiated successfully."
            };
        }

        public async Task<System.Collections.Generic.List<BankAccountDto>> GetBankAccountsAsync(Guid userId)
        {
            var accounts = await _bankingRepository.GetUserBankAccountsAsync(userId);
            var dtos = new System.Collections.Generic.List<BankAccountDto>();

            foreach(var acc in accounts)
            {
                // Mask account number to show only last 4 digits
                var masked = new string('*', Math.Max(0, acc.AccountNumberEncrypted.Length - 4)) 
                             + acc.AccountNumberEncrypted.Substring(Math.Max(0, acc.AccountNumberEncrypted.Length - 4));
                
                dtos.Add(new BankAccountDto
                {
                    Id = acc.Id,
                    BankName = acc.BankName,
                    AccountNumberMasked = masked,
                    IfscCode = acc.IfscCode,
                    IsVerified = acc.IsVerified
                });
            }

            return dtos;
        }
    }
}
