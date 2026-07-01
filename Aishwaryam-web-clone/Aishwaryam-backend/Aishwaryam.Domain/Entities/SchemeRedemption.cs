using System;

namespace Aishwaryam.Domain.Entities
{
    public class SchemeRedemption
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserSchemeId { get; set; }
        public Guid UserId { get; set; }
        public string RedemptionType { get; set; } = "JEWELLERY"; // JEWELLERY, PHYSICAL_GOLD, CASH
        public long GoldWeightMg { get; set; }
        public long PricePerGmPaise { get; set; }
        public long TotalAmountPaise { get; set; }
        public string Status { get; set; } = "PENDING"; // PENDING, APPROVED, REJECTED, COMPLETED
        public string? Address { get; set; }
        public string? AdminNotes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public UserScheme UserScheme { get; set; } = null!;
        public User User { get; set; } = null!;
    }
}
