using System;

namespace Aishwaryam.Domain.Entities
{
    public class ReferralEvent
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid ReferrerUserId { get; set; }
        public Guid RefereeUserId { get; set; }
        public string RewardStatus { get; set; } = "Pending"; // Pending, Awarded
        public long BonusAwardedMg { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public User ReferrerUser { get; set; } = null!;
        public User RefereeUser { get; set; } = null!;
    }
}
