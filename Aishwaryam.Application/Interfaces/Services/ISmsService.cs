using System.Threading.Tasks;

namespace Aishwaryam.Application.Interfaces.Services
{
    public interface ISmsService
    {
        Task<bool> SendSmsAsync(string phoneNumber, string message);
    }
}
