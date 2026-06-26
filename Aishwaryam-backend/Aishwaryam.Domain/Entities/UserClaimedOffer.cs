using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Aishwaryam.Domain.Entities
{
    [Table("user_claimed_offers")]
    public class UserClaimedOffer
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("offer_id")]
        public Guid OfferId { get; set; }

        [Column("user_id")]
        public Guid UserId { get; set; }

        [Column("claimed_at")]
        public DateTime ClaimedAt { get; set; } = DateTime.UtcNow;
    }
}
