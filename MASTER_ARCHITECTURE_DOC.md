# Aishwaryam Digital Gold
## Master Architecture & Engineering Document
**Version:** 1.0 | **Date:** 2026-05-14 | **Prepared by:** AI Engineering Session

> **Purpose:** This is the single source of truth for the Aishwaryam platform — client presentation, developer reference, team onboarding, and production roadmap in one document.

---

## Part 1 — The Product

### What This App Is
"Aishwaryam At Your Home" is a **scheme-based digital gold investment platform**. Users invest money into gold savings schemes, earn bonus gold based on investment timing, and redeem gold as jewellery, cash, or physical delivery after the scheme matures.

**Differentiator vs. Pothy DigiGold:** More generous bonus tiers rewarding early investment.

### The Core Scheme Business Logic

```
Example: 330-Day Gold Savings Scheme

USER JOINS → Scheme start date recorded → Lock-in begins

INVESTMENT (Flexible — no mandatory schedule):
  User can invest any amount, any day, within scheme period.
  Each investment buys gold at live price + earns a bonus.

BONUS TIER TABLE:
┌──────────────┬────────────────────────────────────────────────────────┐
│ Days         │ Bonus on Investment Amount                             │
├──────────────┼────────────────────────────────────────────────────────┤
│ Day 0–75     │ 7.5% → converted to gold at live price                │
│ Day 76–150   │ 5.5% → converted to gold at live price                │
│ Day 151–225  │ 3.5% → converted to gold at live price                │
│ Day 226–330  │ 1.5% → converted to gold at live price                │
└──────────────┴────────────────────────────────────────────────────────┘

Example: User invests ₹1,000 on Day 30 (price = ₹7,500/gm)
  → Gold bought     = 1000/7500 × 1000mg = 133.33mg
  → Bonus amount    = 7.5% of ₹1,000 = ₹75
  → Bonus gold      = 75/7500 × 1000mg = 10mg
  → Total credited  = 143.33mg

ON MATURITY (Day 330):
  → Scheme status = Matured
  → Gold unlocked for redemption
  → User chooses: Jewellery / Cash / Physical Gold Delivery
  → Admin processes and approves
```

---

## Part 2 — System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     AISHWARYAM PLATFORM                          │
│                                                                 │
│  ┌──────────────┐   REST API   ┌───────────────────────────┐   │
│  │ Android App  │ ──────────►  │ ASP.NET Core Backend      │   │
│  │ Kotlin+MVVM  │ ◄──────────  │ Clean Architecture        │   │
│  │ Jetpack      │             │ 14 Controllers             │   │
│  │ Compose      │             └─────────────┬─────────────┘   │
│  └──────────────┘                           │                   │
│                                   ┌─────────▼─────────────┐   │
│  ┌──────────────┐                 │ PostgreSQL Database    │   │
│  │  Admin Panel  │ ─────────────► │ 33 Tables             │   │
│  │  (HTML/JS)   │                 │ Full audit trail       │   │
│  └──────────────┘                 └───────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Navigation Flow
```
Splash → token exists? → MPIN Screen → verify MPIN → fetch profile → Dashboard
         no token     → Login (OTP)  → new user?  → Onboarding → Login
                                       existing?  → MPIN Screen
```

### Tech Stack
| Layer | Technology |
|---|---|
| Android | Kotlin, Jetpack Compose, MVVM, Retrofit, Coroutines |
| Backend | ASP.NET Core 8, Clean Architecture (Domain/App/Infra/API) |
| Database | PostgreSQL (33 tables) |
| Payments | Razorpay SDK (Android) + REST API (backend) |
| Auth | Phone OTP + 6-digit MPIN |

---

## Part 3 — Current State Audit

### Android Screens
| Screen | Status | Known Issues |
|---|---|---|
| Splash + Transitions | ✅ Done | Fade animation working |
| Login (Phone OTP) | ✅ Done | Auto-hides keyboard at 10 digits |
| MPIN Entry | ✅ Done | Responsive, auto-hides keyboard at 6 digits |
| Onboarding (3 steps) | ✅ Done | All state survives rotation |
| Dashboard | ✅ Done | Loads after profile fetch |
| Buy Gold | ✅ Done | Missing: GST display, price lock |
| Sell Gold | ✅ Done | Missing: scheme lock-in check |
| Scheme List | ✅ Done | Missing: bonus tier display |
| Scheme Dashboard | ✅ Done | Missing: countdown, progress |
| Profile | ✅ Done | Mostly static |
| Transactions | ✅ Done | No pagination |

### Missing Screens (Priority)
| Priority | Screen | Why Critical |
|---|---|---|
| 🔴 HIGH | Payment Success Screen | User has no confirmation after paying |
| 🔴 HIGH | Payment Failed / Retry | No recovery UI |
| 🔴 HIGH | Scheme Detail Screen | Core product feature not shown |
| 🔴 HIGH | Scheme Invest Screen | Flexible investment flow missing |
| 🟡 MED | Notifications Inbox | DB tables exist, no UI |
| 🟡 MED | Withdrawal Request | DB tables exist, no UI |
| 🟡 MED | KYC Status Tracking | User doesn't know KYC progress |
| 🟡 MED | Change MPIN | Backend exists, no UI |
| 🟡 MED | Dispute / Support | No user complaint flow |

### Backend Controllers (Built)
Auth · Gold · Scheme · Payment · KYC · User · Banking · Wallet · Audit · Banner · Offers · Notifications · ReferralNetwork · Subscription

---

## Part 4 — Critical Bugs in Current Code

These were found by reading actual source files:

| # | File | Bug | Risk |
|---|---|---|---|
| 1 | `PaymentController.cs:66` | No Razorpay HMAC signature verification — trusts app blindly | Anyone can fake a payment and get free gold |
| 2 | `PaymentController.cs:17` | Razorpay keys hardcoded as strings | Any APK decompiler exposes your secret key |
| 3 | `GoldController.cs` | 0% GST on gold purchases — legally required 3% | Non-compliant with Indian tax law |
| 4 | `SchemeController.cs` | `SellGold` never checks if user has active scheme lock-in | User can steal scheme gold before maturity |
| 5 | `idempotency_keys` table | Table exists in DB schema, never used in any controller | Double-payment = double gold bug |
| 6 | `AuthService` | OTP only written to `Console.WriteLine`, not sent via SMS | Demo will fail — OTP invisible to users |
| 7 | `gold_price_cache.json` | Gold price from a static file, no 30-second price lock | User sees one price, gets gold calculated at different price |
| 8 | `DeviceFingerprint` | Defaults to hardcoded `"web_default_fingerprint"` | No real device tracking — compliance failure |

---

## Part 5 — Financial Engineering Rules

### Rule 1: Immutable Ledger (No UPDATE Ever)
```
❌ NEVER: UPDATE wallet_ledger SET amount = 500 WHERE id = 'xyz'
✅ ALWAYS: INSERT a reversal entry with negative amount + reference to original

Every financial event creates entries in wallet_ledger.
Sum of all entries = current balance.
Errors corrected via REVERSAL rows, never by editing history.
```

### Rule 2: Ledger + Aggregate Pattern
```
wallet_ledger     = immutable truth (append-only)
wallets           = precomputed balance (updated atomically with ledger)
gold_holdings     = precomputed gold (updated atomically with transactions)

RULE: Both are always updated in the SAME DB transaction.
If one fails → both roll back.

❌ NEVER: SUM(wallet_ledger) at runtime per request — breaks at 10k transactions
✅ ALWAYS: Read precomputed wallet.inr_balance_paise
```

### Rule 3: Idempotency on Every Payment
```
Before processing any payment:
  1. Check idempotency_keys WHERE key = razorpay_payment_id
  2. If found → return cached response, do nothing
  3. If not found → process payment
  4. After processing → INSERT into idempotency_keys in same DB transaction

This prevents:
  - User tapping Pay twice
  - App retry after timeout
  - Webhook + app both calling /verify simultaneously
```

### Rule 4: Gold Price Snapshot on Every Transaction
```sql
-- Every gold_transaction must store:
rate_per_gm_paise   BIGINT    -- exact price at moment of transaction
rate_source         VARCHAR   -- 'LIVE_FEED', 'ADMIN_SET', 'CACHED'
rate_timestamp      TIMESTAMPTZ -- when this rate was fetched
rate_lock_token     UUID      -- links to 30-second price lock

-- This is your legal proof if user disputes the price used.
```

---

## Part 6 — Payment Architecture

### Professional Payment Flow (Required)
```
1. App → POST /api/Payment/create-order
2. Backend creates Razorpay order → stores in payments table (status=PENDING)
3. App saves orderId to SessionManager (crash recovery)
4. App opens Razorpay SDK
5. User pays → Razorpay debits bank

PATH A (Success — Webhook):
6a. Razorpay fires POST /api/Payment/webhook
6b. Backend verifies HMAC signature
6c. Backend stores in webhook_event_logs (status=unprocessed)
6d. Returns 200 immediately
6e. Background job processes webhook → credits gold → marks processed

PATH B (App confirms before webhook):
6b. App calls POST /api/Payment/verify with signature
6c. Backend verifies HMAC → checks idempotency → credits gold

CRASH RECOVERY:
7. On next app launch → checks SessionManager for pendingOrderId
8. Calls GET /api/Payment/status/{orderId} → syncs state
```

### Razorpay Signature Verification (Must Add)
```csharp
private bool VerifyRazorpaySignature(string orderId, string paymentId, string signature)
{
    var secret = _config["Razorpay:Secret"]; // From appsettings, NOT hardcoded
    var message = orderId + "|" + paymentId;
    using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
    var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(message));
    var expected = BitConverter.ToString(hash).Replace("-", "").ToLower();
    return expected == signature;
}
```

---

## Part 7 — Regulatory & Legal Requirements (India)

| Regulation | Requirement | Current Status | Action Needed |
|---|---|---|---|
| GST Council | 3% GST on every gold purchase | ❌ Not implemented | Add to BuyGold, store in invoices table |
| PMLA 2002 | KYC mandatory for transactions > ₹50,000 | ❌ No limit check | Add KYC tier enforcement |
| IT Act (194Q) | 1% TDS if annual sell > ₹1 lakh | ❌ Not tracked | Track annual sell value per user |
| Consumer Protection | Dispute resolution mandatory | ❌ No dispute flow | Build dispute screen + admin queue |
| RBI (informal) | Max ₹2L buy/day without full KYC | ❌ No limit | Add daily cumulative check |

### KYC Tier Limits (Enforce in Code)
| Action | BASIC (phone only) | AADHAAR | FULL (PAN+Aadhaar) |
|---|---|---|---|
| Buy Gold/day | ₹10,000 | ₹50,000 | ₹2,00,000 |
| Sell Gold/day | ₹5,000 | ₹25,000 | ₹1,00,000 |
| Join Scheme | ₹5,000 max | ₹25,000 | No limit |
| Withdraw Cash | ❌ | ₹10,000 | ₹1,00,000 |

---

## Part 8 — Infrastructure (Background Jobs)

Install Hangfire. Register these jobs on startup:

| Job | Schedule | Purpose |
|---|---|---|
| `SchemeMaturityUnlockJob` | Daily 6 AM | Unlock matured schemes, notify users |
| `GoldReconciliationJob` | Daily 11:59 PM | SUM(gold_holdings) vs SUM(transactions) — alert on mismatch |
| `PaymentReconciliationJob` | Daily 10 PM | Compare Razorpay settlements vs payments table |
| `FailedWebhookRetryJob` | Every 5 min | Retry unprocessed webhook_event_logs |
| `SchemeMaturityReminderJob` | Daily 8 AM | Send push: 30-day, 7-day, 1-day reminders |
| `KycReminderJob` | Daily 9 AM | Nudge BASIC KYC users after 7 days |
| `DailyInvestmentReminderJob` | Daily 7 PM | Remind active scheme users who haven't invested today |

---

## Part 9 — Push Notifications (FCM)

### Notification Events
| Trigger | Message |
|---|---|
| Payment Success | "₹1,000 invested! 0.133g gold + 0.010g bonus added ✓" |
| Payment Failed | "Payment of ₹1,000 failed. Tap to retry." |
| Scheme 30-day reminder | "Your scheme matures in 30 days. Plan your redemption!" |
| Scheme Matured | "🎉 Your gold scheme has matured. Redeem now." |
| KYC Approved | "KYC verified! Higher investment limits unlocked." |
| KYC Rejected | "KYC failed. Please resubmit your documents." |

### FCM Token Lifecycle
```
1. On every app launch → send current FCM token to backend
2. Backend stores in user_devices table (user_id, device_id, fcm_token)
3. Before sending notification → validate token
4. If FCM returns "invalid token" → delete from DB, do not retry
5. User with multiple devices → send to all active tokens
```

---

## Part 10 — Security & Fraud Protection

### OTP Rate Limiting
```csharp
// Max 5 OTPs per phone per hour
var count = await _context.OtpLogs
    .CountAsync(o => o.PhoneNumber == phone && o.CreatedAt > DateTime.UtcNow.AddHours(-1));
if (count >= 5) return StatusCode(429, "Too many OTP requests. Try after 1 hour.");
```

### Velocity Checks (Add as Middleware)
```
OTP requests:        5 per phone per hour, 20 per IP per hour
Buy transactions:    Max 10 per user per day, max 3 per minute
Sell transactions:   Flag if buy + sell within 5 minutes (wash trading)
Account creation:    Max 3 accounts per device fingerprint
IP velocity:         Block if > 5 accounts created from 1 IP in 1 hour
```

### Suspicious Activity (Flag, Don't Block)
```
Any of these → INSERT into admin_alerts (alert_type = 'SUSPICIOUS'):
  - Investment > ₹50,000 without FULL KYC
  - Same device fingerprint across 3+ accounts
  - Gold sold immediately after scheme matures (every time)
  - More than 20 API calls per minute from one user
```

---

## Part 11 — Trust Engineering (UX)

**This is what makes users feel safe. Not a technical feature. A design discipline.**

### Pattern 1: Show Your Math
```
❌ Don't show: "0.133g gold added"
✅ Show:       "₹1,000 ÷ ₹7,500/g = 0.133g gold | Bonus 7.5% = 0.010g | Total: 0.143g ✓"
```

### Pattern 2: Timestamp Everything
```
❌ "Last transaction: Buy"
✅ "Gold purchased · 14 May 2026, 10:23 AM · Rate: ₹7,500/gm"
```

### Pattern 3: Safety Signals on Every Screen
```
One of these must appear on every financial screen:
  "🔒 Secured by 256-bit encryption"
  "✓ Gold held by [Vault Partner]"
  "🛡️ MPIN protected transaction"
  "📋 RBI Guidelines Compliant"
```

### Pattern 4: Post-Payment Confirmation Screen (Not Just Toast)
```
✅ Payment Successful

₹1,000 invested in Daily Gold Savings
Gold added:    0.133g at ₹7,500/gm
Bonus gold:    0.010g (7.5% — Day 47 bonus)
Total holding: 5.627g worth ₹42,202

Transaction ID: TXN-20260514-ABC123
[Download Receipt]    [View Portfolio]
```

### Pattern 5: Scheme Progress Reassurance
```
❌ "Day 47 / 330"
✅ "Day 47 of 330  ·  ₹4,700 invested  ·  0.627g gold  ·  +0.047g bonus (7.5%)
    Matures: 08 Apr 2027  ·  Bonus drops to 5.5% in 28 days"
```

---

## Part 12 — Redemption Flows

Three types, each fundamentally different:

| Type | Process | Key Calculations |
|---|---|---|
| **Cash** | Admin approves → NEFT/IMPS to bank | Gold weight × sell price − 3% GST on profit |
| **Jewellery** | Admin contacts user → design → manufacture | Making charges (8–12%) + wastage (2–5%) + GST |
| **Physical Gold** | Admin ships coins/bars | Making charges (2–3%) + shipping + insurance |

**Minimum for Physical Gold:** 1g (cannot ship 0.5mg)

---

## Part 13 — Gold Custody (The Fundamental Question)

**Your app currently stores a number in a database. There is no physical gold backing it.**

Before any client presentation, you must state:

> *"Physical gold will be held in partnership with [MMTC-PAMP / SafeGold / Augmont]. Until vault integration is live, this platform operates in sandbox mode with no real gold transactions."*

**Vault Partner Options (India):**
- **MMTC-PAMP** — Most trusted, government-backed, API available
- **SafeGold** — Developer-friendly, good API documentation
- **Augmont** — Competitive pricing, used by several fintech startups

**Show in every screen:** *"Gold secured by [Partner Name]"* — even as a placeholder.

---

## Part 14 — Environment Separation

| Environment | Database | Razorpay | OTP Delivery | Purpose |
|---|---|---|---|---|
| Development | Local PostgreSQL | Test keys | `Console.WriteLine` | Daily coding |
| Staging / UAT | Staging DB | Test keys | Real SMS | Client demos + QA |
| Production | Production DB | Live keys | Real SMS | Real users |

```json
// appsettings.json (committed to git — no secrets)
{ "Razorpay": { "Key": "", "Secret": "" } }

// appsettings.Development.json (local only, gitignored)
{ "Razorpay": { "Key": "rzp_test_xxx", "Secret": "test_secret" } }

// Production: use environment variables or Azure Key Vault
```

---

## Part 15 — Phased Execution Roadmap

### Phase 1 — Fix Before Client Demo (Week 1–2)
- [ ] Fix Razorpay HMAC signature verification (`PaymentController.cs`)
- [ ] Move Razorpay keys to `appsettings.json`
- [ ] Add idempotency key check on `VerifyPayment`
- [ ] Add scheme lock-in check in `SellGold`
- [ ] Add 3% GST to every gold buy + store in invoices table
- [ ] Connect real SMS provider (MSG91 / Fast2SMS) for OTP
- [ ] Save `rate_per_gm_paise` + `rate_timestamp` on every gold transaction
- [ ] Build Payment Success + Payment Failed screens (Android)
- [ ] Save pending order on payment start, recover on app launch

### Phase 2 — Core Product (Week 3–5)
- [ ] Create `scheme_bonus_tiers` DB table
- [ ] Create `scheme_investments` DB table
- [ ] Build `POST /api/Scheme/invest` with bonus calculation
- [ ] Build `GET /api/Scheme/{id}/progress`
- [ ] Build Scheme Detail Screen (Android) — tiers, countdown, progress
- [ ] Build Scheme Invest Screen (flexible amount input)
- [ ] Build Redemption Request flow (post-maturity)
- [ ] Enforce KYC tier limits on buy/sell/scheme endpoints

### Phase 3 — Admin Panel (Week 5–7)
- [ ] User management + KYC approval/rejection
- [ ] All transaction reports (gold, payments, scheme investments)
- [ ] Scheme management (create/edit + bonus tier configuration)
- [ ] Withdrawal approval queue
- [ ] Reconciliation report viewer
- [ ] Bonus liability dashboard (how much bonus gold is owed)

### Phase 4 — Production Ready (Week 8–10)
- [ ] Install Hangfire + all 7 background jobs
- [ ] FCM push notifications + `user_devices` table
- [ ] Pagination on all list APIs (`?page=1&size=20`)
- [ ] Razorpay webhook endpoint + processor job
- [ ] Add OTP rate limiting (5/phone/hour)
- [ ] Add velocity checks (buy/sell limits)
- [ ] `user_consents` table + T&C acceptance screen
- [ ] `user_nominees` table + nominee screen
- [ ] API versioning (`api/v1/`) on all routes
- [ ] Forced app update flow
- [ ] Serilog structured logging
- [ ] Environment separation (dev/staging/prod configs)
- [ ] Nightly reconciliation reports

---

## Honest Assessment

| Dimension | Today | Target |
|---|---|---|
| Architecture Quality | ✅ Excellent | Maintain |
| DB Schema | ✅ Professional (33 tables) | Add 4 missing tables |
| Payment Safety | ❌ Unsafe | Phase 1 |
| Business Logic | 40% (scheme bonus not built) | Phase 2 |
| Admin Panel | 5% | Phase 3 |
| Legal Compliance | ❌ No GST, no KYC limits | Phase 1 + 2 |
| Trust UX | 30% | Ongoing |
| Production Readiness | 25% | Phase 4 |

**Time to client-demo ready:** 2–3 focused weeks (Phases 1 + 2)
**Time to first real users:** 8–10 weeks (All 4 phases)

---

*This document must be updated whenever a phase item is completed.*
*See also: `AI_PROJECT_BRAIN.md` (live state) · `CHANGELOG.md` (history)*
