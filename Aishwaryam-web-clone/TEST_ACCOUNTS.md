# TEST_ACCOUNTS.md — Aishwaryam UAT Test Accounts

> ⚠️ These accounts are for LOCAL UAT ONLY. Never commit real credentials to version control. Replace before production.

---

## 1. Customer (User-Side) Test Accounts

| Role | Name | Phone | Status | Purpose |
|:---|:---|:---|:---|:---|
| New User | Aadhi Kumar | `+91 9000000001` | No KYC, No Scheme | Onboarding & fresh flow |
| KYC Pending | Meenakshi Devi | `+91 9000000002` | KYC Submitted | Pending state validation |
| KYC Approved | Suresh Rajan | `+91 9000000003` | Full KYC | Main UAT account |
| Active Scheme | Kavitha Annamalai | `+91 9000000004` | KYC + Scheme Active | Installment & tracking |
| Matured Scheme | Rajkumar Pillai | `+91 9000000005` | Scheme Matured | Maturity + Redemption |
| KYC Rejected | Priya Sundaram | `+91 9000000006` | KYC Rejected | Error state validation |
| Tamil User | வேல்முருகன் ஐயர் | `+91 9000000007` | Tamil language set | Localization testing |
| Missed EMI | Geetha Krishnan | `+91 9000000008` | Missed 2 installments | Missed payment behavior |
| Referral | Anbu Selvan | `+91 9000000009` | Has active referrals | Referral milestone testing |
| Goal Planner | Lakshmi Ramanathan | `+91 9000000010` | Portfolio + Goal set | Goal planner UI testing |

---

## 2. Admin Test Accounts

| Role | Email | Purpose |
|:---|:---|:---|
| Super Admin | `admin@aishwaryam.com` | Full system access |
| Ops Executive | `ops@aishwaryam.com` | KYC review, payments |
| Finance Manager | `finance@aishwaryam.com` | Reconciliation, reports |
| Customer Support | `support@aishwaryam.com` | View-only, notifications |

---

## 3. Razorpay Test Cards (Sandbox)

| Card Type | Number | CVV | Expiry |
|:---|:---|:---|:---|
| Visa (Success) | `4111 1111 1111 1111` | `123` | `12/26` |
| Mastercard (Success) | `5267 3181 8797 5449` | `123` | `12/26` |
| Card (Payment Fail) | `4000 0000 0000 0002` | `123` | `12/26` |
| UPI (Success) | `success@razorpay` | — | — |
| UPI (Failure) | `failure@razorpay` | — | — |
| Net Banking | Use Razorpay test credentials per bank | — | — |

---

## 4. OTP Bypass (Dev/Test Mode)

> If the backend is configured with a fixed OTP for testing:
- **Test OTP**: `123456` (configure in `AuthController.cs` for UAT env)
- Remove/disable the fixed OTP before promoting to production.

---

## 5. Local API Configuration

| Environment | Base URL |
|:---|:---|
| Local (WiFi) | `http://10.142.184.215:5044/` |
| Local (Hotspot) | `http://192.168.137.1:5044/` |
| Production | `https://api.aishwaryam.com/` |

Update `build.gradle.kts` → `debug.buildConfigField` to match your active network.
