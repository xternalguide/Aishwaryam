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

        public bool IsDailyPriceNotificationEnabled { get; set; } = false;
        public DateTimeOffset? LastDailyPriceNotificationSent { get; set; }

        // Receipt Template Configurations
        public string ReceiptCompanyName { get; set; } = "AISHWARYAM @ YOUR HOME";
        public string ReceiptSubtitle { get; set; } = "Official Digital Gold Savings Investment Receipt";
        public string ReceiptCorpName { get; set; } = "Aishwaryam @ Home Private Limited";
        public string ReceiptAddress1 { get; set; } = "45, Palace Road, Vasanth Nagar,";
        public string ReceiptAddress2 { get; set; } = "Chennai, Tamil Nadu - 600001";
        public string ReceiptPhone { get; set; } = "+91 94430 00000";
        public string ReceiptEmail { get; set; } = "support@aishwaryam.com";
        public string ReceiptColorPrimary { get; set; } = "#6B21A8"; // Purple
        public string ReceiptColorSecondary { get; set; } = "#D4AF37"; // Gold
        public string ReceiptDisclaimerGold { get; set; } = "* Gold credited is subject to the terms and rules of the locked scheme plan.";
        public string ReceiptDisclaimerSilver { get; set; } = "* Silver credited is subject to the terms and rules of the locked scheme plan.";
        public string ReceiptRegisteredOffice { get; set; } = "Registered Office: No. 123, Gandhi Road, Chennai, Tamil Nadu - 600001";

        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
