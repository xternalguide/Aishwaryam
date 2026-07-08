using System;

namespace Aishwaryam.Domain.Entities
{
    public class FestivalTheme
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public string? PrimaryColorHex { get; set; }
        public string? SecondaryColorHex { get; set; }
        public string? StatusBarColorHex { get; set; }
        public string? SplashBgColorHex { get; set; }

        // CDN URLs for illustrations/decorations
        public string? SplashIllustrationUrl { get; set; }
        public string? LoginIllustrationUrl { get; set; }
        public string? HomeIllustrationUrl { get; set; }
        public string? SidebarIllustrationUrl { get; set; }
        public string? WelcomeBannerUrl { get; set; }
        
        // JSON Configurations
        public string? DecorationsJson { get; set; } // Floating ornaments, borders
        public string? LottieAnimationsJson { get; set; } // Festive animated overlays

        // Absolute Scheduling
        public DateTimeOffset? StartDate { get; set; }
        public DateTimeOffset? EndDate { get; set; }

        // Recurring (Annual) Scheduling
        public bool IsRecurring { get; set; } = false;
        public int? StartMonth { get; set; }
        public int? StartDay { get; set; }
        public int? EndMonth { get; set; }
        public int? EndDay { get; set; }

        public bool IsSystemDefault { get; set; } = false;
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
