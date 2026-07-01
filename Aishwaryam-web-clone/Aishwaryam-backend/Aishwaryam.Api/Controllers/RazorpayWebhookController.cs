using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Aishwaryam.Application.Interfaces.Services;
using Aishwaryam.Domain.Entities;
using Aishwaryam.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Aishwaryam.Api.Controllers
{
    /// <summary>
    /// Production Razorpay Webhook Controller.
    /// Handles asynchronous payment fulfillment via server-to-server callbacks.
    /// Enforces HMAC SHA256 signature verification and idempotency.
    /// </summary>
    [ApiController]
    [Route("api/webhook/razorpay")]
    public class RazorpayWebhookController : ControllerBase
    {
        private readonly IPaymentFulfillmentService _fulfillmentService;
        private readonly ApplicationDbContext _context;
        private readonly string _webhookSecret;
        private readonly ILogger<RazorpayWebhookController> _logger;

        public RazorpayWebhookController(
            IPaymentFulfillmentService fulfillmentService,
            ApplicationDbContext context,
            IConfiguration config,
            ILogger<RazorpayWebhookController> logger)
        {
            _fulfillmentService = fulfillmentService;
            _context = context;
            _webhookSecret = config["Razorpay:WebhookSecret"] ?? "local_dev_secret_only";
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> HandleWebhook()
        {
            try
            {
                // 1. Read Payload and Signature
                string signature = Request.Headers["x-razorpay-signature"].ToString();
                using var reader = new StreamReader(Request.Body);
                string payload = await reader.ReadToEndAsync();

                _logger.LogInformation("Webhook received. Signature: {Signature}", string.IsNullOrEmpty(signature) ? "MISSING" : "PRESENT");

                // 2. Verify Signature
                if (!VerifySignature(payload, signature))
                {
                    _logger.LogWarning("Webhook signature verification failed.");
                    return Unauthorized(new { error = "Invalid signature" });
                }

                // 3. Parse Event
                using var doc = JsonDocument.Parse(payload);
                var root = doc.RootElement;
                
                string eventType = root.GetProperty("event").GetString() ?? "unknown";
                string eventId = root.GetProperty("account_id").GetString() + "_" + eventType + "_" + DateTime.UtcNow.Ticks; // Razorpay doesn't always send an event id, we generate a pseudo-unique one if missing, or we could extract it if we need to strictly enforce. Let's look for standard fields.
                
                // Try to get actual event ID or fallback to payment ID
                string paymentId = "";
                string orderId = "";

                if (root.TryGetProperty("payload", out var payloadElement) &&
                    payloadElement.TryGetProperty("payment", out var paymentElement) &&
                    paymentElement.TryGetProperty("entity", out var entityElement))
                {
                    paymentId = entityElement.GetProperty("id").GetString() ?? "";
                    orderId = entityElement.TryGetProperty("order_id", out var oid) ? oid.GetString() ?? "" : "";
                    
                    // Use payment ID as the unique event identifier for idempotency
                    eventId = $"evt_{eventType}_{paymentId}";
                }

                _logger.LogInformation("Processing webhook event: {EventType} | EventId: {EventId}", eventType, eventId);

                // 4. Idempotency Check
                var existingEvent = await _context.WebhookEventLogs.FirstOrDefaultAsync(e => e.RazorpayEventId == eventId);
                if (existingEvent != null)
                {
                    _logger.LogInformation("Webhook event {EventId} already processed.", eventId);
                    return Ok(new { status = "already_processed" });
                }

                // Log Event Initial State
                var eventLog = new WebhookEventLog
                {
                    RazorpayEventId = eventId,
                    EventType = eventType,
                    RazorpayPaymentId = paymentId,
                    SignatureReceived = signature,
                    WasProcessed = false
                };
                _context.WebhookEventLogs.Add(eventLog);
                await _context.SaveChangesAsync();

                // 5. Process Specific Events
                if (eventType == "payment.captured" || eventType == "order.paid")
                {
                    if (string.IsNullOrEmpty(orderId) || string.IsNullOrEmpty(paymentId))
                    {
                        eventLog.ProcessingError = "Missing order_id or payment_id";
                        await _context.SaveChangesAsync();
                        return BadRequest("Invalid payload structure for payment.captured");
                    }

                    // Call the robust fulfillment service
                    var result = await _fulfillmentService.FulfillPaymentAsync(orderId, paymentId, "Webhook");
                    
                    eventLog.WasProcessed = true;
                    if (!result.Success && result.Message != "Already processed" && result.Message != "Already SUCCESS")
                    {
                        eventLog.WasProcessed = false;
                        eventLog.ProcessingError = result.Message;
                    }
                    
                    await _context.SaveChangesAsync();
                }
                else
                {
                    // Unhandled events are just logged
                    _logger.LogInformation("Ignoring unhandled webhook event: {EventType}", eventType);
                    eventLog.WasProcessed = true;
                    eventLog.ProcessingError = "Ignored unhandled event";
                    await _context.SaveChangesAsync();
                }

                return Ok(new { status = "ok" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Webhook processing failed.");
                return StatusCode(500, new { error = "Internal server error during webhook processing" });
            }
        }

        private bool VerifySignature(string payload, string signature)
        {
            if (string.IsNullOrEmpty(signature)) return false;

            try
            {
                byte[] secretBytes = Encoding.UTF8.GetBytes(_webhookSecret);
                byte[] payloadBytes = Encoding.UTF8.GetBytes(payload);

                using var hmac = new HMACSHA256(secretBytes);
                byte[] hashBytes = hmac.ComputeHash(payloadBytes);
                
                string generatedSignature = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();

                return signature == generatedSignature;
            }
            catch
            {
                return false;
            }
        }
    }
}
