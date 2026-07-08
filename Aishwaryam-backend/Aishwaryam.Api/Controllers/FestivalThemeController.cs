using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Aishwaryam.Infrastructure.Data;
using Aishwaryam.Domain.Entities;

namespace Aishwaryam.Api.Controllers
{
    [ApiController]
    [Route("api/themes")]
    public class FestivalThemeController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public FestivalThemeController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/themes
        [HttpGet]
        public async Task<IActionResult> GetThemes()
        {
            var themes = await _context.FestivalThemes
                .OrderBy(t => t.IsSystemDefault ? 0 : 1)
                .ThenBy(t => t.Name)
                .ToListAsync();
            return Ok(themes);
        }

        // GET: api/themes/active
        [HttpGet("active")]
        public async Task<IActionResult> GetActiveTheme()
        {
            var today = DateTimeOffset.UtcNow;
            var month = today.Month;
            var day = today.Day;

            // 1. Check for one-shot scheduled themes active today
            var scheduledTheme = await _context.FestivalThemes
                .Where(t => t.StartDate != null && t.EndDate != null && t.StartDate <= today && today <= t.EndDate)
                .FirstOrDefaultAsync();

            if (scheduledTheme != null)
            {
                return Ok(scheduledTheme);
            }

            // 2. Check for recurring annual themes active today
            var recurringThemes = await _context.FestivalThemes
                .Where(t => t.IsRecurring && t.StartMonth != null && t.StartDay != null && t.EndMonth != null && t.EndDay != null)
                .ToListAsync();

            foreach (var theme in recurringThemes)
            {
                if (!theme.StartMonth.HasValue || !theme.StartDay.HasValue || !theme.EndMonth.HasValue || !theme.EndDay.HasValue)
                {
                    continue;
                }

                bool isActive = false;
                var sm = theme.StartMonth.Value;
                var sd = theme.StartDay.Value;
                var em = theme.EndMonth.Value;
                var ed = theme.EndDay.Value;

                if (sm == em)
                {
                    isActive = (month == sm && day >= sd && day <= ed);
                }
                else if (sm < em)
                {
                    isActive = (month == sm && day >= sd) || (month == em && day <= ed) || (month > sm && month < em);
                }
                else // wraps over Dec-Jan (e.g. Dec 25 to Jan 5)
                {
                    isActive = (month == sm && day >= sd) || (month == em && day <= ed) || (month > sm) || (month < em);
                }

                if (isActive)
                {
                    return Ok(theme);
                }
            }

            // 3. Fallback to manually activated theme in AppConfigs
            var config = await _context.AppConfigs.FirstOrDefaultAsync();
            if (config != null)
            {
                var manualTheme = await _context.FestivalThemes
                    .FirstOrDefaultAsync(t => t.Id == config.ActiveThemeId);
                if (manualTheme != null)
                {
                    return Ok(manualTheme);
                }
            }

            // 4. Ultimate fallback to system default
            var defaultTheme = await _context.FestivalThemes
                .FirstOrDefaultAsync(t => t.IsSystemDefault);
            if (defaultTheme != null)
            {
                return Ok(defaultTheme);
            }

            return NotFound("No active theme configured.");
        }

        // POST: api/themes/{id}/activate
        [HttpPost("{id}/activate")]
        public async Task<IActionResult> ActivateTheme(string id)
        {
            var theme = await _context.FestivalThemes.FindAsync(id);
            if (theme == null)
            {
                return NotFound("Theme not found.");
            }

            var config = await _context.AppConfigs.FirstOrDefaultAsync();
            if (config == null)
            {
                config = new AppConfig();
                _context.AppConfigs.Add(config);
            }

            config.ActiveThemeId = id;
            config.UpdatedAt = DateTimeOffset.UtcNow;
            
            await _context.SaveChangesAsync();
            return Ok(new { Message = $"Theme '{theme.Name}' activated successfully.", Success = true });
        }

        // POST: api/themes
        [HttpPost]
        public async Task<IActionResult> CreateTheme([FromBody] FestivalTheme theme)
        {
            if (string.IsNullOrEmpty(theme.Id))
            {
                return BadRequest("Theme ID is required.");
            }

            var existing = await _context.FestivalThemes.FindAsync(theme.Id);
            if (existing != null)
            {
                return BadRequest("Theme ID already exists.");
            }

            theme.CreatedAt = DateTimeOffset.UtcNow;
            theme.UpdatedAt = DateTimeOffset.UtcNow;

            _context.FestivalThemes.Add(theme);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetThemes), new { id = theme.Id }, theme);
        }

        // PUT: api/themes/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTheme(string id, [FromBody] FestivalTheme request)
        {
            var theme = await _context.FestivalThemes.FindAsync(id);
            if (theme == null)
            {
                return NotFound("Theme not found.");
            }

            theme.Name = request.Name;
            theme.Description = request.Description;
            theme.PrimaryColorHex = request.PrimaryColorHex;
            theme.SecondaryColorHex = request.SecondaryColorHex;
            theme.StatusBarColorHex = request.StatusBarColorHex;
            theme.SplashBgColorHex = request.SplashBgColorHex;
            
            theme.SplashIllustrationUrl = request.SplashIllustrationUrl;
            theme.LoginIllustrationUrl = request.LoginIllustrationUrl;
            theme.HomeIllustrationUrl = request.HomeIllustrationUrl;
            theme.SidebarIllustrationUrl = request.SidebarIllustrationUrl;
            theme.WelcomeBannerUrl = request.WelcomeBannerUrl;
            
            theme.DecorationsJson = request.DecorationsJson;
            theme.LottieAnimationsJson = request.LottieAnimationsJson;
            
            theme.StartDate = request.StartDate;
            theme.EndDate = request.EndDate;
            theme.IsRecurring = request.IsRecurring;
            theme.StartMonth = request.StartMonth;
            theme.StartDay = request.StartDay;
            theme.EndMonth = request.EndMonth;
            theme.EndDay = request.EndDay;
            
            theme.UpdatedAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(theme);
        }

        // DELETE: api/themes/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTheme(string id)
        {
            var theme = await _context.FestivalThemes.FindAsync(id);
            if (theme == null)
            {
                return NotFound("Theme not found.");
            }

            if (theme.IsSystemDefault)
            {
                return BadRequest("Cannot delete system default theme.");
            }

            // If active, reset config to default
            var config = await _context.AppConfigs.FirstOrDefaultAsync();
            if (config != null && config.ActiveThemeId == id)
            {
                config.ActiveThemeId = "default";
            }

            _context.FestivalThemes.Remove(theme);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Theme deleted successfully.", Success = true });
        }
    }
}
