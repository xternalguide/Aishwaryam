import { test, expect } from '@playwright/test';

test.describe('Aishwaryam Web End-to-End Core Flows', () => {
  test('Complete user flow: login, dashboard, tabs, language toggle, and scheme exploration', async ({ page }) => {
    // 1. WELCOME SCREEN & LOGIN
    await page.goto('/');

    // Handle Onboarding/Welcome slider if present
    const loginLink = page.locator('text=Already have an account? Login');
    try {
      await loginLink.waitFor({ state: 'visible', timeout: 5000 });
      await loginLink.click();
    } catch (e) {
      console.log('Skipping welcome slider click, moving directly to login.');
    }

    // Wait for the Login page to fully load
    await page.waitForURL(/.*#\/login/);

    // Enter test phone number (Suresh Rajan)
    const phoneInput = page.getByPlaceholder('10 digit mobile number');
    await expect(phoneInput).toBeVisible();
    await phoneInput.fill('9000000003');

    // Click "Get OTP"
    const getOtpButton = page.locator('button', { hasText: /Get OTP|OTP பெறுக/i });
    await getOtpButton.click();

    // Fill OTP digits one by one (Test OTP is 123456)
    const otpInputs = page.locator('input[type="text"][pattern="[0-9]*"]');
    await expect(otpInputs.first()).toBeVisible();

    const otpDigits = ['1', '2', '3', '4', '5', '6'];
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill(otpDigits[i]);
    }

    // 2. MPIN ENTRY / SETUP / PROFILE DYNAMIC FLOW
    // Wait for URL transition
    await page.waitForURL(/.*#\/mpin\/.*/);

    const mpinUrl = page.url();
    if (mpinUrl.includes('mpin/setup')) {
      console.log('Detected fresh account flow: setting up MPIN.');
      
      // Set new MPIN
      const mpinInputs = page.locator('input[type="tel"]');
      await expect(mpinInputs.first()).toBeAttached();
      
      // Fill Enter New PIN
      await mpinInputs.nth(0).fill('1234');
      // Fill Confirm New PIN
      await mpinInputs.nth(1).fill('1234');
      
      // Click Save / சேமி
      const saveBtn = page.locator('button', { hasText: /Save|சேமி/i });
      await saveBtn.click();

      // Check if we transition to Profile Setup
      await page.waitForURL(/.*#\/(profile-setup|onboarding|dashboard)/);
      const postMpinUrl = page.url();
      
      if (postMpinUrl.includes('profile-setup')) {
        console.log('Detected profile setup page: completing user registration.');
        await page.locator('input[type="text"]').nth(0).fill('Suresh Rajan');
        await page.locator('input[type="email"]').fill('suresh@example.com');
        await page.locator('button', { hasText: /Complete Registration|பதிவை முடிக்கவும்/i }).click();
      }
    } else {
      console.log('Detected existing account flow: verifying MPIN.');
      const mpinInput = page.locator('input[type="tel"]');
      await expect(mpinInput).toBeAttached();
      await mpinInput.fill('1234');
    }

    // 3. DASHBOARD VERIFICATION & TABS NAVIGATION
    // Wait for redirect to Dashboard
    await page.waitForURL(/.*#\/dashboard/);
    
    // Assert dashboard loaded (check header containing Welcome Back)
    const dashboardHeader = page.getByText('Welcome Back').first();
    await expect(dashboardHeader).toBeVisible();

    // 4. TABS: LEDGER / HISTORY PAGE
    // Click Ledger Activity / History bottom tab
    const historyTab = page.locator('[role="button"]:has-text("Ledger Activity"), button:has-text("Ledger Activity"), button:has-text("History"), button:has-text("வரலாறு")');
    await historyTab.first().click();
    
    // Check that we see transactions or ledger headers (support English/Tamil)
    await expect(page.locator('span, div', { hasText: /Transactions|பரிவர்த்தனைகள்/i }).first()).toBeVisible();

    // 5. TABS: PROFILE PAGE & LANGUAGE SWITCHING
    // Click Profile & Settings bottom tab
    const profileTab = page.locator('[role="button"]:has-text("Profile & Settings"), button:has-text("Profile & Settings"), button:has-text("Profile"), button:has-text("சுயவிவரம்")');
    await profileTab.first().click();

    // Locate the language switcher toggle button
    const langToggle = page.locator('button:has(+ span:text-is("தமிழ்"))');
    await expect(langToggle).toBeVisible();

    // Check if the current language is English or Tamil and toggle accordingly
    const isCurrentlyTamil = await page.locator('text=மொழி').count() > 0;
    if (isCurrentlyTamil) {
      console.log('Profile loaded in Tamil. Toggling to English...');
      await langToggle.click();
      await expect(page.locator('text=Language')).toBeVisible();
      
      console.log('Toggling back to Tamil...');
      await langToggle.click();
      await expect(page.locator('text=மொழி')).toBeVisible();
      
      // Leave in English for subsequent navigation assertions
      await langToggle.click();
      await expect(page.locator('text=Language')).toBeVisible();
    } else {
      console.log('Profile loaded in English. Toggling to Tamil...');
      await langToggle.click();
      await expect(page.locator('text=மொழி')).toBeVisible();
      
      console.log('Toggling back to English...');
      await langToggle.click();
      await expect(page.locator('text=Language')).toBeVisible();
    }

    // 6. SCHEME EXPLORATION
    // Navigate back to Home Dashboard tab
    const homeTab = page.locator('[role="button"]:has-text("Dashboard"), button:has-text("Dashboard"), button:has-text("Home"), button:has-text("முகப்பு")');
    await homeTab.first().click();

    // Locate and click "Explore Schemes" action button in Dashboard grid
    const schemesGridBtn = page.locator('text=Explore Schemes');
    await expect(schemesGridBtn).toBeVisible();
    await schemesGridBtn.click();

    // Assert we transitioned to Scheme Explorer screen
    await page.waitForURL(/.*#\/scheme-explorer/);
    await expect(page.getByText('Explore Gold Schemes').first()).toBeVisible();

    // Click on the first scheme card to view details
    const firstSchemeCard = page.locator('div[style*="cursor: pointer"]').first();
    await expect(firstSchemeCard).toBeVisible();
    await firstSchemeCard.click();

    // Verify Scheme Details page loads
    await page.waitForURL(/.*#\/scheme-detail.*/);
    await expect(page.getByText('Plan Specifications').first()).toBeVisible();

    // Navigate back to Scheme Explorer
    const backBtn = page.locator('button:has(svg)');
    await backBtn.first().click();
    
    await page.waitForURL(/.*#\/scheme-explorer/);
  });
});
