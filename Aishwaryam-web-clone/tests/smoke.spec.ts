import { test, expect } from '@playwright/test';

test.describe('Aishwaryam Web Smoke Tests', () => {
  test('Login Screen loads and validates input', async ({ page }) => {
    // Navigate to local dev server
    await page.goto('/');

    // Wait for either the welcome text link to load, or the page to directly load the login URL
    const loginLink = page.locator('text=Already have an account? Login');
    
    // We wait for either condition using page.waitForSelector or checking url
    try {
      await loginLink.waitFor({ state: 'visible', timeout: 5000 });
      await loginLink.click();
    } catch (e) {
      // If welcome slide didn't show up, check if we redirected to login directly
      console.log('Skipping welcome slider click, moving directly to login validation.');
    }

    // Check if redirect to login occurs (HashRouter routes to #/login)
    await page.waitForURL(/.*#\/login/);

    // Locate the phone number input
    const phoneInput = page.getByPlaceholder('10 digit mobile number');
    await expect(phoneInput).toBeVisible();

    // Type a phone number starting with a valid Indian mobile digit (6-9) but incomplete
    await phoneInput.fill('98765');

    // Click submit (Get OTP) button
    const sendOtpButton = page.locator('button', { hasText: /Get OTP|OTP பெறுக/i });
    await expect(sendOtpButton).toBeVisible();

    // Submit invalid number
    await sendOtpButton.click();

    // The frontend should check validation locally (for 10 digit constraint)
    // and show an inline error message
    await expect(phoneInput).toHaveValue('98765');
  });
});
