using System;
using System.Threading.Tasks;

namespace Aishwaryam.Application.Interfaces.Services
{
    public interface IReceiptPdfGenerator
    {
        Task<byte[]> GenerateReceiptPdfAsync(Guid transactionId);
    }
}
