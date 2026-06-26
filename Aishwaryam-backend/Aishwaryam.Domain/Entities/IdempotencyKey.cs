using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Aishwaryam.Domain.Entities
{
    [Table("idempotency_keys")]
    public class IdempotencyKey
    {
        [Key]
        [Column("key")]
        public string Key { get; set; } = string.Empty;

        [Column("user_id")]
        public Guid? UserId { get; set; }

        [Column("endpoint")]
        public string Endpoint { get; set; } = string.Empty;

        [Column("response_body", TypeName = "jsonb")]
        public JsonDocument? ResponseBody { get; set; }

        [Column("response_status")]
        public int ResponseStatus { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
