using System;
using System.Threading.Tasks;
using Aishwaryam.Application.DTOs.Kyc;

namespace Aishwaryam.Application.Interfaces.Services
{
    public interface IKycService
    {
        Task<KycStatusResponse> SubmitKycAsync(SubmitKycRequest request);
        Task<KycStatusResponse> GetKycStatusAsync(Guid userId);
    }
}
