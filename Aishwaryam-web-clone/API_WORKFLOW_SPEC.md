## 1. Onboarding & Authentication Flow

### New User Registration
```
User Enters Mobile -> Receives OTP -> Validates OTP -> Insert User, Wallet & Gold Rows (Atomic Transaction) -> Update Profile Details -> Complete MPIN & Biometric Check -> Submit KYC Details -> Submit Bank Details
```

#### Step 1: Mobile OTP Generation & Validation
* **Endpoint:** `POST /api/Auth/send-otp`
* **Incoming Body:** `{"phoneNumber": "919876543210"}`
* **Action:** 
  * Generate a 6-digit random number.
  * Hash the OTP using a secure cryptographic hash (e.g., SHA-256).
  * Check the rate-limit per IP and phone number from `otp_logs` (Max 3 attempts in 15 minutes).
  * Insert a tracking record into `otp_logs` and forward the plain OTP text via the SMS gateway provider.

#### Step 2: Verification & Initial DB Insertion
* **Endpoint:** `POST /api/Auth/verify-otp`
* **Incoming Body:** `{"phoneNumber": "919876543210", "otp": "123456", "deviceFingerprint": "fp_993021"}`
* **Action:**
  * Match the cleartext OTP against the hash stored in `otp_logs`.
  * If valid, immediately set `is_used = TRUE` to prevent replay attacks.
  * Check if the phone number already exists in `users`. If it is a new user, execute a single database transaction to set up their identity and balance registers.

#### Step 3: Profile Creation
* **Endpoint:** `PUT /api/User/profile/{userId}`
* **Incoming Body:** `{"fullName": "Anand Kumar", "email": "anand@gmail.com", "nomineeName": "Saraswathi", "dateOfBirth": "1992-05-15", "biometricEnabled": false}`
* **Action:** Updates the user record created in the previous step.

#### Step 4: Security Setup (MPIN & Biometrics)
* **Endpoint:** `POST /api/Auth/set-mpin`
* **Incoming Body:** `{"userId": "USER_UUID", "mpin": "123456"}`
* **Action:**
  * Extract cleartext MPIN, hash it via Argon2id or BCrypt.
  * Update `mpin_hash` on the `users` table.

#### Step 5: KYC Onboarding (With Skip Option)
* **Endpoint:** `POST /api/Kyc/submit`
* **Incoming Body:** `{"userId": "USER_UUID", "documentNumber": "ABCDE1234F", "documentType": "PAN"}`
* **Action:**
  * Encrypt the document number using AES-256 before inserting it into the database.
  * Set status to `PENDING` until third-party verification completes.

#### Step 6: Link Bank Details (With Skip Option)
* **Endpoint:** `POST /api/Banking/add-account`
* **Incoming Body:** `{"userId": "USER_UUID", "accountNumber": "5010012345678", "ifscCode": "HDFC0000012", "bankName": "HDFC Bank"}`
* **Action:**
  * Encrypt the bank account number using AES-256.
  * Trigger a backend/third-party Penny Drop test ($₹1$) to confirm the user's name matches before setting `is_verified = TRUE`.

---

### Existing User Login
```
Enter MPIN -> Validate Hash -> Verify Active Session -> Update Login Log -> Hydrate Dashboard
```

#### Step 1: Login Verification
* **Endpoint:** `POST /api/Auth/verify-mpin`
* **Incoming Body:** `{"userId": "USER_UUID", "mpin": "123456", "deviceFingerprint": "fp_993021"}`
* **Action:**
  * Fetch `mpin_hash` from the database.
  * Validate the input string against the stored hash.
  * If it matches, log the session event.

---

## 2. Dynamic Dashboard & Balance Fetching

```
Request Dashboard Payload -> Fetch Cash Balance -> Fetch Gold Holdings -> Compute Invested Amount -> Return Payload to App
```

* **Endpoint:** `GET /api/Wallet/{userId}/balance`
* **Action:** Pulls current values from active tracking tables and aggregates metrics.

---

## 3. Transactional Buy & Sell Gold Flow

### Buying Gold Flow
* **Endpoint:** `POST /api/Gold/buy`
* **Headers:** `X-Idempotency-Key: a4c90e0b-d29b`
* **Incoming Body:** `{"userId": "USER_UUID", "totalAmountPaise": 50000, "deviceFingerprint": "fp_993021"}`

### Selling Gold Flow
* **Endpoint:** `POST /api/Gold/sell`
* **Incoming Body:** `{"userId": "USER_UUID", "goldWeightMg": 8333, "deviceFingerprint": "fp_993021"}`

---

## 4. Portfolio Analytics Engine
* **Endpoint:** `GET /api/Gold/portfolio/{userId}`

---

## 5. Transactions History Pipeline
* **Endpoint:** `GET /api/Gold/transactions/{userId}`

---

## 6. Profile & In-App Lifecycle Management

### A. Dynamic Statement Generator
* **Endpoint:** `GET /api/User/statement/{userId}?period=monthly`

### B. Changing MPIN
* **Endpoint:** `POST /api/Auth/verify-mpin` ➔ `POST /api/Auth/set-mpin`

### C. Session Destruction (Logout)
* **Endpoint:** `POST /api/Auth/logout`

---

## 7. Global Exception Logging Architecture
* **Table Mapping:** `api_error_logs`

---

## 8. Referral & Voucher System
* **Endpoint:** `POST /api/Growth/apply-referral` (To be defined on backend)
* **Action:** Validates referral code and grants join bonus/vouchers. Bonus configurations will be managed via the Admin Panel.

## 9. Auto Gold Purchase (Chit Fund / SIP)
* **Endpoint:** `POST /api/Gold/auto-purchase-setup` (To be defined on backend)
* **Action:** Configures weekly or monthly automatic recurring gold purchases.

## 10. Advanced Transaction History & Statements
* **Endpoint:** `GET /api/Gold/transactions/{userId}?type=BUY|SELL&sortBy=date&sortOrder=desc`
* **Action:** Fetches filtered and sorted transaction history.
* **Endpoint:** `GET /api/Gold/transactions/{transactionId}/download`
* **Action:** Downloads individual buy/sell statements/invoices.
