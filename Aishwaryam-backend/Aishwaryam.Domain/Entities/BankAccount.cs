using System;

namespace Aishwaryam.Domain.Entities
{
    public class BankAccount
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string AccountNumberEncrypted { get; set; } = string.Empty;
        public string IfscCode { get; set; } = string.Empty;
        public string BankName { get; set; } = string.Empty;
        public bool IsVerified { get; set; } = false;
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        public User? User { get; set; }
    }
}
