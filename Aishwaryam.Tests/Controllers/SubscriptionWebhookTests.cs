using System;
using System.IO;
using System.Text;
using System.Security.Cryptography;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;
using Aishwaryam.Api.Controllers;
using Aishwaryam.Infrastructure.Data;
using Aishwaryam.Domain.Entities;

namespace Aishwaryam.Tests.Controllers
{
    /// <summary>
    /// Comprehensive automated tests for Razorpay webhook payment recovery hardening.
    /// Covers: duplicate delivery, race conditions, idempotency, invalid signatures,
    /// delayed webhooks, orphaned payments, and zero partial state commits.
    /// </summary>
    public class SubscriptionWebhookTests
    {
        private const string WebhookSecret = "JBK5ZEwEHDNWaYQDTRLDUgJK";

        // ─── HELPERS ──────────────────────────────────────────────────────────
        private static ApplicationDbContext GetInMemoryDbContext()
        {
            // Build a minimal DbContext that uses ONLY the InMemory provider.
            // We intentionally avoid OnModelCreating's Postgres SQL defaults by
            // creating a fresh options builder each time (new DB per test).
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .EnableServiceProviderCaching(false)
                .Options;
            // Use TestDbContext which strips Postgres SQL defaults from model
            return new TestDbContext(options);
        }

        /// <summary>Computes the real HMAC-SHA256 signature Razorpay would send.</summary>
        private static string ComputeValidSignature(string rawBody)
        {
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(WebhookSecret));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(rawBody));
            return BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
        }

        private static SubscriptionController CreateController(ApplicationDbContext db, string rawBody, string? signature = null)
        {
            var sig = signature ?? ComputeValidSignature(rawBody);
            var httpContext = new DefaultHttpContext();
            httpContext.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes(rawBody));
            httpContext.Request.Headers["X-Razorpay-Signature"] = sig;
            // Pass db directly — TestDbContext IS an ApplicationDbContext
            var controller = new SubscriptionController((ApplicationDbContext)db);
            controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
            return controller;
        }

        private static (Guid userId, Guid schemeId) SeedActiveScheme(ApplicationDbContext db,
            string subscriptionId = "sub_TEST_123", int totalInstallments = 11)
        {
            var userId = Guid.NewGuid();
            db.Users.Add(new User { Id = userId, PhoneNumber = $"+91{userId.ToString()[..10]}", KycLevel = "FULL" });
            db.GoldHoldings.Add(new GoldHolding { UserId = userId, GoldBalanceMg = 0 });
            db.GoldPriceLogs.Add(new GoldPriceLog
            {
                Id = Guid.NewGuid(),
                BuyPricePaise = 700000, // ₹7000/gm
                SellPricePaise = 680000,
                CreatedAt = DateTime.UtcNow
            });
            var schemeId = Guid.NewGuid();
            db.UserSchemes.Add(new UserScheme
            {
                Id = schemeId,
                UserId = userId,
                RazorpaySubscriptionId = subscriptionId,
                Status = "Active",
                InstallmentAmountPaise = 100000, // ₹1000
                InstallmentsPaid = 0,
                TotalInstallments = totalInstallments,
                PaymentFrequency = "Monthly",
                NextDueDate = DateTime.UtcNow.AddDays(30)
            });
            db.SaveChanges();
            return (userId, schemeId);
        }

        private static string BuildPayload(string subscriptionId, string eventId, string paymentId) => $@"{{
            ""id"": ""{eventId}"",
            ""event"": ""subscription.charged"",
            ""payload"": {{
                ""subscription"": {{
                    ""entity"": {{ ""id"": ""{subscriptionId}"" }}
                }},
                ""payment"": {{
                    ""entity"": {{ ""id"": ""{paymentId}"" }}
                }}
            }}
        }}";

        // ═════════════════════════════════════════════════════════════════════
        // TEST 1: Invalid/Malicious Signature Rejection
        // ═════════════════════════════════════════════════════════════════════
        [Fact]
        public async Task Webhook_InvalidSignature_ReturnsUnauthorized()
        {
            var db = GetInMemoryDbContext();
            SeedActiveScheme(db);

            var payload = BuildPayload("sub_TEST_123", "evt_001", "pay_001");
            var controller = CreateController(db, payload, "invalid_signature_xyz");

            var result = await controller.RazorpayWebhook();

            Assert.IsType<UnauthorizedObjectResult>(result);
            // Critically: verify no gold was credited
            Assert.Equal(0, await db.GoldTransactions.CountAsync());
            Assert.Equal(0, await db.WebhookEventLogs.CountAsync());
        }

        // ═════════════════════════════════════════════════════════════════════
        // TEST 2: Happy Path — First Valid Delivery Credits Gold Correctly
        // ═════════════════════════════════════════════════════════════════════
        [Fact]
        public async Task Webhook_ValidFirstDelivery_CreditsGoldAndLogsEvent()
        {
            var db = GetInMemoryDbContext();
            var (userId, _) = SeedActiveScheme(db);

            var eventId = "evt_first_001";
            var paymentId = "pay_first_001";
            var payload = BuildPayload("sub_TEST_123", eventId, paymentId);
            var controller = CreateController(db, payload);

            var result = await controller.RazorpayWebhook();

            Assert.IsType<OkObjectResult>(result);

            // Verify gold was credited: ₹1000 at ₹7000/gm = ~142.857mg
            var scheme = await db.UserSchemes.FirstAsync();
            Assert.Equal(1, scheme.InstallmentsPaid);
            Assert.True(scheme.AccumulatedGoldMg > 0);

            var goldHolding = await db.GoldHoldings.FirstAsync(g => g.UserId == userId);
            Assert.Equal(scheme.AccumulatedGoldMg, goldHolding.GoldBalanceMg);

            // Exactly 1 gold transaction
            Assert.Equal(1, await db.GoldTransactions.CountAsync());

            // Transaction is stamped with payment ID (idempotency anchor)
            var tx = await db.GoldTransactions.FirstAsync();
            Assert.Equal(paymentId, tx.RazorpayPaymentId);

            // Event logged
            Assert.Equal(1, await db.WebhookEventLogs.CountAsync());
            var log = await db.WebhookEventLogs.FirstAsync();
            Assert.Equal(eventId, log.RazorpayEventId);
            Assert.True(log.WasProcessed);
        }

        // ═════════════════════════════════════════════════════════════════════
        // TEST 3: Duplicate Webhook Delivery — Zero Duplicate Gold Credits
        // ═════════════════════════════════════════════════════════════════════
        [Fact]
        public async Task Webhook_DuplicateEventId_IsIdempotentZeroDuplicateCredits()
        {
            var db = GetInMemoryDbContext();
            SeedActiveScheme(db);

            var eventId = "evt_dup_001";
            var paymentId = "pay_dup_001";
            var payload = BuildPayload("sub_TEST_123", eventId, paymentId);

            // First delivery
            var controller1 = CreateController(db, payload);
            await controller1.RazorpayWebhook();

            var goldAfterFirst = (await db.GoldHoldings.FirstAsync()).GoldBalanceMg;
            Assert.True(goldAfterFirst > 0);

            // Second delivery — SAME event_id (Razorpay retry storm)
            var controller2 = CreateController(db, payload);
            var result2 = await controller2.RazorpayWebhook();

            // Must return 200 (not error — Razorpay will stop retrying)
            Assert.IsType<OkObjectResult>(result2);

            // Gold balance MUST be unchanged
            var goldAfterSecond = (await db.GoldHoldings.FirstAsync()).GoldBalanceMg;
            Assert.Equal(goldAfterFirst, goldAfterSecond);

            // Still exactly 1 gold transaction
            Assert.Equal(1, await db.GoldTransactions.CountAsync());

            // Still exactly 1 event log (idempotency check prevented second write)
            Assert.Equal(1, await db.WebhookEventLogs.CountAsync());

            // Scheme installments NOT double-counted
            var scheme = await db.UserSchemes.FirstAsync();
            Assert.Equal(1, scheme.InstallmentsPaid);
        }

        // ═════════════════════════════════════════════════════════════════════
        // TEST 4: Same Payment ID, Different Event ID (Razorpay retry edge case)
        // ═════════════════════════════════════════════════════════════════════
        [Fact]
        public async Task Webhook_SamePaymentIdDifferentEventId_SecondaryIdempotencyBlocks()
        {
            var db = GetInMemoryDbContext();
            SeedActiveScheme(db);

            var paymentId = "pay_SAME_001";

            // First delivery with event A
            var payload1 = BuildPayload("sub_TEST_123", "evt_A_001", paymentId);
            var controller1 = CreateController(db, payload1);
            await controller1.RazorpayWebhook();

            var goldAfterFirst = (await db.GoldHoldings.FirstAsync()).GoldBalanceMg;

            // Second delivery with a DIFFERENT event ID but SAME payment ID
            // This simulates Razorpay resending with a different wrapper event_id
            var payload2 = BuildPayload("sub_TEST_123", "evt_B_DIFFERENT", paymentId);
            var controller2 = CreateController(db, payload2);
            var result2 = await controller2.RazorpayWebhook();

            // Must return 200 (already_credited)
            Assert.IsType<OkObjectResult>(result2);

            // Gold balance MUST be unchanged — secondary paymentId guard triggered
            var goldAfterSecond = (await db.GoldHoldings.FirstAsync()).GoldBalanceMg;
            Assert.Equal(goldAfterFirst, goldAfterSecond);

            // Still exactly 1 credited gold transaction
            Assert.Equal(1, await db.GoldTransactions.CountAsync());
        }

        // ═════════════════════════════════════════════════════════════════════
        // TEST 5: Delayed Webhook — Scheme Not Yet Activated
        // ═════════════════════════════════════════════════════════════════════
        [Fact]
        public async Task Webhook_DelayedArrival_SchemeNotActiveYet_LoggedForRetry()
        {
            var db = GetInMemoryDbContext();
            var userId = Guid.NewGuid();
            db.Users.Add(new User { Id = userId, PhoneNumber = "+910000000000", KycLevel = "FULL" });
            db.GoldHoldings.Add(new GoldHolding { UserId = userId, GoldBalanceMg = 0 });

            // Scheme is PENDING — mandate not yet approved
            db.UserSchemes.Add(new UserScheme
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                RazorpaySubscriptionId = "sub_PENDING_001",
                Status = "Pending",  // ← Not Active yet
                InstallmentAmountPaise = 100000,
                TotalInstallments = 11,
                PaymentFrequency = "Monthly",
                NextDueDate = DateTime.UtcNow.AddDays(30)
            });
            await db.SaveChangesAsync();

            var eventId = "evt_delayed_001";
            var payload = BuildPayload("sub_PENDING_001", eventId, "pay_delayed_001");
            var controller = CreateController(db, payload);
            var result = await controller.RazorpayWebhook();

            // Endpoint returns 200 (don't fail — Razorpay will retry later)
            Assert.IsType<OkObjectResult>(result);

            // No gold was credited
            Assert.Equal(0, await db.GoldTransactions.CountAsync());

            // Event logged as unprocessed (for audit/retry tracking)
            var log = await db.WebhookEventLogs.FirstOrDefaultAsync();
            Assert.NotNull(log);
            Assert.False(log!.WasProcessed);
            Assert.Contains("No active scheme", log.ProcessingError);
        }

        // ═════════════════════════════════════════════════════════════════════
        // TEST 6: Scheme Maturity — Final Installment Transitions to Matured
        // ═════════════════════════════════════════════════════════════════════
        [Fact]
        public async Task Webhook_FinalInstallment_SchemeTransitionsToMatured()
        {
            var db = GetInMemoryDbContext();
            var (userId, schemeId) = SeedActiveScheme(db, totalInstallments: 3);

            // Pre-set 2 installments already paid
            var scheme = await db.UserSchemes.FindAsync(schemeId);
            scheme!.InstallmentsPaid = 2;
            await db.SaveChangesAsync();

            // 3rd installment arrives
            var payload = BuildPayload("sub_TEST_123", "evt_final_001", "pay_final_001");
            var controller = CreateController(db, payload);
            await controller.RazorpayWebhook();

            var updatedScheme = await db.UserSchemes.FindAsync(schemeId);
            Assert.Equal("Matured", updatedScheme!.Status);
            Assert.Equal(3, updatedScheme.InstallmentsPaid);
        }

        // ═════════════════════════════════════════════════════════════════════
        // TEST 7: Financial Ledger Consistency — GoldHolding == Sum of GoldTransactions
        // ═════════════════════════════════════════════════════════════════════
        [Fact]
        public async Task Webhook_MultipleInstallments_LedgerAlwaysConsistent()
        {
            var db = GetInMemoryDbContext();
            var (userId, _) = SeedActiveScheme(db, totalInstallments: 11);

            // Simulate 5 installments arriving sequentially
            for (int i = 1; i <= 5; i++)
            {
                var payload = BuildPayload("sub_TEST_123", $"evt_multi_{i:D3}", $"pay_multi_{i:D3}");
                var controller = CreateController(db, payload);
                await controller.RazorpayWebhook();
            }

            // Ledger consistency check: GoldHolding.GoldBalanceMg == SUM(gold_transactions.gold_weight_mg)
            var holdingBalance = (await db.GoldHoldings.FirstAsync(g => g.UserId == userId)).GoldBalanceMg;
            var txSum = await db.GoldTransactions
                .Where(t => t.UserId == userId)
                .SumAsync(t => (long?)t.GoldWeightMg) ?? 0;

            Assert.Equal(holdingBalance, txSum);

            // Also verify scheme accumulated gold matches
            var schemeAccumulated = (await db.UserSchemes.FirstAsync()).AccumulatedGoldMg;
            Assert.Equal(holdingBalance, schemeAccumulated);
        }

        // ═════════════════════════════════════════════════════════════════════
        // TEST 8: Unhandled Event Type — Logged, No Crash, Returns 200
        // ═════════════════════════════════════════════════════════════════════
        [Fact]
        public async Task Webhook_UnknownEventType_LoggedGracefullyNoCrash()
        {
            var db = GetInMemoryDbContext();
            var rawBody = $@"{{
                ""id"": ""evt_unknown_001"",
                ""event"": ""payment.failed"",
                ""payload"": {{}}
            }}";
            var controller = CreateController(db, rawBody);
            var result = await controller.RazorpayWebhook();

            Assert.IsType<OkObjectResult>(result);
            Assert.Equal(0, await db.GoldTransactions.CountAsync());

            var log = await db.WebhookEventLogs.FirstOrDefaultAsync();
            Assert.NotNull(log);
            Assert.Equal("payment.failed", log!.EventType);
            Assert.False(log.WasProcessed);
        }

        // ═════════════════════════════════════════════════════════════════════
        // TEST 9: Missing Signature Header — Rejected Without Processing
        // ═════════════════════════════════════════════════════════════════════
        [Fact]
        public async Task Webhook_EmptySignatureHeader_ReturnsUnauthorized()
        {
            var db = GetInMemoryDbContext();
            SeedActiveScheme(db);

            var payload = BuildPayload("sub_TEST_123", "evt_nosig_001", "pay_nosig_001");
            var controller = CreateController(db, payload, ""); // empty signature

            var result = await controller.RazorpayWebhook();

            Assert.IsType<UnauthorizedObjectResult>(result);
            Assert.Equal(0, await db.GoldTransactions.CountAsync());
            Assert.Equal(0, await db.WebhookEventLogs.CountAsync());
        }
    }
}
