using System;
using System.Collections.Generic;

namespace Aishwaryam.Application.DTOs.Admin
{
    public class KycActionRequest
    {
        public Guid UserId { get; set; }
        public bool IsApproved { get; set; }
        public string AdminNotes { get; set; } = string.Empty;
        public string AdminEmail { get; set; } = string.Empty;
    }

    public class AdminAuditLogResponse
    {
        public Guid Id { get; set; }
        public string AdminEmail { get; set; } = string.Empty;
        public string ActionType { get; set; } = string.Empty;
        public string TargetEntityId { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        public string IpAddress { get; set; } = string.Empty;
        public DateTimeOffset CreatedAt { get; set; }
    }

    public class OperationalKpisResponse
    {
        // User & KYC
        public int TotalUsers { get; set; }
        public int KycPendingCount { get; set; }
        public int KycVerifiedCount { get; set; }
        public int HighValueInvestorsCount { get; set; } // >100g held

        // Liability & Finance
        public long TotalGoldLiabilityMg { get; set; } // Vault logic: how much gold users own
        public long TotalLockedGoldMg { get; set; }
        public long TotalMaturedGoldMg { get; set; }
        public long PlatformRevenuePaise { get; set; } // E.g., accumulated GST or margins

        // Health & Operations
        public int PendingRedemptionsCount { get; set; }
        public int FailedPayments24hCount { get; set; }
        public int ActiveSchemesCount { get; set; }
        public int SuspiciousActivityAlerts { get; set; } // E.g., rapid buy/sell, high volume without KYC
    }
}
