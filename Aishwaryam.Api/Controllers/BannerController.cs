using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Aishwaryam.Domain.Entities;
using Aishwaryam.Infrastructure.Data;

namespace Aishwaryam.Api.Controllers
{
    // ── DTOs ────────────────────────────────────────────────────────────────

    /// <summary>What the mobile app receives — no admin metadata exposed.</summary>
    public class BannerResponse
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string ImageBase64 { get; set; } = string.Empty;
        public string? TapActionUrl { get; set; }
        public int DisplayOrder { get; set; }
        public string Location { get; set; } = "DASHBOARD";
        public DateTimeOffset? ExpiresAt { get; set; }
    }

    /// <summary>Admin creates/updates banners with this payload.</summary>
    public class CreateBannerRequest
    {
        public string Title { get; set; } = string.Empty;

        /// <summary>Full base64 string e.g. "data:image/png;base64,iVBOR..."</summary>
        public string ImageBase64 { get; set; } = string.Empty;
        public string? TapActionUrl { get; set; }
        public int DisplayOrder { get; set; } = 0;
        public string Location { get; set; } = "DASHBOARD";
        public string? CreatedByAdminId { get; set; }
        public DateTimeOffset? ExpiresAt { get; set; }
    }

    public class UpdateBannerRequest
    {
        public string? Title { get; set; }
        public string? ImageBase64 { get; set; }
        public string? TapActionUrl { get; set; }
        public bool? IsActive { get; set; }
        public int? DisplayOrder { get; set; }
        public string? Location { get; set; }
        public DateTimeOffset? ExpiresAt { get; set; }
    }

    // ── Controller ───────────────────────────────────────────────────────────

    [ApiController]
    [Route("api/[controller]")]
    public class BannerController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly Microsoft.AspNetCore.Hosting.IWebHostEnvironment _env;

        public BannerController(ApplicationDbContext context, Microsoft.AspNetCore.Hosting.IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // ── APP ENDPOINTS ─────────────────────────────────────────────────

        /// <summary>
        /// GET /api/Banner/active
        /// Called by the mobile app on dashboard load.
        /// Returns only active banners ordered by display_order ASC.
        /// </summary>
        [HttpGet("active")]
        public async Task<IActionResult> GetActiveBanners([FromQuery] string location = "DASHBOARD")
        {
            // Treat null/empty location as "DASHBOARD" (handles rows created before the location column was added)
            var banners = await _context.AppBanners
                .Where(b => b.IsActive && (b.Location == location || (location == "DASHBOARD" && (b.Location == null || b.Location == ""))))
                .OrderBy(b => b.DisplayOrder)
                .Select(b => new BannerResponse
                {
                    Id = b.Id,
                    Title = b.Title,
                    ImageBase64 = b.ImageBase64,
                    TapActionUrl = b.TapActionUrl,
                    DisplayOrder = b.DisplayOrder,
                    Location = b.Location ?? "DASHBOARD",
                    ExpiresAt = b.ExpiresAt
                })
                .ToListAsync();

            return Ok(new { success = true, banners });
        }

        // ── ADMIN ENDPOINTS ───────────────────────────────────────────────

        /// <summary>
        /// POST /api/Banner/admin/migrate
        /// One-time: creates the app_banners table and marks EF migration history as applied.
        /// Call this once after first deployment.
        /// </summary>
        [HttpPost("admin/migrate")]
        public async Task<IActionResult> RunMigration()
        {
            try
            {
                var sql = @"
                    CREATE TABLE IF NOT EXISTS app_banners (
                        id uuid NOT NULL DEFAULT gen_random_uuid(),
                        title character varying(200) NOT NULL,
                        image_base64 text NOT NULL,
                        tap_action_url character varying(500),
                        is_active boolean NOT NULL DEFAULT TRUE,
                        display_order integer NOT NULL DEFAULT 0,
                        created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        created_by_admin_id character varying(100),
                        CONSTRAINT ""PK_app_banners"" PRIMARY KEY (id)
                    );

                    ALTER TABLE app_banners ADD COLUMN IF NOT EXISTS location character varying(50);
                    ALTER TABLE app_banners ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;
                    UPDATE app_banners SET location = 'DASHBOARD' WHERE location IS NULL OR location = '';

                    INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
                    VALUES 
                        ('20260501114037_AddUserOnboardingFields', '9.0.0'),
                        ('20260504062424_AddAppBanners', '9.0.0')
                    ON CONFLICT DO NOTHING;
                ";

                await Microsoft.EntityFrameworkCore.RelationalDatabaseFacadeExtensions
                    .ExecuteSqlRawAsync(_context.Database, sql);

                return Ok(new { success = true, message = "app_banners table created and migrations marked as applied." });
            }
            catch (Exception e)
            {
                return BadRequest(new { success = false, message = e.Message });
            }
        }

        /// <summary>
        /// POST /api/Banner/admin/fix-locations
        /// One-time: backfills any null/empty location values to 'DASHBOARD'.
        /// Run this once after the separation of onboarding and dashboard banners.
        /// </summary>
        [HttpPost("admin/fix-locations")]
        public async Task<IActionResult> FixNullLocations()
        {
            try
            {
                var sql = @"UPDATE app_banners SET location = 'DASHBOARD' WHERE location IS NULL OR location = ''";
                var affected = await Microsoft.EntityFrameworkCore.RelationalDatabaseFacadeExtensions
                    .ExecuteSqlRawAsync(_context.Database, sql);

                return Ok(new { success = true, message = $"Fixed {affected} banner(s) with null/empty location → DASHBOARD." });
            }
            catch (Exception e)
            {
                return BadRequest(new { success = false, message = e.Message });
            }
        }

        /// <summary>
        /// GET /api/Banner/admin/all
        /// Admin panel: list all banners (active + inactive) with full metadata.
        /// </summary>
        [HttpGet("admin/all")]
        public async Task<IActionResult> GetAllBanners()
        {
            var banners = await _context.AppBanners
                .OrderBy(b => b.DisplayOrder)
                .ToListAsync();
            return Ok(new { success = true, banners });
        }

        /// <summary>
        /// POST /api/Banner/admin/create
        /// Admin panel: upload a new banner poster (base64 image).
        /// </summary>
        [HttpPost("admin/create")]
        [DisableRequestSizeLimit]
        public async Task<IActionResult> CreateBanner([FromBody] CreateBannerRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Title))
                return BadRequest(new { success = false, message = "Title is required." });

            if (string.IsNullOrWhiteSpace(request.ImageBase64))
                return BadRequest(new { success = false, message = "Image data is required." });

            var banner = new AppBanner
            {
                Title = request.Title.Trim(),
                ImageBase64 = SaveImageFromBase64(request.ImageBase64),
                TapActionUrl = request.TapActionUrl,
                DisplayOrder = request.DisplayOrder,
                Location = request.Location,
                ExpiresAt = request.ExpiresAt,
                IsActive = true,
                CreatedByAdminId = request.CreatedByAdminId,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            _context.AppBanners.Add(banner);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Banner created successfully.", bannerId = banner.Id });
        }

        /// <summary>
        /// PATCH /api/Banner/admin/{id}
        /// Admin panel: toggle active/inactive, change order, update image.
        /// </summary>
        [HttpPatch("admin/{id:guid}")]
        public async Task<IActionResult> UpdateBanner(Guid id, [FromBody] UpdateBannerRequest request)
        {
            var banner = await _context.AppBanners.FindAsync(id);
            if (banner == null)
                return NotFound(new { success = false, message = "Banner not found." });

            if (!string.IsNullOrWhiteSpace(request.Title))        banner.Title = request.Title.Trim();
            if (!string.IsNullOrWhiteSpace(request.ImageBase64))  banner.ImageBase64 = SaveImageFromBase64(request.ImageBase64);
            if (request.TapActionUrl != null)                       banner.TapActionUrl = request.TapActionUrl;
            if (request.IsActive.HasValue)                          banner.IsActive = request.IsActive.Value;
            if (request.DisplayOrder.HasValue)                      banner.DisplayOrder = request.DisplayOrder.Value;
            if (!string.IsNullOrWhiteSpace(request.Location))     banner.Location = request.Location.Trim();
            if (request.ExpiresAt != null)                         banner.ExpiresAt = request.ExpiresAt;

            banner.UpdatedAt = DateTimeOffset.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Banner updated." });
        }

        /// <summary>
        /// DELETE /api/Banner/admin/{id}
        /// Admin panel: permanently remove a banner.
        /// </summary>
        [HttpDelete("admin/{id:guid}")]
        public async Task<IActionResult> DeleteBanner(Guid id)
        {
            var banner = await _context.AppBanners.FindAsync(id);
            if (banner == null)
                return NotFound(new { success = false, message = "Banner not found." });

            _context.AppBanners.Remove(banner);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Banner deleted." });
        }

        private string SaveImageFromBase64(string base64String)
        {
            if (string.IsNullOrWhiteSpace(base64String))
                return string.Empty;

            // Check if it's already a URL (e.g. if the admin is updating a banner but keeping the same image URL)
            if (base64String.StartsWith("http://", StringComparison.OrdinalIgnoreCase) || 
                base64String.StartsWith("https://", StringComparison.OrdinalIgnoreCase) ||
                base64String.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase))
            {
                return base64String;
            }

            try
            {
                // Remove base64 metadata headers if present (e.g., "data:image/png;base64,")
                var cleanBase64 = base64String;
                var extension = ".png"; // default

                if (cleanBase64.Contains(","))
                {
                    var parts = cleanBase64.Split(',');
                    var header = parts[0];
                    cleanBase64 = parts[1];

                    if (header.Contains("image/jpeg") || header.Contains("image/jpg"))
                        extension = ".jpg";
                    else if (header.Contains("image/webp"))
                        extension = ".webp";
                    else if (header.Contains("image/gif"))
                        extension = ".gif";
                }

                var imageBytes = Convert.FromBase64String(cleanBase64);

                // Ensure directories exist in wwwroot
                var webRootPath = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
                var absoluteDir = Path.Combine(webRootPath, "uploads", "banners");
                if (!Directory.Exists(absoluteDir))
                {
                    Directory.CreateDirectory(absoluteDir);
                }

                var fileName = $"banner_{Guid.NewGuid()}{extension}";
                var absoluteFilePath = Path.Combine(absoluteDir, fileName);

                System.IO.File.WriteAllBytes(absoluteFilePath, imageBytes);

                // Return relative path to be served statically
                var request = HttpContext.Request;
                var scheme = request.Scheme;
                
                // If requested host is the production host, force HTTPS scheme
                if (request.Host.Host.Equals("aishwaryam.blazewing.in", StringComparison.OrdinalIgnoreCase))
                {
                    scheme = "https";
                }
                // Also, if the request has X-Forwarded-Proto header, respect that
                else if (request.Headers.TryGetValue("X-Forwarded-Proto", out var proto))
                {
                    scheme = proto.ToString();
                }

                var baseUrl = $"{scheme}://{request.Host}{request.PathBase}";
                return $"{baseUrl}/uploads/banners/{fileName}";
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SAVE-IMAGE-ERROR] {ex.Message}");
                // Fallback to saving base64 to db if disk save fails (failsafe)
                return base64String;
            }
        }
    }
}
