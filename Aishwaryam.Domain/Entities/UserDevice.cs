using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Aishwaryam.Domain.Entities
{
    [Table("user_devices")]
    public class UserDevice
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("user_id")]
        public Guid? UserId { get; set; }

        [Column("fcm_token")]
        [Required]
        public string FcmToken { get; set; } = string.Empty;

        [Column("device_type")]
        public string DeviceType { get; set; } = "ANDROID"; // ANDROID, IOS

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Column("last_used_at")]
        public DateTime LastUsedAt { get; set; } = DateTime.UtcNow;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(UserId))]
        public virtual User? User { get; set; }
    }
}
