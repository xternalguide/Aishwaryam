# Aishwaryam Digital Gold - AI Project Brain

## Core Context
This project is "Aishwaryam At your Home" - a production-grade Digital Gold investment mobile application with a thin Native Android (Kotlin) frontend and a heavy, secure ASP.NET Core backend backed by PostgreSQL.

### Architecture Highlights
- **Backend Framework:** ASP.NET Core (Clean Architecture: Controller → Service → Repository → Database).
- **Database:** PostgreSQL (33 tables ensuring full auditability, idempotency, and legal compliance).
- **Frontend Framework:** Native Android with Kotlin (Thin client, Server-Driven UI (SDUI), dynamic theming, <25 MB size constraint).
- **Core Principles:** 
  - Never update balance directly (use `wallet_ledger` with `SELECT FOR UPDATE`).
  - Idempotency is mandatory.
  - Strict security & logging.
  - Backend-Driven UI.

### App Navigation Flow
```
Splash → (token exists?) → MPIN Screen → (verify + fetch profile) → Dashboard
                         → Login (OTP) → (new user?) → Onboarding → Login
                                      → (existing?) → MPIN Screen
```

### Network Config
- Backend IP: `10.142.184.215` (defined in `app/build.gradle.kts` as `BASE_URL`)
- Phone IP: `10.142.184.244`

---

## Current State (Updated: 2026-05-26)

### Android App — Screens Built
| Screen | File | Status | Notes |
|---|---|---|---|
| SplashScreen | `SplashScreen.kt` | ✅ Done | Fade animation, magenta bg |
| LoginScreen | `LoginScreen.kt` | ✅ Done | Auto-hides keyboard at 10 digits, rememberSaveable |
| MpinScreen | `MpinScreen.kt` | ✅ Done | Responsive weight(1f) boxes, always-visible button |
| OnboardingScreen | `OnboardingScreen.kt` | ✅ Done | 3-step KYC form (Profile → KYC → Bank) |
| DashboardScreen | `DashboardScreen.kt` | ✅ Done | Portfolio card, banners carousel, scheme cards, flash sale, active scheme tracker, notifications sheet |
| BuyGoldScreen | `BuyGoldScreen.kt` | ✅ Done | Live price, amount input, Razorpay integration |
| SellGoldScreen | `SellGoldScreen.kt` | ✅ Done | Basic sell flow |
| DigiGoldScreen | `DigiGoldScreen.kt` | ✅ Done | Auto Saving education: accordions, bonus table, investment calculator |
| SchemeExplorerScreen | `SchemeExplorerScreen.kt` | ✅ Done | API-driven list with expand/collapse, KYC gate |
| ProfileScreen | `ProfileScreen.kt` | ✅ Done | Edit profile, bank accounts, security, MPIN change, KYC sheet, language toggle |
| TransactionsScreen | `TransactionsScreen.kt` | ✅ Done | List view, no pagination yet |
| NotificationsScreen | `NotificationsScreen.kt` | ✅ Done | Dedicated notification screen with dynamic unread count polling, swipe-to-read/delete and deep linking |
| PaymentSuccessScreen | `PaymentSuccessScreen.kt` | ✅ Done | Animated receipt, bonus display, portfolio snapshot, trust indicators |
| SchemeDetailScreen | `SchemeDetailScreen.kt` | ✅ Done | Immersive scheme detail, dynamic active tier highlight using `schemeDayNumber` from backend |
| PortfolioAnalyticsScreen | `PortfolioAnalyticsScreen.kt` | ✅ Done | Vico charts, performance stats |
| WelcomeOnboardingScreen | `WelcomeOnboardingScreen.kt` | ✅ Done | 4-slide trust value proposition with backend dynamic vertical banner support and local fallback |
| ReferralScreen | `ReferralScreen.kt` | ✅ Done | Invite code, share intent, milestone progress |
| LegalHubScreen | `LegalHubScreen.kt` | ✅ Done | Terms, Privacy, Trust certificates list |
| AiAssistantScreen | `AiAssistantScreen.kt` | ✅ Done | Bilingual FAQ chat UI, quick reply chips |
| GoldRateAlertScreen | `GoldRateAlertScreen.kt` | ✅ Done | Push preferences, daily trends, best time to buy |
| GoalPlannerScreen | `GoalPlannerScreen.kt` | ✅ Done | Goal types, monthly contribution calculator |

### Android App — Build Status
| Feature | Status | Notes |
|---|---|---|
| **Compilation** | ✅ Passing | All unresolved references and syntax errors fixed. |
| **Dependencies** | ✅ Stable | Vico (1.15.0), Lottie, Razorpay, etc. integrated. |
| **Architecture** | ✅ Clean | Callback-based navigation, decoupled ViewModels. |

### Android App — Missing Screens (Phase 2 UI/UX Priority)
#### MUST HAVE (before production launch)
1. 🔴 HowItWorksScreen — illustrated step-by-step
3. 🔴 WhyGoldScreen — Comparison & Context
4. 🔴 FaqScreen — 20 curated Q&As
5. 🔴 SafetyScreen — Vault & Security details
6. 🔴 RedemptionGuideScreen — guide to physical gold
7. 🔴 AboutScreen — story & values
8. 🔴 ContactSupportScreen — in-app support hub
#### SHOULD HAVE (within 4-6 weeks post-launch)
9. 🟡 ReferralScreen — Refer & Earn
10. 🟡 GoldRateHistoryScreen — chart
11. 🟡 InstallmentTimelineScreen — visual progress
12. 🟡 GoalPlannerScreen — jewellery goals
14. 🟡 In-App WebView Readers (T&C, Privacy)

### Backend — Controllers Built (14 total)
Auth, Gold, Scheme, Payment, KYC, User, Banking, Wallet, Audit, Banner, Offers, Notifications, ReferralNetwork, Subscription

### Known Critical Bugs in Backend
1. OTP — Only written to console, not sent via real SMS
2. Token refresh flow in app + backend is missing

---

## Business Logic — Scheme Bonus Tiers (Core Feature)
Schemes are investment-based with flexible investment (no mandatory schedule):

```
Example: 330-Day Gold Scheme
Day 0–75:    7.5% bonus on invested amount (converted to gold at live price)
Day 76–150:  5.5% bonus
Day 151–225: 3.5% bonus
Day 226–330: 1.5% bonus

Lock-in: Cannot redeem scheme gold until maturity date (Day 330)
Redemption: Jewellery / Cash / Physical delivery — admin approves
```

### DB Tables Needed (Not Yet Created)
- `scheme_bonus_tiers` — stores bonus % per day range per scheme
- `scheme_investments` — each flexible investment with bonus tracked
- `scheme_redemptions` — redemption requests after maturity
- `gold_price_locks` — 30-second price lock tokens

---

## Rules & Directives
- **Strict Rule:** Whenever we finish a major task, fix a bug, or make architectural changes, automatically update this file (`AI_PROJECT_BRAIN.md`) and append a new entry to `CHANGELOG.md` to record the history before ending the session. **NO EXCEPTIONS.**
- Keep the Kotlin Android app lightweight and dynamic (SDUI).
- All financial mutations must check idempotency keys.
- All buy/sell must enforce KYC tier limits.
- All scheme investments must be locked until maturity.

---

## Pending Goals (Priority Order)

### Phase 1 — Critical Backend Fixes (COMPLETED ✅)
- [x] Fix Razorpay HMAC signature verification in `PaymentController.cs`
- [x] Add Razorpay webhook endpoint
- [x] Move Razorpay API keys to `appsettings.json`
- [x] Add scheme lock-in check in `SellGold`
- [x] Add GST (3%) calculation to every gold buy
- [x] Connect real SMS provider for OTP (MSG91 / Fast2SMS)
- [ ] Add token refresh flow in app + backend
- [x] Add 30-second gold price lock token
- [x] Enforce `idempotency_keys` table on all payment endpoints

### Phase 2 — UI/UX Product Experience
#### Sprint 1-4 (COMPLETED ✅ 2026-05-16)
- Foundation, Trust, Emotional Storytelling, Depth, Retention, Motion, and Premium Delight built.

#### Sprint 5 — Retention, Growth & Localization (IN PROGRESS 🏗️)
- [x] Establish `strings.xml` architecture (English/Tamil)
- [x] Localize core flows (Dashboard, Login, Onboarding, Profile)
- [x] Build `WelcomeOnboardingScreen.kt` slides
- [x] Build `ReferralScreen.kt`
- [x] Build `AiAssistantScreen.kt` (FAQ Bot)
- [x] Build `LegalHubScreen.kt` (T&C, Privacy)
- [x] Physical Device QA Pass (APK Size, Performance Validation)
- [x] Build `GoldRateAlertScreen.kt`
- [x] Build `GoalPlannerScreen.kt`
- [x] Build dynamic, aspect-ratio validated Onboarding Banners and Admin Upload console
- [x] Fix dual-focus highlight in PIN setup screen (lock-in Confirm PIN row until 4 digits typed)
- [x] Resolve 6-digit OTP responsiveness scaling issues on small screen sizes
- [x] Fix chatbot keyboard-resize header overlap issue using adjustResize and imePadding
- [x] Fix chatbot keyboard text input field visibility overlay issue using imePadding
- [x] Fix chatbot keyboard input bar whitespace/shadow gap by removing redundant inner navigation bar padding
- [x] Refactor chatbot top bar to a custom auto-wrapping Surface to resolve header subtitle text clipping and update title to "Aishwaryam @ Your Home Assistant"
- [x] Wire "Talk to a Human" escalation button to directly dial support number +916369344158 in AppNavigation.kt
- [x] Refine dashboard notification badge count design for perfect centering and high-fidelity visibility
- [x] Resolve notification count reset polling race condition using an 8-second time-guard
- [ ] Add social proof counters to Dashboard
- [ ] Add "Rate the App" prompt after 3rd successful transaction

### Phase 3 — Core Business Logic (Scheme Bonus System) (COMPLETED ✅)
- [x] Create `scheme_bonus_tiers`, `scheme_investments`, `scheme_redemptions`, and `redemption_status_history` tables/migrations
- [x] Build backend dynamic scheme bonus engine with daily tier checks (`SchemeService.cs`)
- [x] Build Scheme progress tracking, maturity processing, and redemption ledger system
- [x] Integrate frontend Scheme Detail screen to dynamically reflect the active bonus tier via `schemeDayNumber`

### Phase 4 — Admin Panel
- [ ] User management + KYC approval
- [ ] Transaction reports
- [ ] Scheme management (create/edit + bonus tiers)
- [x] Withdrawal approval queue (Redemption queue UI & API integrated)

### Phase 5 — Production Hardening
- [ ] Pagination on all list APIs
- [ ] Nightly reconciliation Hangfire job
- [ ] Serilog error logging
- [ ] HTTPS / SSL setup
- [ ] Load testing (k6 / locust)
