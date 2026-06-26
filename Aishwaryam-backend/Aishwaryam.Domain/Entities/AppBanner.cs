using System;

namespace Aishwaryam.Domain.Entities
{
    /// <summary>
    /// Stores admin-created promotional banners as base64 image data.
    /// The app fetches only active banners ordered by display_order.
    /// </summary>
    public class AppBanner
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        /// <summary>Short title shown as accessibility label / admin list display.</summary>
        public string Title { get; set; } = string.Empty;

        /// <summary>
        /// Full base64-encoded image string (e.g. "data:image/png;base64,iVBOR...").
        /// Stored as TEXT in PostgreSQL.
        /// </summary>
        public string ImageBase64 { get; set; } = string.Empty;

        /// <summary>Optional deep-link or external URL when user taps the banner.</summary>
        public string? TapActionUrl { get; set; }

        /// <summary>When false, banner is hidden from the app immediately.</summary>
        public bool IsActive { get; set; } = true;

        /// <summary>Lower number = appears first in the carousel.</summary>
        public int DisplayOrder { get; set; } = 0;

        /// <summary>Where the banner is displayed: e.g. "DASHBOARD" or "ONBOARDING".</summary>
        public string Location { get; set; } = "DASHBOARD";

        /// <summary>Optional: countdown timer expiry date/time for Meesho-style banner timer.</summary>
        public DateTimeOffset? ExpiresAt { get; set; }

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

        /// <summary>Optional: which admin created this banner.</summary>
        public string? CreatedByAdminId { get; set; }
    }
}
