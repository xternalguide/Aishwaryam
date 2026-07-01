# KNOWN_LIMITATIONS.md — Aishwaryam Pre-Launch Known Issues

> This document records known limitations, technical debt, and non-blocking issues identified before the v1.0 release. Items tagged `[BLOCKER]` must be resolved before Play Store submission.

---

## 🔴 BLOCKERS (Must Fix Before Release)

| # | Area | Issue | File/Location | Owner |
|:---|:---|:---|:---|:---|
| B-01 | Build | Production `BASE_URL` hardcoded in `build.gradle.kts` | `app/build.gradle.kts:40` | Dev |
| B-02 | Security | No production Keystore configured for release signing | `build.gradle.kts` (no `signingConfigs`) | Dev |
| B-03 | Payments | Razorpay `keyId` must be production key in production build | `ApiClient.kt` / `CheckoutActivity` | Dev |
| B-04 | Firebase | FCM `google-services.json` must be production Firebase project | `app/google-services.json` | Dev |
| B-05 | Backend | Production domain `api.aishwaryam.com` must be live with valid SSL | Backend/DNS | Ops |

---

## 🟡 HIGH PRIORITY (Fix in v1.1 or before wider rollout)

| # | Area | Issue | Notes |
|:---|:---|:---|:---|
| H-01 | Analytics | `GoldRateAlertScreen` toggle states are UI-only; not persisted to backend yet | Backend API for notification prefs needed |
| H-02 | Referral | Referral milestone rewards (0.05g gold) are displayed but backend claim endpoint not wired | `ReferralScreen.kt` shows UI only |
| H-03 | Legal | `LegalHubScreen` rows point to nav routes but real T&C/Privacy PDF content not loaded | WebView or PDF viewer needed |
| H-04 | GoalPlanner | Goal Planner saves locally only; no backend persistence for user goals | Goal save API needed |
| H-05 | Crashlytics | Firebase Crashlytics not yet integrated | Add before first public release |
| H-06 | Offline | No explicit offline mode UI; generic network errors shown to user | Show a culturally friendly offline state |
| H-07 | Accessibility | Icon-only buttons lack `contentDescription` in some legacy composables | A11y audit incomplete |

---

## 🟢 LOW PRIORITY (Post-Launch / v1.2)

| # | Area | Issue | Notes |
|:---|:---|:---|:---|
| L-01 | Icons | Several `Icons.Filled.XYZ` deprecated in favor of `AutoMirrored` equivalents | Compiler warnings only, no runtime impact |
| L-02 | AI FAQ | AI FAQ responses are static JSON; dynamic CMS-driven responses not yet built | Fine for v1.0 |
| L-03 | UX | `GoldWarm` chips may need a slight shadow for outdoor sunlight readability | Minor visual polish |
| L-04 | Admin | Admin panel built in HTML/JS; no native mobile admin app | Web-only admin is acceptable for v1.0 |
| L-05 | Localization | A few very long Tamil strings wrap to 3 lines on 720p small screens | `maxLines` + `overflow = Ellipsis` fix |
| L-06 | Charts | Vico library has no dark mode chart color support configured | Future dark mode work |
| L-07 | Social Proof | "X families already saving" counter on Dashboard is a static placeholder | Social proof API needed |

---

## 📋 Technical Debt Register

| Area | Debt | Impact |
|:---|:---|:---|
| Architecture | `onSellClick(0L)` pass is a stub; Sell Gold amount should come from a picker | Medium |
| Navigation | `AppNavigation.kt` is 468+ lines; should be split into sub-graphs | Low |
| ViewModel | `DashboardViewModel` handles too many responsibilities; split candidate | Low |
| Strings | Some UI strings are still hardcoded inline in Kotlin (found during search) | Medium |
