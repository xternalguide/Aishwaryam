using System;
using System.Threading.Tasks;
using Aishwaryam.Domain.Entities;

namespace Aishwaryam.Application.Interfaces.Repositories
{
    public interface IGoldRepository
    {
        Task<GoldPriceLog?> GetLatestPriceAsync();
        Task<long> CalculateGoldBalanceAsync(Guid userId);
        Task UpdateGoldCacheAsync(Guid userId, long newBalanceMg);
        Task<GoldTransaction> RecordGoldTransactionAsync(GoldTransaction transaction);
        Task<(long LockedMg, long MaturedRedeemableMg, long RedeemableMg, long RedeemedMg)> GetGoldStatusAsync(Guid userId);
    }
}
