using System;

namespace Aishwaryam.Application.DTOs.Gold
{
    public class BuyGoldRequest
    {
        public Guid UserId { get; set; }
        public Guid? UserSchemeId { get; set; } // Specific scheme to allocate gold
        public long TotalAmountPaise { get; set; } // The INR amount they want to spend
        public string IpAddress { get; set; } = string.Empty;
        public string DeviceFingerprint { get; set; } = string.Empty;
        public string? PriceLockId { get; set; }
        public string? RazorpayPaymentId { get; set; }
        public bool SkipEmail { get; set; }
        public bool SkipNotification { get; set; }
        public string? BaseUrl { get; set; }
    }

    public class SellGoldRequest
    {
        public Guid UserId { get; set; }
        public long GoldWeightMg { get; set; } // The Gold weight they want to sell
        public string IpAddress { get; set; } = string.Empty;
        public string DeviceFingerprint { get; set; } = string.Empty;
        public string? PriceLockId { get; set; }
    }

    public class GoldTransactionResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public long GoldWeightMg { get; set; }
        public long PricePerGmPaise { get; set; }
        public long TotalAmountPaise { get; set; }
        public long BaseAmountPaise { get; set; }
        public long GstAmountPaise { get; set; }
        public decimal BonusPercentage { get; set; }
        public long BonusAmountPaise { get; set; }
        public long BonusGoldMg { get; set; }
        public long TotalGoldCreditedMg { get; set; }
        public long NewWalletBalancePaise { get; set; }
        public long NewGoldBalanceMg { get; set; }
        public long LockedGoldMg { get; set; }
        public long MaturedRedeemableGoldMg { get; set; }
        public long RedeemableGoldMg { get; set; }
        public string TransactionId { get; set; } = string.Empty;
        public long RedeemedGoldMg { get; set; }
    }

    public class CurrentGoldPriceResponse
    {
        public long BuyPricePaise { get; set; }
        public long SellPricePaise { get; set; }
        public long Price24KPaise { get; set; }
        public long Price22KPaise { get; set; }
        public long PriceSilverPaise { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
        public string Source { get; set; } = "Live";
        public bool IsFallback { get; set; } = false;
    }
}
