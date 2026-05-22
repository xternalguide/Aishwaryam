using System;
using System.Threading.Tasks;

namespace Aishwaryam.Application.Interfaces.Services
{
    public interface IGoldPriceManager
    {
        Task<GoldPriceResult> GetPriceAsync();
        Task<string> CreatePriceLockAsync(Guid userId, GoldPriceResult price);
        Task<GoldPriceResult?> GetLockedPriceAsync(string lockId);
    }
}
