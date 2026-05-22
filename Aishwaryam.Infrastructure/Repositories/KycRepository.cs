using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Aishwaryam.Application.Interfaces.Repositories;
using Aishwaryam.Domain.Entities;
using Aishwaryam.Infrastructure.Data;

namespace Aishwaryam.Infrastructure.Repositories
{
    public class KycRepository : IKycRepository
    {
        private readonly ApplicationDbContext _context;

        public KycRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<KycDocument> AddKycDocumentAsync(KycDocument document)
        {
            _context.KycDocuments.Add(document);
            await _context.SaveChangesAsync();
            return document;
        }

        public async Task<KycDocument?> GetKycDocumentAsync(Guid id)
        {
            return await _context.KycDocuments.FindAsync(id);
        }

        public async Task<List<KycDocument>> GetUserKycDocumentsAsync(Guid userId)
        {
            return await _context.KycDocuments
                .Where(k => k.UserId == userId)
                .OrderByDescending(k => k.UploadedAt)
                .ToListAsync();
        }

        public async Task UpdateKycDocumentAsync(KycDocument document)
        {
            _context.KycDocuments.Update(document);
            await _context.SaveChangesAsync();
        }
    }
}
