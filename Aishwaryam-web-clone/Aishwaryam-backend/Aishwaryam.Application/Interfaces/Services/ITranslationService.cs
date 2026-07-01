using System.Threading.Tasks;

namespace Aishwaryam.Application.Interfaces.Services
{
    public interface ITranslationService
    {
        Task<string> TranslateToTamilAsync(string text);
        Task<string> TranslateAsync(string text, string sourceLanguage, string targetLanguage);
    }
}
