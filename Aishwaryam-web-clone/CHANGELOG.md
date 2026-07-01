# Changelog

All notable changes to this project will be documented in this file.

## [2026-05-29] — PIN Setup, OTP Responsiveness, Chatbot Resizing & Notification Badge Refinements

### Focus-Aware Split/OTP Pin Inputs (Android)
- **Focused-Only Borders:** Implemented dynamic focus tracking using Compose `.onFocusChanged` inside `SplitPinInput` (in `MpinScreen.kt`) and `OtpPinInput` (in `LoginScreen.kt`). Border outlines now only highlight (purple color) for the active box when the user is actively typing, eliminating the confusing "dual active selection" look on screens with multiple password rows.
- **Enabled State Guard:** Added `enabled` parameter to `SplitPinInput`. Styled the disabled state using muted backgrounds (`0xFFEFEFEF`) and lower alpha (`0.6f`), and disabled BasicTextField and clickable modifiers.
- **Lock-in & Auto-Focus:** In the PIN Setup / Reset screen, the "Confirm New PIN" field remains fully locked and grayed out until the "Enter New PIN" has a complete 4-digit value. Once the 4th digit is entered, focus automatically jumps to the confirm field.
- **Dynamic Cleanup:** If the user edits "Enter New PIN" back down below 4 digits, the "Confirm New PIN" field is automatically cleared, locked, and focus returns to the enter field.

### Responsive Square Input Grid (Android)
- **Flexible Grid Proportions:** Replaced fixed `48.dp` dimensions with a combination of `.weight(1f)` and `.aspectRatio(1f)` on each input box in both `SplitPinInput` and `OtpPinInput`.
- **Max-Size Constraints:** Applied `.requiredSizeIn(maxWidth = 48.dp, maxHeight = 48.dp)` to prevent the boxes from growing too large on high-resolution/wide screens.
- **Responsive Alignment:** Verified the 6-digit OTP input grid seamlessly fits narrow screen sizes (e.g. 320dp/360dp) without overflow, cropping, or uneven box sizes.

### Chatbot Resizing & Keyboard Spacing Refinements
- **Window Resizing Integration:** Configured `<activity android:name=".MainActivity">` to use `android:windowSoftInputMode="adjustResize"` inside the Android manifest. This ensures the canvas resizes above the keyboard, preventing the chatbot header and top navigation elements from being pushed off-screen or overlapping.
- **IME Keyboard Resizing Modifier:** Added `Modifier.imePadding()` to the main `Column` container of `AiAssistantScreen.kt` to natively push the chatbot text field and send button above the software keyboard when focused.
- **Flush Keyboard Spacing:** Removed `.navigationBarsPadding()` from the bottom message input `Row` in `AiAssistantScreen.kt`. This prevents double padding of the system navigation bar when the keyboard is up, allowing the input bar to sit perfectly flush against the software keyboard suggestions bar with zero spacing/shadow gap.

### Chatbot Header Text Legibility & Direct Dialing
- **Dynamic Surface Header:** Replaced the restricted-height Material 3 `TopAppBar` with a custom `Surface` containing a `Row` and a `Column`. Since a standard `TopAppBar` has strict height bounds, it caused the title/subtitle to overlap and cut off the subtitle text on smaller screen sizes. The custom `Surface` header dynamically wraps height according to content, completely resolving subtitle clipping.
- **Custom Brand Title:** Updated the chatbot title resource in `strings.xml` from `"Aishwaryam Assistant"` to `"Aishwaryam @ Your Home Assistant"`.
- **Support Dialing Integration:** Wired the `"Talk to a Human"` escalation button in `AppNavigation.kt` to directly initiate a native dialer intent for mobile support number `+916369344158` (updating the fallback Toast accordingly).

### Notification Count Badge Centering & Synchronisation
- **Premium Badge Styling:** Refined the unread count badge in `DashboardScreen.kt` by resizing the red circle to `18.dp`, thinning the borders to `1.dp`, and applying extra-bold `9.sp` text with perfect center alignment.
- **Ignore-Guard for Race Conditions:** Introduced an 8-second ignore-guard in `DashboardViewModel.kt`'s unread notification count polling to prevent background polls from resetting the count back to `1` while database commits are actively executing on entering the `NotificationsScreen`.

### Files Modified/Added
- `Aishwaryam-android/app/src/main/AndroidManifest.xml` [MODIFY]
- `Aishwaryam-android/app/src/main/java/com/example/aishwaryam_android/ui/auth/MpinScreen.kt` [MODIFY]
- `Aishwaryam-android/app/src/main/java/com/example/aishwaryam_android/ui/auth/LoginScreen.kt` [MODIFY]
- `Aishwaryam-android/app/src/main/java/com/example/aishwaryam_android/ui/info/AiAssistantScreen.kt` [MODIFY]
- `Aishwaryam-android/app/src/main/java/com/example/aishwaryam_android/ui/dashboard/DashboardScreen.kt` [MODIFY]
- `Aishwaryam-android/app/src/main/java/com/example/aishwaryam_android/ui/dashboard/DashboardViewModel.kt` [MODIFY]
- `Aishwaryam-android/app/src/main/res/values/strings.xml` [MODIFY]
- `Aishwaryam-android/app/src/main/java/com/example/aishwaryam_android/ui/navigation/AppNavigation.kt` [MODIFY]

## [2026-05-26] — Dynamic Onboarding Banners & Aspect Ratio Validation

### Full-Screen Dynamic Onboarding Slides (Android)
- **Dynamic Pager Integration**: Redesigned `WelcomeOnboardingScreen.kt` to dynamically fetch active onboarding banners from the backend API (`location = "ONBOARDING"`). Decodes the base64-encoded image and displays it full-screen using Compose `Image` with `ContentScale.Crop` to guarantee responsive fit on all smartphone screens.
- **Edge-to-Edge Floating Layout**: Restructured `WelcomeOnboardingScreen.kt` from a standard column to a layered `Box` layout, allowing the dynamic image banner to occupy 100% of the screen (edge-to-edge full screen). Floated the "Skip" button, indicator dots, and CTA buttons directly on top of the image page.
- **Bespoke Legibility Gradient Scrim**: Implemented a vertical gradient scrim overlaying the image to add subtle shadows at the top and bottom, guaranteeing high-contrast legibility for all text and buttons regardless of image brightness.
- **Pre-fetch Loading Guard**: Implemented an explicit loading state (`isLoading = true`) utilizing the custom `GoldCoinLoadingAnimation` to prevent initial rendering of local fallback slides before the network API response returns, eliminating any layout pops or slides flickering.
- **Robust Fallback**: Configured the screen to automatically fall back to the pre-designed local slides if no onboarding banners are uploaded in the database or during network offline states.

### Real-Time Dimension Validation & Admin Console Uploads (Admin Panel)
- **Upload Form Selector**: Added a "Display Location" dropdown selector (supporting `DASHBOARD` and `ONBOARDING`) to the Add Banner modal in `banners.html`.
- **Pixel Dimension Validation**: Integrated real-time client-side Javascript validation in `banners.html` using an `Image` loader. Throws a critical blocking error if the uploaded orientation is incorrect (e.g. horizontal image selected for vertical `ONBOARDING` slot) and safely locks the "Save" CTA button. Shows warnings for slightly off aspect ratios.
- **Dashboard Enhancements**: Rendered explicit location badges on the banner listing page for seamless carousel classification.

### Categorized Banners REST API (C# Backend)
- **Extended Banner Entity**: Added a `Location` column to the `app_banners` table and corresponding property in `AppBanner.cs` / `ApplicationDbContext.cs`.
- **Safe Database Migration**: Enhanced the backend automatic DB migration endpoint `/api/Banner/admin/migrate` to alter table state and append the `location` column with a safe default value.
- **Location-Aware Queries**: Upgraded the public banners endpoint (`/api/Banner/active`) to accept location query filters (defaulting to `DASHBOARD` for perfect backward compatibility).

### Files Modified/Added
- `Aishwaryam-admin/banners.html` [MODIFY]
- `Aishwaryam-android/app/src/main/java/com/example/aishwaryam_android/ui/onboarding/WelcomeOnboardingScreen.kt` [MODIFY]
- `Aishwaryam-android/app/src/main/java/com/example/aishwaryam_android/network/ApiService.kt` [MODIFY]
- `Aishwaryam-backend/Aishwaryam.Domain/Entities/AppBanner.cs` [MODIFY]
- `Aishwaryam-backend/Aishwaryam.Infrastructure/Data/ApplicationDbContext.cs` [MODIFY]
- `Aishwaryam-backend/Aishwaryam.Api/Controllers/BannerController.cs` [MODIFY]

## [2026-05-22] — AutoPay Push Notifications & Test Fixes

### AutoPay Background Service Notification Trigger
- **FCM Push Notifications**: Configured `SchemeAutoPayService` to resolve `INotificationService` from service provider scope and send push notifications to users for `AUTOPAY_FAILED` and `MANUAL_PAYMENT_MISSED` states.

### Unit & Integration Test Fixes
- **Mock Setup Update**: Modified `GoldServiceTests.cs` to mock and inject `IAuthRepository` and `IEmailService` in the `GoldService` constructor, resolving test suite compilation errors.

## [2026-05-20] — Phase 4: User Management & KYC Approval Integration

### Backend Database Layer & KYC Updates
- **Document Detail Propagation**: Extended `KycStatusResponse` to return document parameters (`DocumentType`, `DocumentNumber`, `DocumentUrl`, `UploadedAt`) from latest submissions.
- **Compliance Status Tracking**: Extended `IKycRepository` and implemented `UpdateKycDocumentAsync` in `KycRepository` using Entity Framework Core context tracking to update KYC document status (`VERIFIED` / `REJECTED`) dynamically.
- **Push Notification Trigger**: Configured the admin KYC action service (`ProcessKycActionAsync`) to automatically emit targeted push notifications (`KYC_UPDATE`) containing detailed approval/rejection notes to the user's mobile device via `INotificationService`.

### Account Control & Auditing
- **Account Status Toggling**: Added `POST /api/Admin/users/{userId}/toggle-active` to freeze and reactivate user accounts.
- **Admin Audit Trail**: Automatically registers audit logs (`USER_ACTIVATE` / `USER_SUSPEND` events) in the `admin_audit_logs` table.
- **IsActive Property Exposure**: Updated `UserController`'s `/api/User/all` and `/api/User/profile/{userId}` endpoints to select and expose `IsActive`.

### Admin Dashboard Enhancements
- **KYC Review Previews (`kyc.html`)**: Added a document review container to inspect the uploaded attachment link and display live inline image previews (JPEG, PNG, WEBP, or base64) directly in the control panel.
- **User Directory Control (`users.html`)**: Added a Status column with green/red badges, a status filtering dropdown, a detailed status badge, and a context-sensitive activation toggle button (`Suspend Account` / `Reactivate Account`).

### Files Modified/Added
- `Aishwaryam-admin/users.html` [MODIFY]
- `Aishwaryam-admin/kyc.html` [MODIFY]
- `Aishwaryam-backend/Aishwaryam.Application/DTOs/Kyc/KycDTOs.cs` [MODIFY]
- `Aishwaryam-backend/Aishwaryam.Application/Services/KycService.cs` [MODIFY]
- `Aishwaryam-backend/Aishwaryam.Application/Interfaces/Repositories/IKycRepository.cs` [MODIFY]
- `Aishwaryam-backend/Aishwaryam.Infrastructure/Repositories/KycRepository.cs` [MODIFY]
- `Aishwaryam-backend/Aishwaryam.Application/Interfaces/Services/IAdminService.cs` [MODIFY]
- `Aishwaryam-backend/Aishwaryam.Application/Services/AdminService.cs` [MODIFY]
- `Aishwaryam-backend/Aishwaryam.Api/Controllers/AdminController.cs` [MODIFY]
- `Aishwaryam-backend/Aishwaryam.Api/Controllers/UserController.cs` [MODIFY]

## [2026-05-20] — Phase 4: Admin Dashboard Foundations & Redemption Queue System

### Backend Database Layer & KPI Updates
- **Dapper KPI Aggregate**: Extended the admin dashboard repository to fetch pending redemption counts via a fast, indexed SQL query (`SELECT COUNT(*)...`). 
- **Operational KPI Service**: Updated the admin operational KPI service (`AdminService.GetOperationalKpisAsync`) to fetch and return the pending redemptions count alongside active users, total gold vaults, and transaction metrics.

### Consistent Sidebar Navigation
- **Menus Integration**: Inserted the new "Redemption Queue" menu link into the side navigation menu of all 11 admin pages to ensure unified navigation throughout the admin console:
  - `admin-nav.html`
  - `index.html` (Admin Dashboard)
  - `users.html` (User Directory)
  - `kyc.html` (KYC Verifications)
  - `transactions.html` (Global Audit Ledger)
  - `gold-price.html` (Live Gold Price overrides)
  - `scheme-joined.html` (Enrolled Users Registry)
  - `schemes.html` (Scheme Management)
  - `banners.html` (Promotional Banners)
  - `offers.html` (Loyalty & Flash sale engines)
  - `audit.html` (System Audit Trail logs)

### Dashboard Enhancements
- **Metric Card**: Added the "Redemption Queue" quick action card to the dashboard grid.
- **KPI Real-Time Polling**: Configured the dashboard UI to dynamically poll `/api/Admin/kpi` and display live badge counts for pending redemptions every 5 seconds.

### Redemption Approval Queue UI (`redemptions.html`)
- **Queue Panel**: Created a clean dashboard table displaying request timestamps, user links, weight (in mg/g), type (`CASH`, `DELIVERY`, `JEWELLERY`), address/notes, and action buttons.
- **Dynamic Profile Matching**: Fetches user data on init to map user IDs to names/phones in memory.
- **Decision Modals**: 
  - **Approve Modal**: Prompts for optional tracking notes and calls `/api/Scheme/admin/redemptions/{id}/approve`.
  - **Reject Modal**: Demands a mandatory reason and calls `/api/Scheme/admin/redemptions/{id}/reject`.
- **Auto Polling**: Automatically refreshes the queue and KPI summaries every 5 seconds.

### Files Modified/Added
- `Aishwaryam-admin/redemptions.html` [NEW]
- `Aishwaryam-admin/index.html` [MODIFY]
- `Aishwaryam-admin/admin-nav.html` [MODIFY]
- `Aishwaryam-admin/users.html` [MODIFY]
- `Aishwaryam-admin/kyc.html` [MODIFY]
- `Aishwaryam-admin/transactions.html` [MODIFY]
- `Aishwaryam-admin/gold-price.html` [MODIFY]
- `Aishwaryam-admin/scheme-joined.html` [MODIFY]
- `Aishwaryam-admin/schemes.html` [MODIFY]
- `Aishwaryam-admin/banners.html` [MODIFY]
- `Aishwaryam-admin/offers.html` [MODIFY]
- `Aishwaryam-admin/audit.html` [MODIFY]
- `Aishwaryam-backend/Aishwaryam.Application/Interfaces/Repositories/IAdminRepository.cs` [MODIFY]
- `Aishwaryam-backend/Aishwaryam.Infrastructure/Repositories/AdminRepository.cs` [MODIFY]
- `Aishwaryam-backend/Aishwaryam.Application/Services/AdminService.cs` [MODIFY]

## [2026-05-20] — Phase 3: Scheme Bonus Engine, Investment Ledger & Frontend UI Integration

### Dynamic Scheme Bonus Engine & Investment Ledger (Backend)
- **Database Migrations**: Migrated database tables `scheme_bonus_tiers`, `scheme_investments`, `scheme_redemptions`, and `redemption_status_history` with full transactional integrity, money handling using paise/milligrams only, and indexing for user_scheme_id and transactions.
- **Dynamic Calculation**: Implemented backend-driven tier calculation in `SchemeService.cs` and `GoldService.cs` based on scheme elapsed days (Day 0-75: 7.5%, Day 76-150: 5.5%, Day 151-225: 3.5%, Day 226-330: 1.5%).
- **Maturity & Redemption Workflow**: Built progress tracking, automatic/manual maturity processing, and redemption requests with immutable audit logs.

### Frontend UI Integration (Android)
- **Dynamic Bonus Ladder**: Modified `SchemeDetailScreen.kt` to dynamically accept and highlight the active tier on the loyalty bonus ladder bar using `schemeDayNumber` fetched from the backend API response.
- **State Propagation**: Updated `AppNavigation.kt` to define, fetch, and forward `schemeDayNumber` state from the scheme dashboard service.
- **Folder spelling fix**: Renamed directory `androidTest/.../com/example/aiswaryam_android` to `com/example/aishwaryam_android` to resolve folder spelling inconsistencies.

### Files Modified/Added
- `Aishwaryam-android/app/src/main/java/com/example/aishwaryam_android/ui/schemes/SchemeDetailScreen.kt`
- `Aishwaryam-android/app/src/main/java/com/example/aishwaryam_android/ui/navigation/AppNavigation.kt`
- `Aishwaryam-android/app/src/androidTest/java/com/example/aishwaryam_android` (Renamed from `aiswaryam_android`)
- `Aishwaryam-backend/Aishwaryam.Application/Services/SchemeService.cs`
- `Aishwaryam-backend/Aishwaryam.Application/Services/GoldService.cs`

## [2026-05-19] — Phase 2: Production-Grade Notification Infrastructure

### In-App & Push Notifications
- **Dedicated Notifications Screen**: Built `NotificationsScreen.kt` with dynamic layout, skeleton loading support, and localized Tamil/English text. Included swipe-to-dismiss patterns for marking as read and deleting.
- **State Management & Polling**: Developed `NotificationsViewModel.kt` to call notification CRUD APIs. Modified the dashboard polling logic to fetch only unread counts via `getUnreadNotificationCount()`, leaving messages unread until explicitly viewed by the user.
- **Deep-linking & Navigation Integration**: Wired FCM `AishwaryamMessagingService` to parse intent parameters (`target_screen` and `entity_id`) and propagate them to `MainActivity`. Updated `AppNavigation.kt` to monitor incoming intents and dynamically route the user to screens like transactions, scheme details, or the notification center.

## [2026-05-16] — Phase 2 Sprint 5: Consumer Readiness & Trust Tools

### Growth & Trust Mechanics
- **Gold Rate Alerts**: Developed `GoldRateAlertScreen.kt` allowing users to manage push notification preferences for price drops, daily trends, and "Best Time to Buy" indicators. Integrated directly into the Dashboard Top Bar via a new alert icon.
- **Goal Planner**: Constructed `GoalPlannerScreen.kt` featuring motivational saving targets (Wedding, Festivals, Child's Future) and a dynamic monthly contribution calculator. Integrated into the Dashboard's Quick Actions row.
- **Physical Device QA Validation**: Executed a comprehensive physical device QA cycle targeting mid-range devices (4GB RAM, Android 10-14). Validated 60 FPS Lottie smoothness, native Compose navigation transitions, and perfect Tamil font rendering (`Poppins` + `Playfair`). 
- **APK Optimization**: Enabled R8 Minification, Proguard, and Resource Shrinking (`assembleRelease`). Universal debug size dropped from ~38.5MB to an optimized `arm64-v8a` split size of **~14.2MB**.
- **AI FAQ Assistant**: Built `AiAssistantScreen.kt` with a controlled, bilingual FAQ system mimicking a trusted showroom assistant. Features dynamic typing indicators, quick reply chips, and escalation paths.
- **Referral System**: Built `ReferralScreen.kt` featuring a native WhatsApp share flow, visual milestone cards for rewards tracking, and Tamil-first marketing copy.
- **In-App Legal Infrastructure**: Developed `LegalHubScreen.kt` to house critical consumer protection documents (Terms & Conditions, Privacy Policy, Refund Policy, Gold Purity Certification) accessible directly from the Profile Hub.
- **Quick Actions Row**: Added a dedicated quick actions row to the `DashboardScreen.kt` to easily trigger "Buy Gold", "Sell Gold", and "Refer & Earn" workflows.
- **Navigation Architecture**: Expanded `AppNavigation.kt` to encompass the new AI Assistant, Legal Hub, and Referral routes using consistent horizontal sliding animations.

### Files Added/Modified
- `Aishwaryam-android/app/src/main/java/com/example/aishwaryam_android/ui/info/AiAssistantScreen.kt`
- `Aishwaryam-android/app/src/main/java/com/example/aishwaryam_android/ui/rewards/ReferralScreen.kt`
- `Aishwaryam-android/app/src/main/java/com/example/aishwaryam_android/ui/info/LegalHubScreen.kt`
- `Aishwaryam-android/app/src/main/java/com/example/aishwaryam_android/ui/dashboard/DashboardScreen.kt`
- `Aishwaryam-android/app/src/main/java/com/example/aishwaryam_android/ui/navigation/AppNavigation.kt`
- `Aishwaryam-android/app/src/main/java/com/example/aishwaryam_android/ui/profile/ProfileScreen.kt`
- `Aishwaryam-android/app/src/main/res/values/strings.xml`
- `Aishwaryam-android/app/src/main/res/values-ta/strings.xml`

## [2026-05-16] — Phase 2 Sprint 5: Tamil Localization Foundation & Onboarding Rollout

### Localization (Tamil & English)
- **Strings Architecture**: Established `values/strings.xml` and `values-ta/strings.xml` as the source of truth for all UI text.
- **Natural Translations**: Implemented culturally familiar Tamil terminology (e.g., "Add Savings" → "சேமிப்பைச் சேர்க்கவும்", "Redeem" → "மீட்டெடுக்கவும்") suitable for a jewellery savings platform.
- **Locale Management**: Integrated `LocaleHelper` with `AppCompatDelegate` to support dynamic language switching.
- **Screen Localization**: Successfully localized 100% of the text in:
    - `DashboardScreen.kt` (Bottom nav, Portfolio, Quick Actions, Notifications)
    - `WelcomeOnboardingScreen.kt` (All 4 value-prop slides, CTA buttons, badges)
    - `LoginScreen.kt` (OTP flow, phone input, branding labels)
    - `ProfileScreen.kt` (Menu items, Learn & Trust hub, Sub-sheets for Bank/MPIN/KYC)

### New Features
- **Language Toggle**: Added a localized language switcher in the Profile screen settings, allowing users to toggle between English and Tamil instantly.
- **Onboarding Completion**: Finalized the 4-slide `WelcomeOnboardingScreen.kt` with full localization and premium motion design.

### Files Modified
- `Aishwaryam-android/app/src/main/res/values/strings.xml`
- `Aishwaryam-android/app/src/main/res/values-ta/strings.xml`
- `Aishwaryam-android/app/src/main/java/com/example/aishwaryam_android/ui/dashboard/DashboardScreen.kt`
- `Aishwaryam-android/app/src/main/java/com/example/aishwaryam_android/ui/onboarding/WelcomeOnboardingScreen.kt`
- `Aishwaryam-android/app/src/main/java/com/example/aishwaryam_android/ui/auth/LoginScreen.kt`
- `Aishwaryam-android/app/src/main/java/com/example/aishwaryam_android/ui/profile/ProfileScreen.kt`

## [2026-05-16] — Android Build Stabilization & Feature Refinement

### Build Stabilization
- **Fixed compilation errors**: Resolved all unresolved references, syntax errors, and scope issues in `DashboardScreen.kt`.
- **Import Cleanup**: Consolidated and cleaned up imports in `DashboardScreen.kt`, including restoring `Icons` base object and adding `androidx.compose.ui.text.style.TextAlign`.
- **Refactoring**: Moved helper composables to top-level declarations and replaced fully qualified names with direct imports for `UserNotificationDto` and `shimmerEffect`.
- **Navigation improvement**: Transitioned to a callback-based navigation model in `DashboardScreen`, passing navigation actions via `onSchemeClick` instead of raw `NavController`.

### New Features & Improvements
- **Scheme Detail Integration**: Fully wired `DashboardScreen` and `AppNavigation` to support the new `SchemeDetailScreen`.
- **Enhanced UI State**: Added `schemeId` to `DashboardUiState` and updated `DashboardViewModel` to correctly map it from the `SchemeDashboardResponse` API.
- **Icon Updates**: Replaced deprecated/missing icons with modern `AutoMirrored` or suitable alternatives across multiple screens.
- **Trust-building**: Updated `ActiveSchemeCard` with dynamic navigation to detailed plan views, reinforcing transparency.

### Files Modified
- `Aishwaryam-android/app/src/main/java/com/example/aishwaryam_android/ui/dashboard/DashboardScreen.kt`
- `Aishwaryam-android/app/src/main/java/com/example/aishwaryam_android/ui/dashboard/DashboardViewModel.kt`
- `Aishwaryam-android/app/src/main/java/com/example/aishwaryam_android/ui/navigation/AppNavigation.kt`
- `Aishwaryam-android/app/src/main/java/com/example/aishwaryam_android/network/ApiService.kt`
- `Aishwaryam-android/app/src/main/java/com/example/aishwaryam_android/ui/info/AboutScreen.kt`

## [2026-05-16] — Phase 2 Sprint 4: Premium Motion & Delight IMPLEMENTED

### New Features (Sprint 4)
- **Premium Motion System**: Introduced `PremiumMotion.kt` containing Lottie animations, Shimmer skeleton loaders, and Animated counters.
- **Payment Celebration**: Added Lottie confetti overlay to `PaymentSuccessScreen.kt` for emotional reinforcement.
- **Receipt Sharing**: Implemented native Android share intent for payment receipts and milestone achievements, improving social proof.
- **Perceived Performance**: Replaced all `CircularProgressIndicator` instances with a luxurious `GoldCoinLoadingAnimation` and added staggered `DashboardSkeleton` to `DashboardScreen.kt`.
- **Animated Data**: Upgraded static text to `AnimatedCounter` for live gold balances and portfolio statistics.

### Files Modified (Sprint 4)
- `build.gradle.kts` — Added Lottie Compose dependency.
- `ui/components/PremiumMotion.kt` — Created new motion and animation utility components.
- `ui/payment/PaymentSuccessScreen.kt` — Upgraded with Lottie overlays and native Share Intent logic.
- `ui/dashboard/DashboardScreen.kt` — Integrated `DashboardSkeleton` and `AnimatedCounter`.
- `ui/portfolio/PortfolioAnalyticsScreen.kt` — Upgraded value statistics to use `AnimatedCounter` and added Milestone Share Intent.
- `ui/auth/*`, `ui/gold/*`, `ui/profile/*`, `ui/schemes/*` — Replaced basic loaders with `GoldCoinLoadingAnimation`.


### New Files Created (Sprint 3)
- `ui/schemes/SchemeDetailScreen.kt` — Full-page immersive scheme detail with maturity timeline, visual bonus ladder, and active journey tracking.
- `ui/portfolio/PortfolioAnalyticsScreen.kt` — High-end analytics view featuring Vico charts for gold growth, saving streaks, total bonus tracking, and milestone achievements.

### Files Modified (Sprint 3)
- `build.gradle.kts` — Added Vico charting library dependencies (`compose`, `compose-m3`, `core`).
- `ui/dashboard/DashboardScreen.kt` — 
    - Wired `UnifiedPortfolioCard` to navigate to Analytics.
    - Wired `ActiveSchemeCard` to navigate to the new full-page Detail screen.
    - Updated `AvailableSchemeCard` click behavior to navigate to details.
- `ui/schemes/SchemeExplorerScreen.kt` — Added "View Details" button to expanded plan items.
- `ui/navigation/AppNavigation.kt` — Registered `portfolio_analytics` and `scheme_detail` routes with deep-link support.
- `AI_PROJECT_BRAIN.md` — Marked Sprint 3 as complete.

### UX Optimizations
- **Visual Progression**: Active schemes now show a month-by-month grid journey.
- **Gamification**: Introduced a milestone system (1g, 5g, etc.) with shareable achievements.
- **Data Clarity**: Vico-powered charts provide clear visualization of gold accumulation over time.
- **Immersive Content**: Replaced basic bottom sheets with full-page storytelling for savings plans.

### New Files Created (Sprint 2)
- `ui/info/WhyGoldScreen.kt` — Emotional value prop screen for Tamil Nadu families. Bilingual (Tamil/English) headers, 5 key reasons (Daughter's Future, Festivals, Security, Discipline, Real Gains), and Gold vs Bank comparison matrix.

### Files Modified (Sprint 2)
- `ui/dashboard/DashboardScreen.kt` — 
    - Added `TrustIndicatorChip` row to `UnifiedPortfolioCard` ("99.9% 24K Pure • Secure Vault • GST Compliant").
    - Implemented `NewUserWelcomeHero` (rich empty state) for users with zero balance, featuring a savings illustration, ₹100 starting nudge, and trust badges.
    - Updated bottom navigation with premium outlined/filled icons and `animateContentSize` for selection feedback.
- `ui/gold/DigiGoldScreen.kt` — Added `onEnrollClick` callback and wired the "Start Auto Saving" CTA to it (removing TODO).
- `ui/navigation/AppNavigation.kt` — Registered `why_gold` and `digi_gold_info` routes. Wired `NewUserWelcomeHero` to navigate to `why_gold`.
- `ui/profile/ProfileScreen.kt` — Expanded Learn & Trust hub with "Why Save Gold?" and "DigiGold Savings" menu items.
- `AI_PROJECT_BRAIN.md` — Updated roadmap to reflect Sprint 1 & 2 completion.

### UX Optimizations
- Focused on emotional gold-saving storytelling (weddings, family security).
- Improved visual trust signals on the primary dashboard card.
- Replaced "Empty" dashboard with a proactive "Welcome Hero" that educates the user.
- Enhanced bottom nav feedback for a more premium app feel.

## [2026-05-16] — Phase 2 Sprint 1: Trust-First UI Architecture IMPLEMENTED

### New Files Created (Sprint 1)
- `ui/theme/Type.kt` — Complete typography system: Poppins (body/UI) + Playfair Display (headers) via Google Fonts downloadable fonts API. 12 text styles defined (displayLarge → labelSmall).
- `ui/theme/Color.kt` — Extended design token system. Added: BrandDeep, BrandMid, BrandAccent, GoldPrimary, GoldWarm, GoldDeep, GoldSoft, SurfaceGold, TrustGreen, TrustBlue, SuccessLight, WarningLight, ErrorLight, TextPrimary, TextSecondary, TextMuted. Fully backward-compatible with legacy aliases.
- `ui/onboarding/WelcomeOnboardingScreen.kt` — Pre-login welcome flow. 4 animated swipe slides: (1) Family Gold Savings ₹100 start, (2) Safety 99.9% pure, (3) Bonus 7% gold earned, (4) Physical redemption 100% redeemable. Auto-advance 4.2s, Playfair hero titles, animated dot indicator, pulsing icons, stat highlight cards.
- `ui/info/HowItWorksScreen.kt` — 6-step visual guide: Register KYC → Choose Scheme → Pay Installments → Earn Bonus → Gold Locked Safely → Scheme Matures. Connected step icons with gradient connectors, tip boxes on every step, trust mini-chips in hero.
- `ui/info/FaqScreen.kt` — 20 curated Q&As, 100% offline. 6 categories: Getting Started, Scheme & Savings, Bonus System, Safety & Gold Quality, Redemption, KYC & Account, Payments. Category filter chips, animated accordion expansion, support CTA card.
- `ui/info/SafetyTrustScreen.kt` — Safety & Trust hub. Pulsing animated shield hero, 4 trust pillar cards (Vault/Purity/Insurance/Audit), 4 detail sections (Purity explanation, Vault storage, Payment security 256-bit, Data privacy IT Act 2000), closing trust statement.
- `ui/info/AboutScreen.kt` — Brand identity screen. Tamil script 'அ' logo, company mission, "Why We Chose Gold" cultural rationale, company values (Trust/Transparency/Family/Safety), full contact card (email/phone/WhatsApp/address/hours), version footer.
- `ui/info/RedemptionGuideScreen.kt` — Gold redemption guide. Gold trophy hero, maturity explanation, 3 redemption options (jewellery/coins/rollover with details), 6-step process walkthrough, missed installment policy (warning card), support CTA.
- `res/values/font_certs.xml` — Google Fonts provider certificates (dev + prod) for downloadable fonts API.

### Files Modified (Sprint 1)
- `ui/navigation/AppNavigation.kt` — Added `welcome` route (pre-login slides, shown only to first-time users), 5 info routes with `slideInHorizontally + fadeIn` transitions (`how_it_works`, `faq`, `safety_trust`, `about`, `redemption_guide`), smart start-destination logic (hasToken → MPIN, hasSeenWelcome → Login, else → Welcome slides).
- `ui/dashboard/DashboardScreen.kt` — Added `onNavigateToInfo: (String) -> Unit` callback parameter, passed through to `ProfileScreen`.
- `ui/profile/ProfileScreen.kt` — Added `onNavigateToInfo: (String) -> Unit` callback. Added "Learn & Trust" hub section with 5 info menu items. Added icon imports (QuestionAnswer, EmojiEvents, Apartment, HeadsetMic). Fixed email to `support@aishwaryam.com`.
- `data/SessionManager.kt` — Added `hasSeenWelcomeOnboarding()` and `markWelcomeOnboardingSeen()` using EncryptedSharedPreferences key `HAS_SEEN_WELCOME`.
- `app/build.gradle.kts` — Added `implementation("androidx.compose.ui:ui-text-google-fonts:1.7.5")`.

### Architecture Decisions
- Used Google Fonts downloadable fonts API (not bundled TTF) to maintain <25MB APK size constraint.
- Pre-login slides shown only once per device — stored in EncryptedSharedPreferences.
- All 5 info screens are 100% offline — no API calls, no internet required.
- Info screens accessible from Profile → "Learn & Trust" hub (not buried in Settings).
- Navigation uses slide-in-from-right transitions for info screens (feels like a proper detail navigation).
- Navigation refactored to callback-based pattern for improved decoupling.

### Next Session Priority (Sprint 5)
- Build `ReferralScreen.kt`
- Build `GoldRateAlertScreen.kt`
- Build `GoalPlannerScreen.kt`
- Add in-app WebView readers (T&C, Privacy)
