# Aishwaryam At your Home - Production Backend Architecture

Based on the comprehensive research and production-grade requirements, here is the finalized blueprint for the Backend System. The frontend (Flutter) will remain a thin client, while the ASP.NET Core backend handles all heavy lifting, ledger management, and security.

## 1. Technology Stack
*   **Backend Framework:** ASP.NET Core (Clean Architecture: Controller → Service → Repository → Database)
*   **Database:** PostgreSQL (ACID compliant)
*   **ORM / Data Access:** Entity Framework Core (CRUD) + Dapper (High-performance ledger queries)
*   **Caching & Sessions:** Redis (Idempotency keys, Gold price caching)
*   **Testing:** Postman API Testing

## 2. Core Principles
1.  **Never update balance directly:** All financial movements happen via `wallet_ledger` using `SELECT FOR UPDATE`. The `wallets` table is merely a cached read replica.
2.  **Idempotency is Mandatory:** Every API call that modifies state must pass an idempotency key to prevent double-charging during network retries.
3.  **Strict Security & Logging:** Comprehensive tracking of API errors, webhook events, OTP attempts, and audit logs.
4.  **Backend-Driven UI:** The app knows nothing about logic; it merely renders what the ASP.NET Core API sends.

## 3. Database Schema Overview (33 Tables)
The database is strictly structured for a financial system with absolute traceability for fraud and legal compliance:

*   **Auth (3):** `users`, `auth_sessions`, `otp_logs`
*   **KYC (2):** `kyc_details`, `kyc_documents`
*   **Wallet (2):** `wallets` (read cache), `wallet_ledger` (immutable truth)
*   **Gold (3):** `gold_transactions`, `gold_price_logs` (with admin tracking), `gold_holdings`
*   **Payments (1):** `payments`
*   **Withdrawals (2):** `withdrawals`, `bank_accounts`
*   **Notifications (2):** `notifications`, `notification_templates`
*   **Admin & Audit (3):** `admin_users`, `audit_logs`
*   **System Logs (3):** `api_error_logs`, `login_attempt_logs`, `webhook_event_logs`
*   **Growth (4):** `referrals`, `referral_events`, `offers`, `user_offer_redemptions`
*   **Core Engineering (1):** `idempotency_keys`
*   **Compliance & Fraud Tracking (4):** `invoices` (Taxation/GST), `disputes`, `dispute_messages`, `user_activity_logs` (Clickstream)

**Crucial Compliance Rule:** All tables involving financial movement (`payments`, `withdrawals`, `gold_transactions`, `wallet_ledger`) MUST include `ip_address` and `device_fingerprint` columns to trace exactly where the transaction originated.

## 4. Lightweight Frontend Strategy (< 25 MB)
To ensure the Flutter mobile app stays below the 25 MB install size, we adhere to the following principles:
1.  **Backend-Driven Architecture:** The app does no complex math or state calculation. The API provides exactly what to render (e.g., pre-calculated GST and totals).
2.  **Avoid Asset-Heavy Design:** Do not bundle high-res images, heavy Lottie JSONs, or videos. Use vector graphics (SVG), implicit code-based animations, and host heavy assets externally via CDN (loaded dynamically).
3.  **Strict Resource Control:** Avoid massive third-party SDKs when REST APIs can be used instead. 
4.  **Deferred Components:** Rarely used, heavy flows (like document upload for Full KYC) will be dynamically loaded at runtime, not shipped in the initial bundle.

## 5. Frontend Architecture: Server-Driven UI (SDUI) & Dynamic Theming
To support enterprise-level dynamic UI updates (e.g., changing themes for festivals like Pongal or Diwali without App Store updates), the Flutter frontend strictly follows the **Server-Driven UI (SDUI)** pattern:
1. **Dynamic Configuration Payload:** The app fetches a central JSON config (`campaign_themes`) on startup dictating primary colors, background assets, and strings.
2. **Dynamic `ThemeData`:** The Flutter `MaterialApp` does not use hardcoded `Colors.blue`. Instead, it parses the JSON via a `ThemeManager` state controller (e.g., Riverpod) to instantly swap the entire app palette.
3. **Slot-Based Widgets:** UI screens contain dynamic empty slots that expand and render externally hosted promotional banners (`headerBannerUrl`) only if an active campaign requires it.
4. **Lottie Animations:** All festive effects are delivered dynamically via lightweight `.json` Lottie URLs, which are streamed rather than bundled in the app.
5. **Aggressive Local Caching:** To prevent data drain and slow loading times during UI swaps, dynamic assets (images, Lottie files, JSON configs) are aggressively cached locally upon first download.

## 6. Next Implementation Steps
1.  Initialize ASP.NET Core Web API project with Clean Architecture.
2.  Write the raw PostgreSQL Schema (`init.sql`) with all 33 tables, integrating device/IP tracking, proper constraints (e.g., `inr_balance_paise`), and indexes.
3.  Implement the Core API Endpoints (Auth & Wallet Ledger first).
4.  Setup Postman Collection for rigorous testing.
