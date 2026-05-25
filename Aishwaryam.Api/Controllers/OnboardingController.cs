using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Aishwaryam.Infrastructure.Data;

namespace Aishwaryam.Api.Controllers
{
    // ── DTOs ─────────────────────────────────────────────────────────────────

    public class OnboardingCardResponse
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Subtitle { get; set; } = string.Empty;
        public string Emoji { get; set; } = "🌟";
        public string GradientCss { get; set; } = "linear-gradient(135deg, #1a2b22, #0d1b14)";
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateOnboardingCardRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Subtitle { get; set; } = string.Empty;
        public string Emoji { get; set; } = "🌟";
        public string GradientCss { get; set; } = "linear-gradient(135deg, #1a2b22, #0d1b14)";
        public int DisplayOrder { get; set; } = 1;
        public bool IsActive { get; set; } = true;
    }

    public class UpdateOnboardingCardRequest
    {
        public string? Title { get; set; }
        public string? Subtitle { get; set; }
        public string? Emoji { get; set; }
        public string? GradientCss { get; set; }
        public int? DisplayOrder { get; set; }
        public bool? IsActive { get; set; }
    }

    // ── Controller ────────────────────────────────────────────────────────────

    [ApiController]
    [Route("api/[controller]")]
    public class OnboardingController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public OnboardingController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ── APP ENDPOINT ──────────────────────────────────────────────────────

        /// <summary>
        /// GET /api/Onboarding/active
        /// Called by the mobile app on first launch.
        /// Returns only active cards ordered by display_order ASC.
        /// </summary>
        [HttpGet("active")]
        public async Task<IActionResult> GetActiveCards()
        {
            try
            {
                var sql = @"
                    SELECT id, title, subtitle, emoji, gradient_css, display_order, is_active
                    FROM app_onboarding_cards
                    WHERE is_active = TRUE
                    ORDER BY display_order ASC";

                var connection = _context.Database.GetDbConnection();
                if (connection.State != System.Data.ConnectionState.Open)
                    await connection.OpenAsync();

                var cards = new System.Collections.Generic.List<OnboardingCardResponse>();
                using var cmd = connection.CreateCommand();
                cmd.CommandText = sql;
                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    cards.Add(new OnboardingCardResponse
                    {
                        Id          = reader.GetGuid(0),
                        Title       = reader.GetString(1),
                        Subtitle    = reader.GetString(2),
                        Emoji       = reader.IsDBNull(3) ? "🌟" : reader.GetString(3),
                        GradientCss = reader.IsDBNull(4) ? "linear-gradient(135deg,#1a2b22,#0d1b14)" : reader.GetString(4),
                        DisplayOrder = reader.GetInt32(5),
                        IsActive    = reader.GetBoolean(6)
                    });
                }

                return Ok(new { success = true, cards });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching onboarding cards", error = ex.Message });
            }
        }

        // ── ADMIN ENDPOINTS ───────────────────────────────────────────────────

        /// <summary>
        /// POST /api/Onboarding/admin/migrate
        /// One-time: creates the app_onboarding_cards table.
        /// </summary>
        [HttpPost("admin/migrate")]
        public async Task<IActionResult> RunMigration()
        {
            try
            {
                var sql = @"
                    CREATE TABLE IF NOT EXISTS app_onboarding_cards (
                        id              uuid        NOT NULL DEFAULT gen_random_uuid(),
                        title           varchar(200) NOT NULL,
                        subtitle        varchar(500) NOT NULL,
                        emoji           varchar(10)  NOT NULL DEFAULT '🌟',
                        gradient_css    varchar(300) NOT NULL DEFAULT 'linear-gradient(135deg,#1a2b22,#0d1b14)',
                        display_order   integer      NOT NULL DEFAULT 1,
                        is_active       boolean      NOT NULL DEFAULT TRUE,
                        created_at      timestamptz  NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at      timestamptz  NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        CONSTRAINT ""PK_app_onboarding_cards"" PRIMARY KEY (id)
                    );";

                await Microsoft.EntityFrameworkCore.RelationalDatabaseFacadeExtensions
                    .ExecuteSqlRawAsync(_context.Database, sql);

                // Seed default 3 cards if table is empty
                var seedSql = @"
                    INSERT INTO app_onboarding_cards (title, subtitle, emoji, gradient_css, display_order, is_active)
                    SELECT * FROM (VALUES
                        ('Buy Pure Gold Digitally',      'Start with as little as ₹10. Safe, certified, and delivered to your doorstep.',         '🥇', 'linear-gradient(135deg,#1a2b22,#0d1b14)', 1, TRUE),
                        ('Grow Your Wealth',             'Track your gold portfolio live. Watch it grow with every rupee you invest.',              '📈', 'linear-gradient(135deg,#0f172a,#1e3a5f)', 2, TRUE),
                        ('Redeem Anytime, Anywhere',     'Convert your digital gold to physical jewellery or get it delivered to your home.',       '💍', 'linear-gradient(135deg,#1e1b4b,#312e81)', 3, TRUE)
                    ) AS v(title, subtitle, emoji, gradient_css, display_order, is_active)
                    WHERE NOT EXISTS (SELECT 1 FROM app_onboarding_cards LIMIT 1);";

                await Microsoft.EntityFrameworkCore.RelationalDatabaseFacadeExtensions
                    .ExecuteSqlRawAsync(_context.Database, seedSql);

                return Ok(new { success = true, message = "app_onboarding_cards table created with 3 default cards." });
            }
            catch (Exception e)
            {
                return BadRequest(new { success = false, message = e.Message });
            }
        }

        /// <summary>GET /api/Onboarding/admin/all — Admin: list all cards</summary>
        [HttpGet("admin/all")]
        public async Task<IActionResult> GetAllCards()
        {
            try
            {
                var sql = @"
                    SELECT id, title, subtitle, emoji, gradient_css, display_order, is_active
                    FROM app_onboarding_cards
                    ORDER BY display_order ASC";

                var connection = _context.Database.GetDbConnection();
                if (connection.State != System.Data.ConnectionState.Open)
                    await connection.OpenAsync();

                var cards = new System.Collections.Generic.List<OnboardingCardResponse>();
                using var cmd = connection.CreateCommand();
                cmd.CommandText = sql;
                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    cards.Add(new OnboardingCardResponse
                    {
                        Id           = reader.GetGuid(0),
                        Title        = reader.GetString(1),
                        Subtitle     = reader.GetString(2),
                        Emoji        = reader.IsDBNull(3) ? "🌟" : reader.GetString(3),
                        GradientCss  = reader.IsDBNull(4) ? "linear-gradient(135deg,#1a2b22,#0d1b14)" : reader.GetString(4),
                        DisplayOrder = reader.GetInt32(5),
                        IsActive     = reader.GetBoolean(6)
                    });
                }

                return Ok(new { success = true, cards });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching cards", error = ex.Message });
            }
        }

        /// <summary>POST /api/Onboarding/admin/create — Admin: create a card</summary>
        [HttpPost("admin/create")]
        public async Task<IActionResult> CreateCard([FromBody] CreateOnboardingCardRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Title))
                return BadRequest(new { success = false, message = "Title is required." });
            if (string.IsNullOrWhiteSpace(request.Subtitle))
                return BadRequest(new { success = false, message = "Subtitle is required." });

            try
            {
                var sql = @"
                    INSERT INTO app_onboarding_cards (title, subtitle, emoji, gradient_css, display_order, is_active)
                    VALUES (@title, @subtitle, @emoji, @gradientCss, @displayOrder, @isActive)
                    RETURNING id";

                var connection = _context.Database.GetDbConnection();
                if (connection.State != System.Data.ConnectionState.Open)
                    await connection.OpenAsync();

                using var cmd = connection.CreateCommand();
                cmd.CommandText = sql;

                void AddParam(string name, object value)
                {
                    var p = cmd.CreateParameter(); p.ParameterName = name; p.Value = value; cmd.Parameters.Add(p);
                }

                AddParam("@title",        request.Title.Trim());
                AddParam("@subtitle",     request.Subtitle.Trim());
                AddParam("@emoji",        request.Emoji?.Trim() ?? "🌟");
                AddParam("@gradientCss",  request.GradientCss?.Trim() ?? "linear-gradient(135deg,#1a2b22,#0d1b14)");
                AddParam("@displayOrder", request.DisplayOrder);
                AddParam("@isActive",     request.IsActive);

                var newId = await cmd.ExecuteScalarAsync();
                return Ok(new { success = true, message = "Onboarding card created.", cardId = newId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating card", error = ex.Message });
            }
        }

        /// <summary>PATCH /api/Onboarding/admin/{id} — Admin: update a card</summary>
        [HttpPatch("admin/{id:guid}")]
        public async Task<IActionResult> UpdateCard(Guid id, [FromBody] UpdateOnboardingCardRequest request)
        {
            try
            {
                var setParts = new System.Collections.Generic.List<string> { "updated_at = CURRENT_TIMESTAMP" };
                var connection = _context.Database.GetDbConnection();
                if (connection.State != System.Data.ConnectionState.Open)
                    await connection.OpenAsync();

                using var cmd = connection.CreateCommand();

                void AddParam(string name, object value)
                {
                    var p = cmd.CreateParameter(); p.ParameterName = name; p.Value = value; cmd.Parameters.Add(p);
                }

                if (request.Title        != null) { setParts.Add("title = @title");               AddParam("@title",        request.Title.Trim()); }
                if (request.Subtitle     != null) { setParts.Add("subtitle = @subtitle");          AddParam("@subtitle",     request.Subtitle.Trim()); }
                if (request.Emoji        != null) { setParts.Add("emoji = @emoji");               AddParam("@emoji",        request.Emoji.Trim()); }
                if (request.GradientCss  != null) { setParts.Add("gradient_css = @gradientCss");  AddParam("@gradientCss",  request.GradientCss.Trim()); }
                if (request.DisplayOrder != null) { setParts.Add("display_order = @displayOrder"); AddParam("@displayOrder", request.DisplayOrder.Value); }
                if (request.IsActive     != null) { setParts.Add("is_active = @isActive");        AddParam("@isActive",     request.IsActive.Value); }

                AddParam("@id", id);
                cmd.CommandText = $"UPDATE app_onboarding_cards SET {string.Join(", ", setParts)} WHERE id = @id";
                var rows = await cmd.ExecuteNonQueryAsync();

                if (rows == 0) return NotFound(new { success = false, message = "Card not found." });
                return Ok(new { success = true, message = "Card updated." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating card", error = ex.Message });
            }
        }

        /// <summary>DELETE /api/Onboarding/admin/{id} — Admin: delete a card</summary>
        [HttpDelete("admin/{id:guid}")]
        public async Task<IActionResult> DeleteCard(Guid id)
        {
            try
            {
                var connection = _context.Database.GetDbConnection();
                if (connection.State != System.Data.ConnectionState.Open)
                    await connection.OpenAsync();

                using var cmd = connection.CreateCommand();
                cmd.CommandText = "DELETE FROM app_onboarding_cards WHERE id = @id";
                var p = cmd.CreateParameter(); p.ParameterName = "@id"; p.Value = id;
                cmd.Parameters.Add(p);

                var rows = await cmd.ExecuteNonQueryAsync();
                if (rows == 0) return NotFound(new { success = false, message = "Card not found." });
                return Ok(new { success = true, message = "Card deleted." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting card", error = ex.Message });
            }
        }
    }
}
