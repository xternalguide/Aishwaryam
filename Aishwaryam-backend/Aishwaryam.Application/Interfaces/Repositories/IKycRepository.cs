using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Aishwaryam.Domain.Entities;

namespace Aishwaryam.Application.Interfaces.Repositories
{
    public interface IKycRepository
    {
        Task<KycDocument> AddKycDocumentAsync(KycDocument document);
        Task<KycDocument?> GetKycDocumentAsync(Guid id);
        Task<List<KycDocument>> GetUserKycDocumentsAsync(Guid userId);
        Task UpdateKycDocumentAsync(KycDocument document);
        Task<string> GetUserKycLevelAsync(Guid userId);
    }
}
