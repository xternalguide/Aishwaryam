using System;

namespace Aishwaryam.Application.DTOs.Banking
{
    public class AddBankAccountRequest
    {
        public Guid UserId { get; set; }
        public string AccountHolderName { get; set; } = string.Empty;
        public string AccountNumber { get; set; } = string.Empty;
        public string IfscCode { get; set; } = string.Empty;
        public string BankName { get; set; } = string.Empty;
    }

    public class WithdrawalRequestDto
    {
        public Guid UserId { get; set; }
        public Guid BankAccountId { get; set; }
        public long AmountPaise { get; set; }
        public string IpAddress { get; set; } = string.Empty;
    }

    public class BankingResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class BankAccountDto
    {
        public Guid Id { get; set; }
        public string BankName { get; set; } = string.Empty;
        public string AccountNumberMasked { get; set; } = string.Empty;
        public string IfscCode { get; set; } = string.Empty;
        public bool IsVerified { get; set; }
    }
}
