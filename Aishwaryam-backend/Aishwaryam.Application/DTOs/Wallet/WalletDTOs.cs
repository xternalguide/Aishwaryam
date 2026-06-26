using System;

namespace Aishwaryam.Application.DTOs.Wallet
{
    public class WalletTransactionRequest
    {
        public Guid UserId { get; set; }
        public long AmountPaise { get; set; }
        public string TransactionType { get; set; } = string.Empty; // CREDIT, DEBIT
        public string ReferenceId { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string IpAddress { get; set; } = string.Empty;
        public string DeviceFingerprint { get; set; } = string.Empty;
    }

    public class WalletBalanceResponse
    {
        public Guid UserId { get; set; }
        public long BalancePaise { get; set; }
    }
}
