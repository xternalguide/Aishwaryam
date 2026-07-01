using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Aishwaryam.Domain.Entities
{
    [Table("promotional_offers")]
    public class PromotionalOffer
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("title")]
        public string Title { get; set; } = string.Empty;

        [Column("description")]
        public string Description { get; set; } = string.Empty;

        [Column("offer_type")]
        public string OfferType { get; set; } = "FLASH_SALE"; // BIRTHDAY | ANNIVERSARY | FLASH_SALE | TARGETED

        [Column("target_user_id")]
        public Guid? TargetUserId { get; set; } // Null if bulk

        [Column("bonus_worth_paise")]
        public long BonusWorthPaise { get; set; } = 0; // Flat bonus (legacy / flash sales)

        [Column("bonus_gold_mg")]
        public long BonusGoldMg { get; set; } = 0; // Flat gold weight awarded as bonus (e.g. 5000mg for 5g)

        [Column("bonus_percent")]
        public decimal BonusPercent { get; set; } = 0; // Percentage bonus on purchase (birthday/anniversary)

        [Column("min_purchase_amount_paise")]
        public long MinPurchaseAmountPaise { get; set; } = 0; // Min purchase to get bonus

        [Column("min_purchase_gold_mg")]
        public long MinPurchaseGoldMg { get; set; } = 0; // Min purchase gold weight in mg to get bonus

        [Column("banner_url")]
        public string? BannerUrl { get; set; } // Custom poster/image for the offer campaign

        [Column("duration_hours")]
        public int DurationHours { get; set; } = 24; // How long the offer is valid after firing

        [Column("expires_at")]
        public DateTime ExpiresAt { get; set; }

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
