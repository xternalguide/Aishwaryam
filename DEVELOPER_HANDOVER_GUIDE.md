# Aishwaryam Digital Gold - Developer Handover & Technical Documentation

This document serves as the absolute single source of truth and **A-to-Z Technical Reference** for the Aishwaryam Digital Gold savings platform. It is structured to allow any developer taking over this project to instantly understand the screens, payment integrations, APIs, localizations, and structural logic of both the Android Client and the Backend Services.

---

## Table of Contents
1. **Architectural & Technology Stack**
2. **Application Screens & Layout Registry**
3. **Razorpay Payment Gateway Integration (Standard & Subscription)**
4. **Android Client API Service Specification (Retrofit)**
5. **Localization & Core Strings Registry (English & Tamil)**
6. **Key Engineering Practices & Recent Bug Resolutions**
7. **Production Hosting & Operations Infrastructure**

---

## 1. Architectural & Technology Stack

The platform is designed as an ultra-secure, backend-driven financial gold ledger system. The mobile client functions as a thin interface, delegating all complex math, validation, and accounting calculations to the secure server.

### Technical Stack Summary
| Layer | Technology | Role & Integration |
|---|---|---|
| **Android Client** | Kotlin, Jetpack Compose, MVVM | Native mobile client, fully responsive and reactive. |
| **Chart Engine** | Vico Compose | Plots month-on-month historical gold assets accumulation curves. |
| **API Client** | Retrofit 2 & OkHttp3 | Restful endpoints interaction with local token cache support. |
| **Backend Framework** | ASP.NET Core 8 | Clean Architecture Web API (Controller → Service → Repository). |
| **Database ORM** | EF Core + Dapper | Dapper is used for high-frequency wallet ledgers, EF for schema sync. |
| **Database** | PostgreSQL (Supabase / Local) | ACID-compliant persistent ledger consisting of 33 tables. |
| **Payment Engine** | Razorpay SDK (Standard & Mandate) | Standard pay sheets and secure monthly auto-debit setups. |
| **Authentication** | Firebase OTP + 6-digit MPIN | Multi-factor, device-fingerprinted session token manager. |

---

## 2. Application Screens & Layout Registry

Below is the structured walkthrough of the completed user interface flows on the Android mobile client:

### Auth & Onboarding Flow
1. **Splash Screen (`SplashScreen.kt`)**
   - Cold startup screen with fluid fade transition.
   - Evaluates token validity and MPIN configurations from `SessionManager` to decide the target destination (`Login`, `MPIN`, or `Dashboard`).
2. **Welcome Onboarding (`WelcomeOnboardingScreen.kt`)**
   - Carousel of value proposition cards (Bis-certified purity, family savings habit, tiered monthly bonuses, and secure vault storage).
3. **Login Screen (`LoginScreen.kt`)**
   - Standard phone verification screen. Generates a one-time Firebase OTP, auto-collapsing the virtual keyboard exactly upon typing the 10th digit.
4. **MPIN Authentication Screen (`MpinScreen.kt`)**
   - A biometric-fallback passcode screen. Returning users type a 6-digit MPIN to secure their active session. Includes a built-in reset loop.
5. **Profile Setup (`ProfileSetupScreen.kt`)**
   - Basic profile form (Name, Email) to establish the initial `userId` profile during registration.
6. **KYC Document Upload (`OnboardingScreen.kt`)**
   - Step-based KYC submission form (Aadhaar or PAN type, Document Number, and photo attachments) supporting real-time limits locking based on the verification level (`BASIC`, `AADHAAR`, `FULL`).

### Core Dashboard & Operations Flow
7. **Home Screen (`DashboardScreen.kt`)**
   - **Unified Portfolio Card**: Displays live grams balance, invested value, current gold market value, dynamic return percentage, and locked/redeemable gold weights. Clicking the card navigates directly to the Portfolio Analytics sheet.
   - **Banners Carousel**: Administrative promo slider utilizing smooth scale/fade parallax transitions and persistent auto-scroll timing.
   - **Schemes Slider**: Horizontal deck of available gold savings plans (Daily, Weekly, Monthly) with clear buy/installment markers.
   - **Active Schemes Deck**: Horizontal premium deck of joined schemes with a tactual swipe-tutorial Arrow hint, native long-press haptic snaps, and full expandability to view the ledger dropdown.
   - **Add Savings Sheet**: A bottom drawer calculation calculator that auto-includes BIS 3% GST, calculates the applicable dynamic monthly loyalty bonus, estimates the net gold credit in milligrams, and launches one-click checkout.
8. **Portfolio Analytics Screen (`PortfolioAnalyticsScreen.kt`)**
   - A detailed financial growth dashboard using Vico to plot the user's actual 6-month historical gold balances, showing their savings trajectory. Includes values breakdown and milestone achievements tracker.
9. **Claim / Sell Gold Screen (`SellGoldScreen.kt`)**
   - Redeeming digital gold to bank accounts or preparing for physical store collections. Highlights exact locked weights vs. redeemable gold assets.
10. **Transactions History (`TransactionsScreen.kt`)**
    - Standard tabular account statement of all historical transactions, filtering between Buy/Sell savings, and supporting PDF receipt downloading.

---

## 3. Razorpay Payment Gateway Integration

The payment gateway uses two distinct flows provided natively by Razorpay, backed by server-side signature verifications:

```
                  [ PAYMENT GATEWAY ARCHITECTURE ]
                  
     1. App                   POST /create-order            2. Backend
   ─────────── ──────────────────────────────────────────► ─────────────
               ◄──────────────────────────────────────────  Returns Razorpay 
                               Order Payload                Order & Keys
                               
     3. App                   Launch Native SDK             4. Razorpay
   ─────────── ──────────────────────────────────────────► ─────────────
               ◄──────────────────────────────────────────  Payment Result
                              Success Token / Signature     (WebView Interface)
                              
     5. App                   POST /verify (HMAC check)     6. Backend
   ─────────── ──────────────────────────────────────────► ─────────────
               ◄──────────────────────────────────────────  Wallet Credit
                               Successful Invoice           (Idempotency locked)
```

### A. One-Time Payment Flow (Gold Buy / Scheme Savings Add)
1. The app calls the backend `api/Payment/create-order` endpoint to request an active Razorpay Order ID.
2. The app stores the resulting `orderId` inside local cache (`SessionManager`) to guarantee recovery if a device crashes or network disconnects during the payment screen.
3. The app initializes the native Razorpay `Checkout` SDK.
4. **Crucial WebView Integration Rules**:
   - **No Manual Payment Forcing**: Avoid manually injecting custom `method` or `upi` JSON objects into the checkout configuration. Manually forcing payment methods clutched Razorpay's native engine, leading to rendering freezes. Let Razorpay natively resolve active merchant payment configurations.
   - **No Empty Prefill Strings**: Never pass empty strings for prefill variables, specifically `email: ""`. Razorpay's Web script validates email formats within the WebView context; passing an empty string causes a JavaScript validation crash, freezing the payment sheet on a blank white screen during a cold launch. Leave empty fields out of the `prefill` block completely.
5. The payment result returns a verification token consisting of: `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`.
6. The app posts this token to the backend `api/Payment/verify` endpoint. The backend verifies the transaction signature securely using an HMAC-SHA256 cipher:
   $$\text{expectedSignature} = \text{HMAC-SHA256}(\text{orderId} + \text{"|"} + \text{paymentId}, \text{RazorpaySecret})$$
7. Upon validation, the ledger transaction is processed under strict database idempotency locks to avoid double crediting.

### B. AutoPay Flow (Recurring Monthly Subscriptions)
1. When joining a plan with AutoPay activated, the app calls the backend `api/Subscription/create` endpoint to obtain a Razorpay subscription ID.
2. The app initializes Razorpay using the `subscription_id` parameter instead of the traditional `order_id` parameter.
3. Upon success, the app calls `api/Subscription/activate` on the backend, ensuring monthly auto-debit mandates are successfully configured.

---

## 4. Android Client API Service Specification (Retrofit)

The complete interface mapping defined in [ApiService.kt](file:///C:/Users/srive/Desktop/Blazewing-projects/App/Digital-Gold/Aishwaryam-android/app/src/main/java/com/example/aishwaryam_android/network/ApiService.kt) is documented below:

### Authentication & Sessions
*   `POST api/Auth/send-otp`  
    - Request: `SendOtpRequest(phoneNumber)`  
    - Response: `SendOtpResponse(success, message)`  
    - Purpose: Initiates the phone number verification process by generating a secure OTP.
*   `POST api/Auth/verify-otp`  
    - Request: `VerifyOtpRequest(phoneNumber, otp, deviceFingerprint)`  
    - Response: `VerifyOtpResponse(token, refreshToken, userId, isNewUser, isMpinSet, success, message)`  
    - Purpose: Verifies the code and returns the active JWT and refresh tokens.
*   `POST api/Auth/set-mpin`  
    - Request: `SetMpinRequest(userId, mpin)`  
    - Response: `GenericAuthResponse(success, message, token, ...)`  
    - Purpose: Securely registers the user's login MPIN.
*   `POST api/Auth/verify-mpin`  
    - Request: `VerifyMpinRequest(userId, mpin, deviceFingerprint)`  
    - Response: `GenericAuthResponse(success, message, ...)`  
    - Purpose: Authorizes returning session checks using the 6-digit MPIN.
*   `POST api/Auth/change-mpin`  
    - Request: `ChangeMpinRequest(userId, oldMpin, newMpin)`  
    - Purpose: Updates a user's secure MPIN code.
*   `POST api/Auth/refresh`  
    - Request: `RefreshTokenApiRequest(refreshToken, deviceFingerprint)`  
    - Purpose: Refreshes an expired JWT token in the background silently.
*   `POST api/Auth/logout`  
    - Request: `RefreshTokenApiRequest(refreshToken, deviceFingerprint)`  
    - Purpose: Revokes the active session and clears tokens.

### User & KYC Data Management
*   `GET api/User/profile/{userId}`  
    - Response: `UserProfileResponse(fullName, phoneNumber, email, kycLevel, preferredLanguage, ...)`  
    - Purpose: Retrieves complete user metadata.
*   `PUT api/User/profile/{userId}`  
    - Request: `UpdateProfileRequest(fullName, email, preferredLanguage, ...)`  
    - Purpose: Updates personal details and preferences.
*   `POST api/Kyc/submit`  
    - Request: `SubmitKycRequest(userId, documentType, documentNumber, documentUrl)`  
    - Purpose: Submits KYC details for admin validation.
*   `GET api/Kyc/limits/{userId}`  
    - Response: `KycLimitsDto(currentLevel, dailyTransactionLimitPaise, remainingDailyLimitPaise, ...)`  
    - Purpose: Dynamically queries transaction caps based on user's active verification level.
*   `GET api/Banking/accounts/{userId}`  
    - Response: `List<BankAccountDto>`  
    - Purpose: Lists all linked cash settlement bank accounts.
*   `POST api/Banking/add-account`  
    - Request: `AddBankAccountRequest(userId, accountNumber, ifscCode, bankName)`  
    - Purpose: Secures bank accounts for withdrawal options.

### Gold Trading
*   `GET api/Gold/price`  
    - Response: `CurrentGoldPriceResponse(buyPricePaise, sellPricePaise, price24KPaise, price22KPaise, updatedAt, isFallback)`  
    - Purpose: Dynamically queries live gold price indexes from bullions.
*   `POST api/Gold/price/lock`  
    - Response: `PriceLockResponse(lockId, lockedBuyPricePaise, lockedSellPricePaise, expiresAt, ...)`  
    - Purpose: Holds the gold price for 30 seconds to protect against rate volatility.
*   `POST api/Gold/buy`  
    - Request: `BuyGoldRequest(userId, totalAmountPaise, deviceFingerprint, priceLockId)`  
    - Response: `GoldTransactionResponse(success, goldWeightMg, pricePerGmPaise, totalGoldCreditedMg, ...)`  
    - Purpose: Credits gold based on direct purchases.
*   `POST api/Gold/sell`  
    - Request: `SellGoldRequest(userId, goldWeightMg, deviceFingerprint, priceLockId)`  
    - Purpose: Liquidates redeemable gold holdings back to linked bank accounts.

### Schemes & Operations
*   `GET api/Scheme/list`  
    - Response: `List<AvailableScheme>`  
    - Purpose: Queries all available gold savings schemes from the admin.
*   `GET api/Scheme/dashboard/{userId}`  
    - Response: `SchemeDashboardResponse(hasActiveScheme, activeSchemes, accumulatedGoldMg, lockedGoldMg, ...)`  
    - Purpose: Gathers active plans, paid installments, next due dates, and accumulated rewards.
*   `POST api/Scheme/join`  
    - Request: `JoinSchemeRequest(userId, schemeMasterId)`  
    - Response: `JoinSchemeResponseDto`  
    - Purpose: Joins a new scheme.
*   `POST api/Scheme/invest`  
    - Request: `InvestSchemeRequest(userId, schemeId, amountPaise, razorpayPaymentId, ...)`  
    - Response: `InvestSchemeResponse`  
    - Purpose: Records scheme investments and adds corresponding gold/bonus milligrams.
*   `GET api/Scheme/{id}/ledger`  
    - Response: `List<SchemeLedgerItem>`  
    - Purpose: Lists all historical payment ledger entries for a joined scheme.
*   `POST api/Scheme/claim`  
    - Request: `ClaimSchemeRequest(userId, schemeId)`  
    - Purpose: Claims matured schemes, moving gold balances to redeemable pools.
*   `POST api/Scheme/redeem-request`  
    - Request: `RequestRedemptionRequest(userId, schemeId, redemptionType, address)`  
    - Purpose: Submits physical delivery, cash-out, or in-store jewellery redemption requests.

### Core Payments & Subscriptions
*   `POST api/Payment/create-order`  
    - Request: `PaymentOrderRequest(userId, amountPaise, userSchemeId)`  
    - Response: `PaymentOrderResponse(orderId, amount, currency, keyId)`  
    - Purpose: Generates a new merchant Razorpay Order ID.
*   `POST api/Payment/verify`  
    - Request: `PaymentVerificationRequest(userId, razorpayOrderId, razorpayPaymentId, razorpaySignature)`  
    - Purpose: Validates payment token signatures and completes transactions.
*   `POST api/Payment/log-failure`  
    - Request: `FailedPaymentRequest`  
    - Purpose: Captures and logs unsuccessful checkouts for transaction recovery.
*   `GET api/Payment/reconcile/{orderId}`  
    - Response: `ReconcilePaymentResponse(success, status, reconciled)`  
    - Purpose: Compares status during startup recovery for incomplete orders.
*   `POST api/Subscription/create`  
    - Request: `CreateSubscriptionApiRequest(userId, schemeMasterId)`  
    - Response: `CreateSubscriptionResponse(subscriptionId, keyId, ...)`  
    - Purpose: Creates auto-debit monthly mandate links.
*   `POST api/Subscription/activate`  
    - Request: `ActivateSubscriptionApiRequest(userId, subscriptionId)`  
    - Purpose: Confirms active recurring subscription status.

### Banners, Offers, Referrals & Inbox
*   `GET api/Banner/active`  
    - Response: `BannerListResponse`  
    - Purpose: Fetches home screen promotion banners.
*   `GET api/Offers/active/{userId}`  
    - Response: `List<OfferItemDto>`  
    - Purpose: Queries flash sales or time-limited bonus offers.
*   `GET api/ReferralNetwork/{userId}`  
    - Response: `ReferralNetworkResponse(totalReferrals, totalBonusMg, network)`  
    - Purpose: Maps referral rewards and listed network nodes.
*   `GET api/Notification`  
    - Response: `List<UserNotificationDto>`  
    - Purpose: Queries the user's inbox messages.
*   `GET api/Notification/unread-count`  
    - Response: `UnreadCountResponse`  
    - Purpose: Checks unread count.
*   `PUT api/Notification/{id}/read`  
    - Purpose: Marks notifications as read.
*   `DELETE api/Notification/{id}`  
    - Purpose: Deletes notifications from the inbox.
*   `POST api/Notification/register-token`  
    - Request: `Map<String, String>(fcmToken)`  
    - Purpose: Registers the active FCM push token.

---

## 5. Localization & Core Strings Registry

The application is localized in both **English (`values`)** and **Tamil (`values-ta`)**, controlled dynamically by the `LocaleHelper` state controller. 

### Core UI Strings Registry
The primary keys mapped inside `strings.xml` include:

| String Name (Key) | English Value (Default) | Tamil Value (`values-ta`) |
|---|---|---|
| `app_name` | Aishwaryam Digital Gold | ஐஸ்வர்யம் டிஜிட்டல் தங்கம் |
| `gold_balance` | GOLD BALANCE | தங்க இருப்பு |
| `buy_gold` | Add Savings | சேமிப்பைத் தொடங்கு |
| `sell_gold` | Redeem | திரும்பப் பெறுதல் |
| `bank_settlement` | Bank Settlement (Instant) | வங்கி கணக்கு தீர்வு (உடனடி) |
| `current_gold_price` | Current Gold Price | தற்போதைய தங்க விலை |
| `gst_3` | GST (3%) | ஜிஎஸ்டி (3%) |
| `enter_custom_amount` | Enter custom amount (₹) | தொகையை உள்ளிடவும் (₹) |
| `autopay_desc` | Auto-debit monthly via UPI for hassle-free saving. | எளிய முறையில் சேமிக்க யுபிஐ மூலம் மாதாந்திர தானியங்கி கழிவு. |
| `estimated_gold_credited` | Estimated Gold Credited | மதிப்பிடப்பட்ட தங்க வரவு |
| `pay_add_gold` | Pay & Add Gold | செலுத்தி தங்கம் சேர்க்கவும் |
| `total_investment_label` | Total Investment | மொத்த முதலீடு |
| `joining_date` | Joining Date | சேர்ந்த தேதி |
| `maturity_date` | Maturity Date | முதிர்வு தேதி |
| `transactions` | Transactions | பரிவர்த்தனைகள் |
| `personal_info` | Personal Information | தனிப்பட்ட தகவல்கள் |

---

## 6. Key Engineering Practices & Recent Bug Resolutions

To maintain the application's performance and prevent future regressions, keep these completed resolutions in mind:

### A. Razorpay Cold Start Hang (Resolved)
- **The Bug**: After 5-6 hours of inactivity, launching the app and immediately attempting a payment would display an indefinite white screen inside Razorpay's WebView.
- **The Cause**: The field `prefill.put("email", "")` passed an empty string to Razorpay's JavaScript validation script inside the WebView. On cold starts, Razorpay's internal validation crashed on the invalid email format, stopping execution.
- **The Fix**: Removed `prefill.put("email", "")` from `launchRazorpay` in `MainActivity.kt`. If email is empty, it should not be passed at all. This prevents WebView crashes and ensures instant checkout loading.

### B. Dashboard Navigation Lag & Recomposition Freezes (Resolved)
- **The Bug**: Returning to the Home Screen from other pages (Referral, Portfolio, FAQ, or Schemes) showed a full-screen blurred "Processing Transaction..." overlay and reloaded the screen, creating visual freezes.
- **The Cause**:
  1. An `ON_RESUME` lifecycle observer in the UI layer triggered `refresh` every time the dashboard was displayed.
  2. The `loadDashboard` viewmodel logic set `isLoading = true` and suspended on `jobs.forEach { it.join() }`, blocking the UI state updates until all 7 parallel network requests finished.
  3. Re-reading and re-parsing cache on every back-press triggered massive Compose recomposition cycles.
- **The Fix**:
  1. **ON_RESUME Observer Removed**: Removed the `ON_RESUME` observer block entirely from `DashboardScreen.kt`. Static screen navigations (back-presses) are now **100% instant, static, and silent**.
  2. **Non-blocking Asynchronous Fetching**: Removed the blocking `jobs.forEach { it.join() }` from the main thread in `loadDashboard`. The 7 requests now run in parallel, updating memory states instantly.
  3. **Silent Disk Caching**: Cache serialization runs on a separate background thread, eliminating UI freezes.
  4. **Dynamic Loading State**: `isLoading` is set to `true` ONLY if no data is found in memory, ensuring the home screen loads seamlessly.

### C. Unified Transaction-Driven Sync
- Data updates now trigger automatically during transaction events (`verifyInstallmentPayment`, `verifyAndJoinScheme`, `claimMaturedScheme`, `activateSubscription`), refreshing the active state in memory before the user exits the payment flow.

---

## 7. Production Hosting & Operations Infrastructure

When preparing to move this setup to staging or production, use this configuration check:

### Web API Hosting
- **Hosting Engine**: ASP.NET Core 8 Web API hosted on a Windows Server IIS reverse proxy using `Kestrel`, or directly containerized inside a Linux Docker container on AWS ECS / Azure Container Apps.
- **Reverse Proxy**: Utilize `Nginx` or `IIS` to handle SSL/TLS termination, exposing port `80` (HTTP) and `443` (HTTPS) to the public internet, forwarding traffic to the local Kestrel port (default: `5044`).

### Supabase / PostgreSQL Configuration
- Ensure your connection strings inside `appsettings.json` target your hosted database securely.
- Enforce secure connection rules by adding `SSL Mode=Require;Trust Server Certificate=true;` to the connection string:
  ```json
  "ConnectionStrings": {
    "DefaultConnection": "Host=db.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=YOUR_SECURE_PASSWORD;SSL Mode=Require;Trust Server Certificate=true;"
  }
  ```

### FCM Push Notifications Configuration
- Create a Firebase service account key JSON inside the backend directory.
- Register FCM on backend startup using `FirebaseApp.Create()` and save active mobile FCM tokens under the `user_devices` database table to track device-to-user mappings.

---
