using System;
using System.Threading.Tasks;
using Aishwaryam.Application.DTOs.Gold;

namespace Aishwaryam.Application.Interfaces.Services
{
    public interface IPaymentFulfillmentService
    {
        /// <summary>
        /// Fulfills a payment by crediting the wallet and purchasing gold.
        /// This method is idempotent and handles database transactions.
        /// </summary>
        Task<GoldTransactionResponse> FulfillPaymentAsync(string razorpayOrderId, string razorpayPaymentId, string source);
    }
}
