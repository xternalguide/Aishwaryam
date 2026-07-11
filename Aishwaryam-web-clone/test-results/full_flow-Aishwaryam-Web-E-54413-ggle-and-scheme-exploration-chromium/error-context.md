# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: full_flow.spec.ts >> Aishwaryam Web End-to-End Core Flows >> Complete user flow: login, dashboard, tabs, language toggle, and scheme exploration
- Location: tests\full_flow.spec.ts:4:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e5]:
  - generic [ref=e6]:
    - img "Logo" [ref=e7]
    - heading "Verify OTP" [level=1] [ref=e8]
    - paragraph [ref=e9]: OTP sent to +91 9000000003. Check your SMS inbox.
    - generic [ref=e10]: Incorrect OTP. Please try again.
    - generic [ref=e11]:
      - generic [ref=e12]:
        - textbox [ref=e13]: "1"
        - textbox [ref=e14]: "2"
        - textbox [ref=e15]: "3"
        - textbox [ref=e16]: "4"
        - textbox [ref=e17]: "5"
        - textbox [active] [ref=e18]: "6"
      - generic [ref=e19]: Resend OTP in 5s
  - generic [ref=e20]:
    - button "Verify & Continue" [ref=e21] [cursor=pointer]
    - button "Need Help? Contact Customer Support" [ref=e22] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Aishwaryam Web End-to-End Core Flows', () => {
  4   |   test('Complete user flow: login, dashboard, tabs, language toggle, and scheme exploration', async ({ page }) => {
  5   |     // 1. WELCOME SCREEN & LOGIN
  6   |     await page.goto('/');
  7   | 
  8   |     // Handle Onboarding/Welcome slider if present
  9   |     const loginLink = page.locator('text=Already have an account? Login');
  10  |     try {
  11  |       await loginLink.waitFor({ state: 'visible', timeout: 5000 });
  12  |       await loginLink.click();
  13  |     } catch (e) {
  14  |       console.log('Skipping welcome slider click, moving directly to login.');
  15  |     }
  16  | 
  17  |     // Wait for the Login page to fully load
  18  |     await page.waitForURL(/.*#\/login/);
  19  | 
  20  |     // Enter test phone number (Suresh Rajan)
  21  |     const phoneInput = page.getByPlaceholder('10 digit mobile number');
  22  |     await expect(phoneInput).toBeVisible();
  23  |     await phoneInput.fill('9000000003');
  24  | 
  25  |     // Click "Get OTP"
  26  |     const getOtpButton = page.locator('button', { hasText: /Get OTP|OTP பெறுக/i });
  27  |     await getOtpButton.click();
  28  | 
  29  |     // Fill OTP digits one by one (Test OTP is 123456)
  30  |     const otpInputs = page.locator('input[type="text"][pattern="[0-9]*"]');
  31  |     await expect(otpInputs.first()).toBeVisible();
  32  | 
  33  |     const otpDigits = ['1', '2', '3', '4', '5', '6'];
  34  |     for (let i = 0; i < 6; i++) {
  35  |       await otpInputs.nth(i).fill(otpDigits[i]);
  36  |     }
  37  | 
  38  |     // 2. MPIN ENTRY / SETUP / PROFILE DYNAMIC FLOW
  39  |     // Wait for URL transition
> 40  |     await page.waitForURL(/.*#\/mpin\/.*/);
      |                ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  41  | 
  42  |     const mpinUrl = page.url();
  43  |     if (mpinUrl.includes('mpin/setup')) {
  44  |       console.log('Detected fresh account flow: setting up MPIN.');
  45  |       
  46  |       // Set new MPIN
  47  |       const mpinInputs = page.locator('input[type="tel"]');
  48  |       await expect(mpinInputs.first()).toBeAttached();
  49  |       
  50  |       // Fill Enter New PIN
  51  |       await mpinInputs.nth(0).fill('1234');
  52  |       // Fill Confirm New PIN
  53  |       await mpinInputs.nth(1).fill('1234');
  54  |       
  55  |       // Click Save / சேமி
  56  |       const saveBtn = page.locator('button', { hasText: /Save|சேமி/i });
  57  |       await saveBtn.click();
  58  | 
  59  |       // Check if we transition to Profile Setup
  60  |       await page.waitForURL(/.*#\/(profile-setup|onboarding|dashboard)/);
  61  |       const postMpinUrl = page.url();
  62  |       
  63  |       if (postMpinUrl.includes('profile-setup')) {
  64  |         console.log('Detected profile setup page: completing user registration.');
  65  |         await page.locator('input[type="text"]').nth(0).fill('Suresh Rajan');
  66  |         await page.locator('input[type="email"]').fill('suresh@example.com');
  67  |         await page.locator('button', { hasText: /Complete Registration|பதிவை முடிக்கவும்/i }).click();
  68  |       }
  69  |     } else {
  70  |       console.log('Detected existing account flow: verifying MPIN.');
  71  |       const mpinInput = page.locator('input[type="tel"]');
  72  |       await expect(mpinInput).toBeAttached();
  73  |       await mpinInput.fill('1234');
  74  |     }
  75  | 
  76  |     // 3. DASHBOARD VERIFICATION & TABS NAVIGATION
  77  |     // Wait for redirect to Dashboard
  78  |     await page.waitForURL(/.*#\/dashboard/);
  79  |     
  80  |     // Assert dashboard loaded (check header containing Welcome Back)
  81  |     const dashboardHeader = page.getByText('Welcome Back').first();
  82  |     await expect(dashboardHeader).toBeVisible();
  83  | 
  84  |     // 4. TABS: LEDGER / HISTORY PAGE
  85  |     // Click Ledger Activity / History bottom tab
  86  |     const historyTab = page.locator('[role="button"]:has-text("Ledger Activity"), button:has-text("Ledger Activity"), button:has-text("History"), button:has-text("வரலாறு")');
  87  |     await historyTab.first().click();
  88  |     
  89  |     // Check that we see transactions or ledger headers (support English/Tamil)
  90  |     await expect(page.locator('span, div', { hasText: /Transactions|பரிவர்த்தனைகள்/i }).first()).toBeVisible();
  91  | 
  92  |     // 5. TABS: PROFILE PAGE & LANGUAGE SWITCHING
  93  |     // Click Profile & Settings bottom tab
  94  |     const profileTab = page.locator('[role="button"]:has-text("Profile & Settings"), button:has-text("Profile & Settings"), button:has-text("Profile"), button:has-text("சுயவிவரம்")');
  95  |     await profileTab.first().click();
  96  | 
  97  |     // Locate the language switcher toggle button
  98  |     const langToggle = page.locator('button:has(+ span:text-is("தமிழ்"))');
  99  |     await expect(langToggle).toBeVisible();
  100 | 
  101 |     // Check if the current language is English or Tamil and toggle accordingly
  102 |     const isCurrentlyTamil = await page.locator('text=மொழி').count() > 0;
  103 |     if (isCurrentlyTamil) {
  104 |       console.log('Profile loaded in Tamil. Toggling to English...');
  105 |       await langToggle.click();
  106 |       await expect(page.locator('text=Language')).toBeVisible();
  107 |       
  108 |       console.log('Toggling back to Tamil...');
  109 |       await langToggle.click();
  110 |       await expect(page.locator('text=மொழி')).toBeVisible();
  111 |       
  112 |       // Leave in English for subsequent navigation assertions
  113 |       await langToggle.click();
  114 |       await expect(page.locator('text=Language')).toBeVisible();
  115 |     } else {
  116 |       console.log('Profile loaded in English. Toggling to Tamil...');
  117 |       await langToggle.click();
  118 |       await expect(page.locator('text=மொழி')).toBeVisible();
  119 |       
  120 |       console.log('Toggling back to English...');
  121 |       await langToggle.click();
  122 |       await expect(page.locator('text=Language')).toBeVisible();
  123 |     }
  124 | 
  125 |     // 6. SCHEME EXPLORATION
  126 |     // Navigate back to Home Dashboard tab
  127 |     const homeTab = page.locator('[role="button"]:has-text("Dashboard"), button:has-text("Dashboard"), button:has-text("Home"), button:has-text("முகப்பு")');
  128 |     await homeTab.first().click();
  129 | 
  130 |     // Locate and click "Explore Schemes" action button in Dashboard grid
  131 |     const schemesGridBtn = page.locator('text=Explore Schemes');
  132 |     await expect(schemesGridBtn).toBeVisible();
  133 |     await schemesGridBtn.click();
  134 | 
  135 |     // Assert we transitioned to Scheme Explorer screen
  136 |     await page.waitForURL(/.*#\/scheme-explorer/);
  137 |     await expect(page.getByText('Explore Gold Schemes').first()).toBeVisible();
  138 | 
  139 |     // Click on the first scheme card to view details
  140 |     const firstSchemeCard = page.locator('div[style*="cursor: pointer"]').first();
```