using System;
using System.Threading.Tasks;
using Aishwaryam.Application.DTOs.Gold;

namespace Aishwaryam.Application.Interfaces.Services
{
    public interface IGoldService
    {
        Task<CurrentGoldPriceResponse> GetCurrentPriceAsync();
        Task<GoldTransactionResponse> BuyGoldAsync(BuyGoldRequest request);
        Task<GoldTransactionResponse> SellGoldAsync(SellGoldRequest request);
        Task<(long LockedMg, long MaturedRedeemableMg, long RedeemableMg, long RedeemedMg)> GetGoldStatusAsync(Guid userId);
    }
}
