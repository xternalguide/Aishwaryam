using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Aishwaryam.Infrastructure.Data;

namespace Aishwaryam.Tests
{
    /// <summary>
    /// Test-safe DbContext that inherits all domain mappings from ApplicationDbContext
    /// but strips PostgreSQL-specific SQL defaults and suppresses InMemory warnings
    /// so the EF Core InMemory provider can run all tests without a real database.
    /// </summary>
    public class TestDbContext : ApplicationDbContext
    {
        public TestDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            base.OnConfiguring(optionsBuilder);
            // InMemory provider does not support real transactions — suppress the warning
            // so the test does not throw. In production (Postgres) real transactions are used.
            optionsBuilder.ConfigureWarnings(w =>
                w.Ignore(InMemoryEventId.TransactionIgnoredWarning));
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Run all parent mappings (table names, column names, relationships, indexes)
            base.OnModelCreating(modelBuilder);

            // Strip PostgreSQL-specific default SQL from every property
            // so the In-Memory provider doesn't try (and fail) to execute SQL functions
            foreach (var entity in modelBuilder.Model.GetEntityTypes())
            {
                foreach (var prop in entity.GetProperties())
                {
                    prop.SetDefaultValueSql(null);

                    // Strip Postgres-specific column types that InMemory cannot handle
                    if (prop.GetColumnType() is { } colType &&
                        (colType == "jsonb" || colType == "json"))
                    {
                        prop.SetColumnType(null);
                        // Convert JsonDocument to string for InMemory compatibility
                        if (prop.ClrType == typeof(System.Text.Json.JsonDocument))
                        {
                            prop.SetValueConverter(new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<System.Text.Json.JsonDocument?, string?>(
                                v => v == null ? null : v.RootElement.GetRawText(),
                                v => v == null ? null : System.Text.Json.JsonDocument.Parse(v)
                            ));
                        }
                    }
                }
            }
        }
    }
}
