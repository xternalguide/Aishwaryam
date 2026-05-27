using System;

namespace Aishwaryam.Domain.Entities
{
    public class AppConfig
    {
        public string Id { get; set; } = "global_config";
        public string SupportEmail { get; set; } = "support@aishwaryamgold.com";
        public string SupportPhone { get; set; } = "+91-9876543210";
        public string TermsAndConditionsUrl { get; set; } = "https://aishwaryamgold.com/terms";
        public string PrivacyPolicyUrl { get; set; } = "https://aishwaryamgold.com/privacy";
        public string FaqJson { get; set; } = "[{\"q\":\"How to buy gold?\",\"a\":\"Go to Market tab and buy.\"}]";
        public string ReferralBonusMsg { get; set; } = "Invite friends and earn 1mg of 24K Gold!";
        
        // Remote Config & Theme (Backend-driven UI)
        public string PrimaryColorHex { get; set; } = "#01211A"; // Dark Green
        public string SecondaryColorHex { get; set; } = "#E8A83A"; // Gold
        public string FestivalBannerUrl { get; set; } = "https://images.unsplash.com/photo-1610652492500-ded49ceeb378?auto=format&fit=crop&q=80&w=800";
        public bool IsReferralEnabled { get; set; } = true;
        public bool IsAutoSaveEnabled { get; set; } = true;
        public long ReferrerRewardMg { get; set; } = 100;
        public long RefereeRewardMg { get; set; } = 50;

        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
