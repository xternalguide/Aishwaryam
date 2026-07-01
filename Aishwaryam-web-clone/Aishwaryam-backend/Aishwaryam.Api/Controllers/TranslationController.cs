using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Aishwaryam.Application.Interfaces.Services;

namespace Aishwaryam.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TranslationController : ControllerBase
    {
        private readonly ITranslationService _translationService;

        public TranslationController(ITranslationService translationService)
        {
            _translationService = translationService;
        }

        [HttpPost("translate")]
        public async Task<IActionResult> Translate([FromBody] TranslationRequestDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Text))
            {
                return BadRequest(new { Message = "Text to translate is required." });
            }

            try
            {
                var translatedText = await _translationService.TranslateAsync(
                    request.Text, 
                    request.Source ?? "en", 
                    request.Target ?? "ta"
                );

                return Ok(new
                {
                    TranslatedText = translatedText,
                    Success = true
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Message = "Translation failed.",
                    Error = ex.Message,
                    Success = false
                });
            }
        }
    }

    public class TranslationRequestDto
    {
        public string Text { get; set; } = string.Empty;
        public string Source { get; set; } = "en";
        public string Target { get; set; } = "ta";
    }
}
