using System;
using System.Threading;
using System.Threading.Tasks;
using Aishwaryam.Application.Interfaces.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Aishwaryam.Infrastructure.Jobs
{
    public class SchemeMaturityJob : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<SchemeMaturityJob> _logger;
        private readonly TimeSpan _checkInterval = TimeSpan.FromSeconds(30); // Check every 30 seconds for tests

        public SchemeMaturityJob(IServiceProvider serviceProvider, ILogger<SchemeMaturityJob> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Scheme Maturity Background Job is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var schemeService = scope.ServiceProvider.GetRequiredService<ISchemeService>();
                        await schemeService.ProcessMaturityAsync();
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while processing scheme maturity.");
                }

                await Task.Delay(_checkInterval, stoppingToken);
            }

            _logger.LogInformation("Scheme Maturity Background Job is stopping.");
        }
    }
}
