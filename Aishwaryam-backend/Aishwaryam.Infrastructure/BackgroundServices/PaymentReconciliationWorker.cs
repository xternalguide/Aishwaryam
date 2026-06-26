using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Aishwaryam.Application.Interfaces.Services;
using Aishwaryam.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Razorpay.Api;
using Microsoft.Extensions.Configuration;

namespace Aishwaryam.Infrastructure.BackgroundServices
{
    public class PaymentReconciliationWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<PaymentReconciliationWorker> _logger;
        private readonly string _razorpayKey;
        private readonly string _razorpaySecret;

        public PaymentReconciliationWorker(
            IServiceProvider serviceProvider,
            ILogger<PaymentReconciliationWorker> logger,
            IConfiguration config)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
            _razorpayKey = config["Razorpay:Key"] ?? "";
            _razorpaySecret = config["Razorpay:Secret"] ?? "";
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Payment Reconciliation Worker started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ReconcilePendingPaymentsAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error during payment reconciliation cycle.");
                }

                // Wait for 10 minutes
                await Task.Delay(TimeSpan.FromMinutes(10), stoppingToken);
            }
        }

        private async Task ReconcilePendingPaymentsAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var fulfillmentService = scope.ServiceProvider.GetRequiredService<IPaymentFulfillmentService>();

            // Find payments stuck in PENDING for more than 15 minutes but less than 24 hours
            var cutoff = DateTime.UtcNow.AddMinutes(-15);
            var maxAge = DateTime.UtcNow.AddHours(-24);

            var pendingPayments = await context.Payments
                .Where(p => p.Status == "PENDING" && p.CreatedAt <= cutoff && p.CreatedAt >= maxAge)
                .ToListAsync();

            if (!pendingPayments.Any()) return;

            _logger.LogInformation("Found {Count} pending payments for reconciliation.", pendingPayments.Count);

            RazorpayClient client = new RazorpayClient(_razorpayKey, _razorpaySecret);

            foreach (var payment in pendingPayments)
            {
                try
                {
                    Order order = client.Order.Fetch(payment.ProviderOrderId);
                    string status = order["status"].ToString();

                    if (status == "paid")
                    {
                        _logger.LogInformation("Reconciling Order {OrderId}: Status is PAID. Triggering fulfillment.", payment.ProviderOrderId);
                        
                        // Fetch payments associated with this order
                        var fetchOptions = new Dictionary<string, object>
                        {
                            { "order_id", payment.ProviderOrderId }
                        };
                        var paymentsList = client.Payment.All(fetchOptions);
                        
                        if (paymentsList != null && paymentsList.Any())
                        {
                            var successfulPayment = paymentsList.FirstOrDefault(p => p["status"].ToString() == "captured" || p["status"].ToString() == "authorized");
                            if (successfulPayment != null)
                            {
                                string razorpayPaymentId = successfulPayment["id"].ToString();
                                await fulfillmentService.FulfillPaymentAsync(payment.ProviderOrderId, razorpayPaymentId, "AUTO_RECONCILE");
                            }
                        }
                    }
                    else if (status == "attempted" || status == "created")
                    {
                        // Still pending on Razorpay side, leave as is
                        _logger.LogDebug("Order {OrderId} still pending on Razorpay.", payment.ProviderOrderId);
                    }
                    else
                    {
                        // Probably failed or expired
                        _logger.LogWarning("Order {OrderId} has unexpected status {Status}. Marking as FAILED.", payment.ProviderOrderId, status);
                        payment.Status = "FAILED";
                        payment.UpdatedAt = DateTime.UtcNow;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to reconcile individual payment {OrderId}", payment.ProviderOrderId);
                }
            }

            await context.SaveChangesAsync();
        }
    }
}
