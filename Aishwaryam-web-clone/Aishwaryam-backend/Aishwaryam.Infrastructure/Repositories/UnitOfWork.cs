using System.Threading.Tasks;
using Aishwaryam.Application.Interfaces.Repositories;
using Aishwaryam.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Storage;

namespace Aishwaryam.Infrastructure.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly ApplicationDbContext _context;
        private IDbContextTransaction? _transaction;

        public UnitOfWork(ApplicationDbContext context)
        {
            _context = context;
        }

        private int _transactionDepth = 0;

        public async Task BeginTransactionAsync()
        {
            _transactionDepth++;
            if (_transactionDepth == 1)
            {
                _transaction = await _context.Database.BeginTransactionAsync();
            }
        }

        public async Task CommitAsync()
        {
            _transactionDepth--;
            if (_transactionDepth <= 0)
            {
                _transactionDepth = 0;
                if (_transaction != null)
                {
                    await _transaction.CommitAsync();
                    await _transaction.DisposeAsync();
                    _transaction = null;
                }
            }
        }

        public async Task RollbackAsync()
        {
            _transactionDepth = 0;
            if (_transaction != null)
            {
                await _transaction.RollbackAsync();
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

        public void Dispose()
        {
            _transaction?.Dispose();
            _context.Dispose();
        }
    }
}
