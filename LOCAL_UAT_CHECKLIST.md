# LOCAL_UAT_CHECKLIST.md — Aishwaryam Local User Acceptance Testing

> **Instructions**: Test each flow end-to-end on a physical Android device (Redmi/Vivo/Oppo, Android 10-14, 4GB RAM).  
> Mark: ✅ PASS | ❌ FAIL | ⚠️ PARTIAL | 🔁 RETRY | N/A

---

## 🧑‍💼 USER-SIDE TESTING

---

### 1. Authentication

| # | Test Case | Account | Expected Result | Status | Notes |
|:---|:---|:---|:---|:---|:---|
| A-01 | Enter valid phone number, tap Send OTP | New User | OTP screen appears | | |
| A-02 | Enter correct OTP | New User | Navigate to MPIN setup | | |
| A-03 | Enter wrong OTP 3 times | New User | Error shown, resend allowed | | |
| A-04 | Set MPIN for first time | New User | MPIN saved, goto Dashboard | | |
| A-05 | Return to app, enter correct MPIN | `Suresh Rajan` | Dashboard loads | | |
| A-06 | Enter wrong MPIN | `Suresh Rajan` | "Incorrect MPIN" error shown | | |
| A-07 | Tap "Forgot MPIN", reset via OTP | `Suresh Rajan` | MPIN updated, login works | | |
| A-08 | Force close app mid-login, reopen | Any | Lands on correct screen (not blank) | | |
| A-09 | Logout, log back in | `Suresh Rajan` | Clean session, no stale data | | |
| A-10 | Switch to Tamil before login | New User | All OTP screen text in Tamil | | |
| A-11 | Switch language, restart app | `Suresh Rajan` | Language preference persists | | |

---

### 2. KYC Flow

| # | Test Case | Account | Expected Result | Status | Notes |
|:---|:---|:---|:---|:---|:---|
| K-01 | Start KYC with new account | `Aadhi Kumar` | Step 1 (PAN) shown | | |
| K-02 | Fill Step 1, close app, reopen | `Aadhi Kumar` | Resumes at Step 2 | | |
| K-03 | Submit invalid PAN number | `Aadhi Kumar` | Inline error shown in Tamil + English | | |
| K-04 | Submit KYC successfully | `Aadhi Kumar` | "KYC Submitted" confirmation screen | | |
| K-05 | Check KYC status as "Pending" | `Meenakshi Devi` | Pending banner visible on Dashboard | | |
| K-06 | Check KYC status as "Approved" | `Suresh Rajan` | No KYC banner, full access | | |
| K-07 | Check KYC status as "Rejected" | `Priya Sundaram` | "KYC Rejected" shown, re-submit option | | |
| K-08 | Simulate network drop during KYC submit | Any | Error message, data not lost | | |
| K-09 | Verify KYC limits indicator on Dashboard | `Aadhi Kumar` | Limit bar shown with upgrade prompt | | |

---

### 3. Gold Purchase (Buy) Flow

| # | Test Case | Account | Expected Result | Status | Notes |
|:---|:---|:---|:---|:---|:---|
| G-01 | Tap "Buy Gold", enter ₹100 | `Suresh Rajan` | Gold weight preview shown | | |
| G-02 | Confirm purchase, Razorpay opens | `Suresh Rajan` | Razorpay checkout loads | | |
| G-03 | Complete payment with test card | `Suresh Rajan` | PaymentSuccess screen with Lottie | | |
| G-04 | Verify gold balance updates | `Suresh Rajan` | Portfolio card reflects new balance | | |
| G-05 | Cancel Razorpay mid-flow | `Suresh Rajan` | Graceful return to Dashboard, no error | | |
| G-06 | Simulate Razorpay payment failure | `Suresh Rajan` | Error message, retry option shown | | |
| G-07 | Tap "Buy" button rapidly (double-tap) | `Suresh Rajan` | Only one Razorpay sheet opens | | |
| G-08 | Buy gold with price lock active | `Suresh Rajan` | Price locked at shown rate | | |
| G-09 | Verify receipt is shareable as PDF | `Suresh Rajan` | Share sheet opens with receipt | | |

---

### 4. Scheme Flow (SIP / Gold Chit)

| # | Test Case | Account | Expected Result | Status | Notes |
|:---|:---|:---|:---|:---|:---|
| S-01 | Explore available schemes | `Suresh Rajan` | Scheme cards shown on Dashboard | | |
| S-02 | Tap scheme, view details | `Suresh Rajan` | SchemeDetailScreen opens | | |
| S-03 | Join a scheme | `Suresh Rajan` | Confirmation + scheme active | | |
| S-04 | View active scheme on Dashboard | `Kavitha Annamalai` | ActiveSchemeCard visible | | |
| S-05 | Pay installment | `Kavitha Annamalai` | Progress bar updates | | |
| S-06 | View installment history | `Kavitha Annamalai` | Correct count/dates shown | | |
| S-07 | Verify maturity date calculation | `Kavitha Annamalai` | Accurate countdown displayed | | |
| S-08 | View bonus breakdown | `Kavitha Annamalai` | Bonus ladder visible in scheme detail | | |
| S-09 | Simulate missed installment | `Geetha Krishnan` | Warning UI shown, not blocked | | |
| S-10 | View matured scheme | `Rajkumar Pillai` | "Claim Gold" button visible | | |
| S-11 | Claim matured scheme | `Rajkumar Pillai` | Confirmation + balance updated | | |

---

### 5. Portfolio & Analytics

| # | Test Case | Account | Expected Result | Status | Notes |
|:---|:---|:---|:---|:---|:---|
| P-01 | View portfolio card (Tamil) | `வேல்முருகன்` | Text in Tamil, no clipping | | |
| P-02 | Tap portfolio card, open analytics | `Suresh Rajan` | PortfolioAnalyticsScreen opens | | |
| P-03 | Verify Vico chart renders | `Suresh Rajan` | Chart loads, no blank state | | |
| P-04 | Scroll transaction history | `Suresh Rajan` | All transactions listed correctly | | |
| P-05 | Share receipt from transaction | `Suresh Rajan` | Share intent opens | | |
| P-06 | Open Referral screen, check milestones | `Anbu Selvan` | Progress bar shown accurately | | |
| P-07 | Open Goal Planner, set ₹50,000 / 10m | `Lakshmi` | Monthly = ₹5,000 displayed | | |
| P-08 | Change goal target, recalculate | `Lakshmi` | Instant live recalculation | | |

---

### 6. Notifications & Alerts

| # | Test Case | Account | Expected Result | Status | Notes |
|:---|:---|:---|:---|:---|:---|
| N-01 | Receive FCM push notification | `Suresh Rajan` | Notification banner appears | | |
| N-02 | Tap notification, deep link | `Suresh Rajan` | Opens correct screen | | |
| N-03 | Toggle "Price Drop Alert" OFF | `Suresh Rajan` | Switch saves, preference visible | | |
| N-04 | Toggle "Best Time to Buy" ON | `Suresh Rajan` | Switch saves | | |
| N-05 | Open AI FAQ, ask "What is KYC?" | `Aadhi Kumar` | Correct bilingual response shown | | |
| N-06 | Ask AI FAQ in Tamil | `வேல்முருகன்` | Tamil response returned | | |
| N-07 | Tap "Talk to Support" in FAQ | Any | Escalation path shown | | |
| N-08 | Disable WiFi, try to use app | Any | Offline error state shown | | |
| N-09 | Re-enable WiFi, retry | Any | Data loads cleanly | | |

---

### 7. UI/UX Validation

| # | Test Case | Device | Expected Result | Status | Notes |
|:---|:---|:---|:---|:---|:---|
| U-01 | Tamil font renders without clipping | Redmi 720p | All text fits, no overlap | | |
| U-02 | Long Tamil text wraps correctly | Vivo 1080p | Max 2 lines, ellipsis if overflow | | |
| U-03 | Lottie animation on PaymentSuccess | Any | Smooth 60fps playback | | |
| U-04 | Skeleton shimmer on Dashboard | Any | Appears during load, disappears cleanly | | |
| U-05 | Navigation transitions | Any | Horizontal slide, no jank | | |
| U-06 | Bottom nav responsiveness | Any | Active tab highlights, no flicker | | |
| U-07 | Gesture back navigation | Android 10+ | Swipe back works correctly | | |
| U-08 | Small phone (5" screen) layout | Redmi 4A-equiv | No overflow, scroll works | | |
| U-09 | Readability in direct sunlight | Outdoors | Contrast sufficient | | |
| U-10 | Empty state on portfolio (new user) | `Aadhi Kumar` | "Start saving" hero shown | | |

---

## 🏢 ADMIN-SIDE TESTING

> Access Admin Panel at: `http://localhost:5500` (or configured local server)  
> Use account: `admin@aishwaryam.com`

| # | Test Case | Expected Result | Status | Notes |
|:---|:---|:---|:---|:---|
| ADM-01 | Login to admin panel | Dashboard loads with stats | | |
| ADM-02 | View all registered users | User list with pagination | | |
| ADM-03 | Search user by phone number | Correct user found | | |
| ADM-04 | View KYC submissions | Pending list visible | | |
| ADM-05 | Approve KYC for `Meenakshi Devi` | Status → Approved in DB | | |
| ADM-06 | Reject KYC for `Priya Sundaram` | Status → Rejected, user notified | | |
| ADM-07 | Create a new gold saving scheme | Scheme appears in app scheme list | | |
| ADM-08 | Edit scheme bonus ladder | Updated bonus visible in app | | |
| ADM-09 | Update live gold price (24K) | App dashboard reflects new price | | |
| ADM-10 | View payment reconciliation report | All payments with status visible | | |
| ADM-11 | Simulate Razorpay webhook receipt | Payment marked complete in DB | | |
| ADM-12 | Issue refund for a cancelled payment | Balance reflects correctly | | |
| ADM-13 | Send push notification to a user | User device receives notification | | |
| ADM-14 | Send push to all Tamil users | Batch delivery succeeds | | |
| ADM-15 | View Dashboard analytics (count, revenue) | Accurate aggregates | | |
| ADM-16 | Download transaction CSV report | Valid CSV with correct data | | |
| ADM-17 | View audit log for price update | Log entry visible with timestamp | | |
| ADM-18 | View audit log for KYC approval | Log entry visible with admin name | | |
| ADM-19 | Test webhook retry on failure | Webhook retried, logged | | |
| ADM-20 | Financial reconciliation: verify paise accuracy | No rounding errors | | |
