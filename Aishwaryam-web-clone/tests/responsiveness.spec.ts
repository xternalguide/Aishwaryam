import { test, expect } from '@playwright/test';
import * as path from 'path';

const ARTIFACTS_DIR = 'C:/Users/srive/.gemini/antigravity/brain/4ef1d630-cbc6-4b4d-9949-187bbdcabe5c';

test.describe('Aishwaryam Mobile Responsiveness & Text Scaling Audit', () => {
  // Set viewport to mobile size (mimicking default APK display width)
  test.use({ viewport: { width: 375, height: 667 } });

  test('Perform visual audit under normal and scaled conditions', async ({ page }) => {
    // Helper function to inject text scaling override (Elderly Accessibility simulation)
    const applyElderlyScale = async () => {
      await page.evaluate(() => {
        const style = document.createElement('style');
        style.id = 'accessibility-zoom-style';
        style.innerHTML = `
          html, body {
            zoom: 1.35 !important; /* Scale entire viewport contents by 135% */
            -webkit-text-size-adjust: 135% !important;
            text-size-adjust: 135% !important;
          }
        `;
        document.head.appendChild(style);
      });
      console.log('Applied 1.35x display zoom factor.');
    };

    const removeElderlyScale = async () => {
      await page.evaluate(() => {
        const style = document.getElementById('accessibility-zoom-style');
        if (style) style.remove();
      });
      console.log('Restored normal display zoom.');
    };

    // 1. WELCOME SCREEN
    await page.goto('/');
    await page.waitForTimeout(1000); // Wait for splash/animations
    
    // Capture Welcome screen (Normal)
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '01_welcome_normal.png') });
    
    // Capture Welcome screen (Elderly 1.35x Scale)
    await applyElderlyScale();
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '01_welcome_scaled.png') });
    await removeElderlyScale();

    // Navigate to login
    const loginLink = page.locator('text=Already have an account? Login');
    await loginLink.click();
    await page.waitForURL(/.*#\/login/);

    // 2. LOGIN SCREEN
    // Capture Login screen (Normal)
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '02_login_normal.png') });
    
    // Capture Login screen (Scaled)
    await applyElderlyScale();
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '02_login_scaled.png') });
    await removeElderlyScale();

    // Fill phone and submit
    const phoneInput = page.getByPlaceholder('10 digit mobile number');
    await phoneInput.fill('9000000003');
    const getOtpButton = page.locator('button', { hasText: /Get OTP|OTP பெறுக/i });
    await getOtpButton.click();

    // Fill OTP
    const otpInputs = page.locator('input[type="text"][pattern="[0-9]*"]');
    await expect(otpInputs.first()).toBeVisible();
    const otpDigits = ['1', '2', '3', '4', '5', '6'];
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill(otpDigits[i]);
    }

    // 3. MPIN SCREEN
    await page.waitForURL(/.*#\/mpin\/.*/);
    
    // Capture MPIN screen (Normal)
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '03_mpin_normal.png') });
    
    // Capture MPIN screen (Scaled)
    await applyElderlyScale();
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '03_mpin_scaled.png') });
    await removeElderlyScale();

    // Enter MPIN
    const mpinInput = page.locator('input[type="tel"]');
    await expect(mpinInput).toBeAttached();
    await mpinInput.fill('1234');

    // 4. DASHBOARD SCREEN
    await page.waitForURL(/.*#\/dashboard/);
    await page.waitForTimeout(2000); // Let UI fetch price feeds and populate balances

    // Capture Dashboard (Normal)
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '04_dashboard_normal.png') });

    // Capture Dashboard (Scaled)
    await applyElderlyScale();
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '04_dashboard_scaled.png') });
    await removeElderlyScale();

    // 5. LEDGER / TRANSACTION HISTORY SCREEN
    const historyTab = page.locator('[role="button"]:has-text("Ledger Activity"), button:has-text("Ledger Activity"), button:has-text("History"), button:has-text("வரலாறு")');
    await historyTab.first().click();
    await page.waitForTimeout(500);

    // Capture Ledger (Normal)
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '05_ledger_normal.png') });

    // Capture Ledger (Scaled)
    await applyElderlyScale();
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '05_ledger_scaled.png') });
    await removeElderlyScale();

    // 6. PROFILE SCREEN
    const profileTab = page.locator('[role="button"]:has-text("Profile & Settings"), button:has-text("Profile & Settings"), button:has-text("Profile"), button:has-text("சுயவிவரம்")');
    await profileTab.first().click();
    await page.waitForTimeout(500);

    // Capture Profile (Normal)
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '06_profile_normal.png') });

    // Capture Profile (Scaled)
    await applyElderlyScale();
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '06_profile_scaled.png') });
    await removeElderlyScale();

    // 7. SCHEME EXPLORER SCREEN
    const homeTab = page.locator('[role="button"]:has-text("Dashboard"), button:has-text("Dashboard"), button:has-text("Home"), button:has-text("முகப்பு")');
    await homeTab.first().click();
    // Locate and click "Schemes" action button in Dashboard grid
    const schemesGridBtn = page.locator('.dash-action-hover', { hasText: /Schemes|திட்டங்கள்/i }).first();
    await schemesGridBtn.click();
    await page.waitForURL(/.*#\/scheme-explorer/);
    await page.waitForTimeout(500);

    // Capture Scheme Explorer (Normal)
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '07_explorer_normal.png') });

    // Capture Scheme Explorer (Scaled)
    await applyElderlyScale();
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '07_explorer_scaled.png') });
    await removeElderlyScale();

    // 8. SCHEME DETAIL SCREEN
    const firstSchemeCard = page.locator('div[style*="cursor: pointer"]').first();
    await firstSchemeCard.click();
    await page.waitForURL(/.*#\/scheme-detail.*/);
    await page.waitForTimeout(500);

    // Capture Scheme Detail (Normal)
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '08_detail_normal.png') });

    // Capture Scheme Detail (Scaled)
    await applyElderlyScale();
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '08_detail_scaled.png') });
    await removeElderlyScale();
  });
});
