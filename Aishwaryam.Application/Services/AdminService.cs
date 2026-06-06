using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Aishwaryam.Application.DTOs.Admin;
using Aishwaryam.Application.Interfaces.Repositories;
using Aishwaryam.Application.Interfaces.Services;
using Aishwaryam.Domain.Entities;

namespace Aishwaryam.Application.Services
{
    public class AdminService : IAdminService
    {
        private readonly IAdminRepository _adminRepository;
        private readonly IKycComplianceService _kycComplianceService;
        private readonly IAuthRepository _authRepository;
        private readonly IKycRepository _kycRepository;
        private readonly INotificationDispatcher _dispatcher;

        public AdminService(
            IAdminRepository adminRepository, 
            IKycComplianceService kycComplianceService,
            IAuthRepository authRepository,
            IKycRepository kycRepository,
            INotificationDispatcher dispatcher)
        {
            _adminRepository = adminRepository;
            _kycComplianceService = kycComplianceService;
            _authRepository = authRepository;
            _kycRepository = kycRepository;
            _dispatcher = dispatcher;
        }

        public async Task<OperationalKpisResponse> GetOperationalKpisAsync()
        {
            var response = new OperationalKpisResponse
            {
                TotalUsers = await _adminRepository.GetTotalUsersCountAsync(),
                KycPendingCount = await _adminRepository.GetKycPendingCountAsync(),
                KycVerifiedCount = await _adminRepository.GetKycVerifiedCountAsync(),
                HighValueInvestorsCount = await _adminRepository.GetHighValueInvestorsCountAsync(),
                TotalGoldLiabilityMg = await _adminRepository.GetTotalGoldLiabilityMgAsync(),
                ActiveSchemesCount = await _adminRepository.GetActiveSchemesCountAsync(),
                FailedPayments24hCount = await _adminRepository.GetFailedPayments24hCountAsync(),
                PendingRedemptionsCount = await _adminRepository.GetPendingRedemptionsCountAsync()
                // Other fields left default for now
            };
            return response;
        }

        public async Task LogAdminActionAsync(string adminEmail, string actionType, string targetEntityId, string notes, string ipAddress)
        {
            var log = new AdminAuditLog
            {
                AdminEmail = adminEmail,
                ActionType = actionType,
                TargetEntityId = targetEntityId,
                Notes = notes,
                IpAddress = ipAddress
            };
            await _adminRepository.LogAdminActionAsync(log);
        }

        public async Task<IEnumerable<AdminAuditLogResponse>> GetAuditLogsAsync(int limit = 100)
        {
            var logs = await _adminRepository.GetAuditLogsAsync(limit);
            return logs.Select(l => new AdminAuditLogResponse
            {
                Id = l.Id,
                AdminEmail = l.AdminEmail,
                ActionType = l.ActionType,
                TargetEntityId = l.TargetEntityId,
                Notes = l.Notes,
                IpAddress = l.IpAddress,
                CreatedAt = l.CreatedAt
            });
        }

        public async Task<bool> ProcessKycActionAsync(KycActionRequest request)
        {
            var user = await _authRepository.GetUserByIdAsync(request.UserId);
            if (user == null) return false;

            if (request.IsApproved)
            {
                user.KycLevel = "FULL";
            }
            else
            {
                user.KycLevel = "REJECTED";
            }

            await _authRepository.UpdateUserAsync(user);

            // Update all KycDocuments if exist
            var docs = await _kycRepository.GetUserKycDocumentsAsync(request.UserId);
            if (docs != null && docs.Any())
            {
                foreach (var doc in docs)
                {
                    doc.Status = request.IsApproved ? "VERIFIED" : "REJECTED";
                    if (!request.IsApproved)
                    {
                        doc.RejectionReason = request.AdminNotes;
                    }
                    await _kycRepository.UpdateKycDocumentAsync(doc);
                }
            }

            // Send unified notification to user
            var title = request.IsApproved ? "KYC Approved! ✅" : "KYC Rejected ❌";
            var message = request.IsApproved 
                ? "Your KYC verification is completed"
                : $"Your KYC verification was rejected. Reason: {request.AdminNotes}. Please re-submit valid documents.";
            
            if (request.IsApproved)
            {
                await _dispatcher.DispatchAsync(new NotificationPayload
                {
                    UserId = request.UserId,
                    ToPhone = user.PhoneNumber,
                    ToEmail = user.Email,
                    ToName = user.FullName,
                    Title = title,
                    Body = message,
                    Type = "KYC_UPDATE",
                    SendPush = true,
                    PushData = new Dictionary<string, string>
                    {
                        { "screen", "profile" }
                    },
                    SendSms = true,
                    SmsText = $"Aishwaryam: {message}",
                    SendEmail = true,
                    EmailTemplate = EmailTemplate.KycApproved,
                    EmailData = new
                    {
                        UserName = user.FullName ?? "Customer",
                        KycLevel = user.KycLevel ?? "FULL",
                        DailyLimit = "2,00,000",
                        MonthlyLimit = "10,00,000"
                    }
                });
            }
            else
            {
                await _dispatcher.DispatchAsync(new NotificationPayload
                {
                    UserId = request.UserId,
                    ToPhone = user.PhoneNumber,
                    ToEmail = user.Email,
                    ToName = user.FullName,
                    Title = title,
                    Body = message,
                    Type = "KYC_UPDATE",
                    SendPush = true,
                    PushData = new Dictionary<string, string>
                    {
                        { "screen", "profile" }
                    },
                    SendSms = true,
                    SmsText = $"Aishwaryam: {message}",
                    SendEmail = true,
                    EmailTemplate = EmailTemplate.GenericNotification,
                    EmailData = new
                    {
                        UserName = user.FullName ?? "Customer",
                        Title = title,
                        Body = message
                    }
                });
            }

            await LogAdminActionAsync(
                request.AdminEmail, 
                request.IsApproved ? "KYC_APPROVE" : "KYC_REJECT", 
                request.UserId.ToString(), 
                request.AdminNotes, 
                "0.0.0.0"
            );

            return true;
        }

        public async Task<bool> ToggleUserActiveAsync(Guid userId, string adminEmail)
        {
            var user = await _authRepository.GetUserByIdAsync(userId);
            if (user == null) return false;

            user.IsActive = !user.IsActive;
            user.UpdatedAt = DateTimeOffset.UtcNow;
            await _authRepository.UpdateUserAsync(user);

            await LogAdminActionAsync(
                adminEmail, 
                user.IsActive ? "USER_ACTIVATE" : "USER_SUSPEND", 
                userId.ToString(), 
                $"User active status set to {user.IsActive}", 
                "0.0.0.0"
            );

            return true;
        }

        public async Task<byte[]> GenerateDailyReconciliationReportAsync(DateTime date)
        {
            // Placeholder for CSV/PDF generation
            var csv = $"Date,TotalUsers,TotalGoldLiabilityMg\n{date:yyyy-MM-dd},{await _adminRepository.GetTotalUsersCountAsync()},{await _adminRepository.GetTotalGoldLiabilityMgAsync()}";
            return System.Text.Encoding.UTF8.GetBytes(csv);
        }
    }
}
