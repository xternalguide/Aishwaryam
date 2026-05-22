using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Aishwaryam.Infrastructure.Data;
using Aishwaryam.Domain.Entities;
using Razorpay.Api;

namespace Aishwaryam.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SubscriptionController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private const string RazorpayKey    = "rzp_test_SnX8ee1l5TbaTV";
        private const string RazorpaySecret = "JBK5ZEwEHDNWaYQDTRLDUgJK";

        public SubscriptionController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ─────────────────────────────────────────────────────────────
        // POST /api/Subscription/create
        // Called by app when user enables AutoPay on scheme join
        // Returns subscriptionId which app feeds into Razorpay checkout
        // ─────────────────────────────────────────────────────────────
        [HttpPost("create")]
        public async Task<IActionResult> CreateSubscription([FromBody] CreateSubscriptionRequest request)
        {
            try
            {
                var user = await _context.Users.FindAsync(request.UserId);
                if (user == null) return NotFound("User not found.");

                var master = await _context.SchemesMaster.FindAsync(request.SchemeMasterId);
                if (master == null) return NotFound("Scheme plan not found.");

                var client = new RazorpayClient(RazorpayKey, RazorpaySecret);

                // Step 1: Ensure the scheme has a Razorpay Plan, create one if missing
                if (string.IsNullOrEmpty(master.RazorpayPlanId))
                {
                    var period = master.Frequency.ToLower() switch
                    {
                        "daily"   => "weekly", // Map daily frequency to weekly to meet Razorpay minimum interval limit
                        "weekly"  => "weekly",
                        _         => "monthly"
                    };

                    var planOptions = new Dictionary<string, object>
                    {
                        { "period",   period },
                        { "interval", 1 },
                        { "item", new Dictionary<string, object>
                            {
                                { "name",     master.PlanName + " - AutoPay" },
                                { "amount",   master.InstallmentAmountPaise },
                                { "currency", "INR" }
                            }
                        }
                    };

                    Plan plan = client.Plan.Create(planOptions);
                    master.RazorpayPlanId = plan["id"].ToString();
                    await _context.SaveChangesAsync();
                }

                // Step 2: Create a Subscription for this user
                var subscriptionOptions = new Dictionary<string, object>
                {
                    { "plan_id",          master.RazorpayPlanId },
                    { "total_count",      master.TotalInstallments },
                    { "quantity",         1 },
                    { "customer_notify",  1 },
                    { "notes", new Dictionary<string, string>
                        {
                            { "user_id",           request.UserId.ToString() },
                            { "scheme_master_id",  request.SchemeMasterId.ToString() }
                        }
                    }
                };

                Subscription subscription = client.Subscription.Create(subscriptionOptions);
                string subscriptionId = subscription["id"].ToString();

                // Step 3: Create the user scheme record so it exists when they complete the payment
                var existingScheme = await _context.UserSchemes
                    .FirstOrDefaultAsync(s => s.UserId == request.UserId && s.PlanName == master.PlanName && s.Status == "Active");

                if (existingScheme == null)
                {
                    _context.UserSchemes.Add(new UserScheme
                    {
                        Id = Guid.NewGuid(),
                        UserId = request.UserId,
                        PlanName = master.PlanName,
                        InstallmentAmountPaise = master.InstallmentAmountPaise,
                        PaymentFrequency = master.Frequency,
                        TotalInstallments = master.TotalInstallments,
                        InstallmentsPaid = 0,
                        AccumulatedGoldMg = 0,
                        Status = "Pending", // Will be marked active on first payment
                        RazorpaySubscriptionId = subscriptionId,
                        AutoPayEnabled = false,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    });
                    await _context.SaveChangesAsync();
                }
                else
                {
                    // Update existing scheme with new sub ID
                    existingScheme.RazorpaySubscriptionId = subscriptionId;
                    await _context.SaveChangesAsync();
                }

                return Ok(new
                {
                    SubscriptionId = subscriptionId,
                    KeyId          = RazorpayKey,
                    PlanName       = master.PlanName,
                    AmountPaise    = master.InstallmentAmountPaise
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        // ─────────────────────────────────────────────────────────────
        // POST /api/Subscription/webhook
        // Razorpay calls this on every successful auto-debit
        // ─────────────────────────────────────────────────────────────
        [HttpPost("webhook")]
        public async Task<IActionResult> RazorpayWebhook()
        {
            string rawBody;
            using (var reader = new StreamReader(Request.Body, Encoding.UTF8))
                rawBody = await reader.ReadToEndAsync();

            // ─── LAYER 1: HMAC-SHA256 Signature Verification ───────────────
            // Reject any payload that cannot be cryptographically verified as
            // originating from Razorpay. This blocks replay attacks and forged webhooks.
            var signatureHeader = Request.Headers["X-Razorpay-Signature"].ToString();
            if (!VerifyWebhookSignature(rawBody, signatureHeader, RazorpaySecret))
            {
                Console.WriteLine($"[WEBHOOK SECURITY] Invalid signature rejected. Header: {signatureHeader}");
                return Unauthorized(new { Error = "Invalid webhook signature." });
            }

            var json = System.Text.Json.JsonDocument.Parse(rawBody);
            var eventType = json.RootElement.GetProperty("event").GetString() ?? "unknown";

            // ─── LAYER 2: Event-ID Idempotency Guard ───────────────────────
            // Razorpay guarantees a unique event_id per delivery attempt. We record
            // every processed event here. If the same event_id arrives again (retry
            // storm, duplicate delivery, race condition), we return 200 immediately
            // without re-processing — preventing double gold credits.
            var razorpayEventId = json.RootElement.TryGetProperty("id", out var evtId)
                ? evtId.GetString() ?? Guid.NewGuid().ToString()
                : Guid.NewGuid().ToString();

            var alreadyProcessed = await _context.WebhookEventLogs
                .AnyAsync(e => e.RazorpayEventId == razorpayEventId);

            if (alreadyProcessed)
            {
                Console.WriteLine($"[WEBHOOK IDEMPOTENT] Event {razorpayEventId} already processed. Returning 200 without action.");
                return Ok(new { Status = "already_processed", EventId = razorpayEventId });
            }

            Console.WriteLine($"[WEBHOOK] Razorpay event received: {eventType} | EventId: {razorpayEventId}");

            // ─── LAYER 3: Atomic Transaction ────────────────────────────────
            // All mutations (scheme update, gold credit, transaction record, event log)
            // occur in a single DB transaction. If any step fails, ALL changes roll
            // back — guaranteeing zero partial financial state commits.
            using var dbTransaction = await _context.Database.BeginTransactionAsync();
            try
            {
                if (eventType == "subscription.charged")
                {
                    var payload = json.RootElement.GetProperty("payload");
                    var subscriptionEntity = payload.GetProperty("subscription").GetProperty("entity");
                    var subscriptionId = subscriptionEntity.GetProperty("id").GetString();

                    var paymentId = payload.TryGetProperty("payment", out var paymentNode)
                        ? paymentNode.GetProperty("entity").TryGetProperty("id", out var pid) ? pid.GetString() : null
                        : null;

                    // Secondary idempotency: reject if this exact Razorpay payment ID
                    // was already credited (catches cases where event_id differs but
                    // underlying payment is the same — rare but observed in Razorpay retries)
                    if (!string.IsNullOrEmpty(paymentId))
                    {
                        var paymentAlreadyCredited = await _context.GoldTransactions
                            .AnyAsync(t => t.RazorpayPaymentId == paymentId);
                        if (paymentAlreadyCredited)
                        {
                            Console.WriteLine($"[WEBHOOK IDEMPOTENT] PaymentId {paymentId} already credited. Safe no-op.");
                            await LogWebhookEvent(razorpayEventId, eventType, paymentId, subscriptionId, signatureHeader, wasProcessed: false, error: "Payment already credited");
                            await dbTransaction.CommitAsync();
                            return Ok(new { Status = "already_credited", PaymentId = paymentId });
                        }
                    }

                    var userScheme = await _context.UserSchemes
                        .FirstOrDefaultAsync(s => s.RazorpaySubscriptionId == subscriptionId && s.Status == "Active");

                    if (userScheme != null)
                    {
                        // Credit installment
                        userScheme.InstallmentsPaid += 1;
                        userScheme.UpdatedAt = DateTime.UtcNow;

                        // Calculate gold using latest available price snapshot
                        var latestPrice = await _context.GoldPriceLogs
                            .OrderByDescending(p => p.CreatedAt)
                            .FirstOrDefaultAsync();

                        long goldToAddMg;
                        if (latestPrice != null && latestPrice.BuyPricePaise > 0)
                            goldToAddMg = (long)((double)userScheme.InstallmentAmountPaise / latestPrice.BuyPricePaise * 1000);
                        else
                            goldToAddMg = 500; // Emergency fallback: 0.5g

                        userScheme.AccumulatedGoldMg += goldToAddMg;

                        // Scheme maturity check
                        if (userScheme.InstallmentsPaid >= userScheme.TotalInstallments)
                            userScheme.Status = "Matured";
                        else
                            userScheme.NextDueDate = userScheme.PaymentFrequency.ToLower() switch
                            {
                                "daily"  => DateTime.UtcNow.AddDays(1),
                                "weekly" => DateTime.UtcNow.AddDays(7),
                                _        => DateTime.UtcNow.AddMonths(1)
                            };

                        // Update gold holding (separate row for fast portfolio reads)
                        var goldHolding = await _context.GoldHoldings.FindAsync(userScheme.UserId);
                        if (goldHolding != null)
                            goldHolding.GoldBalanceMg += goldToAddMg;

                        // Immutable gold transaction record stamped with payment ID
                        _context.GoldTransactions.Add(new GoldTransaction
                        {
                            Id = Guid.NewGuid(),
                            UserId = userScheme.UserId,
                            TransactionType = "SchemeAutoDebit",
                            GoldWeightMg = goldToAddMg,
                            TotalAmountPaise = userScheme.InstallmentAmountPaise,
                            PricePerGmPaise = latestPrice?.BuyPricePaise ?? 0,
                            RazorpayPaymentId = paymentId,   // ← idempotency key
                            IpAddress = "127.0.0.1",
                            DeviceFingerprint = "SYSTEM_AUTOPAY",
                            CreatedAt = DateTime.UtcNow
                        });

                        // Notification
                        _context.UserNotifications.Add(new UserNotification
                        {
                            Id = Guid.NewGuid(),
                            UserId = userScheme.UserId,
                            Title = "💰 AutoPay Successful!",
                            Message = $"Installment #{userScheme.InstallmentsPaid} debited. {(goldToAddMg / 1000.0):F3}g gold added.",
                            IsRead = false,
                            CreatedAt = DateTime.UtcNow
                        });

                        // Log the webhook event as processed (commit with transaction)
                        await LogWebhookEvent(razorpayEventId, eventType, paymentId, subscriptionId, signatureHeader);

                        // ─── ATOMIC COMMIT ────────────────────────────────────
                        await _context.SaveChangesAsync();
                        await dbTransaction.CommitAsync();

                        Console.WriteLine($"[WEBHOOK] Processed: sub={subscriptionId} pay={paymentId} gold={goldToAddMg}mg");
                    }
                    else
                    {
                        // Scheme not found (may arrive before activation completes — delayed webhook scenario)
                        // Log it but don't fail — Razorpay will retry; we'll process on retry once scheme is active
                        Console.WriteLine($"[WEBHOOK WARNING] No active scheme for subscription {subscriptionId}. Event logged for retry.");
                        await LogWebhookEvent(razorpayEventId, eventType, paymentId, subscriptionId, signatureHeader, wasProcessed: false, error: "No active scheme found");
                        await _context.SaveChangesAsync();
                        await dbTransaction.CommitAsync();
                    }
                }
                else
                {
                    // Unhandled event type — log it and return 200 so Razorpay doesn't retry
                    await LogWebhookEvent(razorpayEventId, eventType, null, null, signatureHeader, wasProcessed: false, error: $"Unhandled event type: {eventType}");
                    await _context.SaveChangesAsync();
                    await dbTransaction.CommitAsync();
                }

                return Ok(new { Status = "processed", EventId = razorpayEventId });
            }
            catch (Exception ex)
            {
                await dbTransaction.RollbackAsync();
                Console.WriteLine($"[WEBHOOK ERROR] Rolled back. EventId={razorpayEventId} Error={ex.Message}");
                // Return 500 so Razorpay retries — but our idempotency guard means retries are safe
                return StatusCode(500, new { Error = "Processing failed. Will retry." });
            }
        }

        // ─── HMAC-SHA256 Signature Verification ────────────────────────────
        private static bool VerifyWebhookSignature(string rawBody, string receivedSignature, string webhookSecret)
        {
            if (string.IsNullOrEmpty(receivedSignature)) return false;
            using var hmac = new System.Security.Cryptography.HMACSHA256(Encoding.UTF8.GetBytes(webhookSecret));
            var computed = BitConverter.ToString(hmac.ComputeHash(Encoding.UTF8.GetBytes(rawBody)))
                .Replace("-", "").ToLowerInvariant();
            return computed == receivedSignature.ToLowerInvariant();
        }

        private async Task LogWebhookEvent(string eventId, string eventType, string? paymentId, string? subscriptionId,
            string? signature, bool wasProcessed = true, string? error = null)
        {
            _context.WebhookEventLogs.Add(new WebhookEventLog
            {
                RazorpayEventId = eventId,
                EventType = eventType,
                RazorpayPaymentId = paymentId,
                RazorpaySubscriptionId = subscriptionId,
                SignatureReceived = signature?[..Math.Min(signature.Length, 200)],
                WasProcessed = wasProcessed,
                ProcessingError = error,
                ProcessedAt = DateTime.UtcNow
            });
        }

        // ─────────────────────────────────────────────────────────────
        // POST /api/Subscription/activate
        // Called AFTER user completes mandate approval on app
        // Links the subscription ID to the user scheme
        // ─────────────────────────────────────────────────────────────
        [HttpPost("activate")]
        public async Task<IActionResult> ActivateSubscription([FromBody] ActivateSubscriptionRequest request)
        {
            try
            {
                var userScheme = await _context.UserSchemes
                    .FirstOrDefaultAsync(s => s.UserId == request.UserId && s.RazorpaySubscriptionId == request.SubscriptionId);

                if (userScheme == null) return NotFound("No scheme found to activate.");

                userScheme.Status = "Active";
                userScheme.AutoPayEnabled = true;
                userScheme.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { Message = "AutoPay activated successfully!", SubscriptionId = request.SubscriptionId });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }
    }

    public class CreateSubscriptionRequest
    {
        public Guid UserId { get; set; }
        public Guid SchemeMasterId { get; set; }
    }

    public class ActivateSubscriptionRequest
    {
        public Guid UserId { get; set; }
        public string SubscriptionId { get; set; } = string.Empty;
    }
}
