using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Aishwaryam.Domain.Entities
{
    [Table("user_notifications")]
    public class UserNotification
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("user_id")]
        public Guid UserId { get; set; }

        [Column("title")]
        public string Title { get; set; } = string.Empty;

        [Column("message")]
        public string Message { get; set; } = string.Empty;

        [Column("type")]
        public string Type { get; set; } = "GENERAL"; // KYC, OFFER, SYSTEM

        [Column("is_read")]
        public bool IsRead { get; set; } = false;

        [Column("entity_id")]
        public string? EntityId { get; set; }

        [Column("is_deleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
