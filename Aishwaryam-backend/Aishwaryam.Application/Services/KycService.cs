using System;
using System.Linq;
using System.Threading.Tasks;
using Aishwaryam.Application.DTOs.Kyc;
using Aishwaryam.Application.Interfaces.Repositories;
using Aishwaryam.Application.Interfaces.Services;
using Aishwaryam.Domain.Entities;

namespace Aishwaryam.Application.Services
{
    public class KycService : IKycService
    {
        private readonly IKycRepository _kycRepository;

        public KycService(IKycRepository kycRepository)
        {
            _kycRepository = kycRepository;
        }

        public async Task<KycStatusResponse> SubmitKycAsync(SubmitKycRequest request)
        {
            var kycDocument = new KycDocument
            {
                UserId = request.UserId,
                DocumentType = request.DocumentType,
                DocumentNumber = request.DocumentNumber,
                DocumentUrl = request.DocumentUrl
            };

            await _kycRepository.AddKycDocumentAsync(kycDocument);

            return new KycStatusResponse
            {
                Success = true,
                Message = "KYC Document submitted successfully. It is now under review.",
                Status = "UNDER_REVIEW"
            };
        }

        public async Task<KycStatusResponse> GetKycStatusAsync(Guid userId)
        {
            var docs = await _kycRepository.GetUserKycDocumentsAsync(userId);
            if (docs == null || !docs.Any())
            {
                return new KycStatusResponse
                {
                    Success = true,
                    Message = "No KYC documents found.",
                    Status = "PENDING"
                };
            }

            // Return the most recent document's status
            var latest = docs.OrderByDescending(d => d.CreatedAt).First();
            return new KycStatusResponse
            {
                Success = true,
                Message = "KYC status retrieved.",
                Status = latest.Status ?? "UNDER_REVIEW",
                RejectionReason = latest.RejectionReason,
                DocumentType = latest.DocumentType,
                DocumentNumber = latest.DocumentNumber,
                DocumentUrl = latest.DocumentUrl,
                UploadedAt = latest.UploadedAt,
                Documents = docs.Select(d => new KycDocumentDto
                {
                    DocumentType = d.DocumentType,
                    DocumentNumber = d.DocumentNumber,
                    DocumentUrl = d.DocumentUrl,
                    Status = d.Status,
                    RejectionReason = d.RejectionReason,
                    UploadedAt = d.UploadedAt
                }).ToList()
            };
        }
    }
}
