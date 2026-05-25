using System.Threading.Tasks;

namespace Aishwaryam.Application.Interfaces.Services
{
    public interface ISmsService
    {
        Task<(bool Success, string ErrorMessage)> SendSmsAsync(string phoneNumber, string message);
    }
}
