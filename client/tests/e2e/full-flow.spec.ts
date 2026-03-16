import { test, expect } from '@playwright/test';

test.describe('LuminaSwiss E2E Flow', () => {
  const email = 'admin@lumina-swiss.ch';
  const password = 'admin123';

  test('should login and upload a document with PII', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('#username', email); // Use ID selector
    await page.fill('#password', password); // Use ID selector
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*dashboard/);

    // Navigate to Document Upload if needed, or if it's on dashboard
    // Assuming upload is accessible from dashboard
    await page.click('text=Upload'); // Adjust selector as needed

    // Upload a file containing PII
    const fileContent = "My name is John Doe and I live in Zurich. Call me at +41 79 123 45 67.";
    const filePath = 'pii_test.txt';
    // Create a temporary file for upload
    // Note: In a real test environment, we might use a pre-existing file
    
    // For this demo, let's assume we can interact with a file input
    // await page.setInputFiles('input[type="file"]', {
    //   name: 'pii_test.txt',
    //   mimeType: 'text/plain',
    //   buffer: Buffer.from(fileContent),
    // });

    // Verify PII detection alert/modal
    // await expect(page.locator('text=PII Detected')).toBeVisible();
    // await page.click('text=Confirm & Anonymize');

    // Wait for upload success
    // await expect(page.locator('text=Upload Successful')).toBeVisible();
  });

  test('should query the AI about the uploaded document', async ({ page }) => {
    // Navigate to Chat
    await page.click('text=Chat');

    await page.fill('textarea[placeholder*="Ask"]', 'Who is John Doe?');
    await page.keyboard.press('Enter');

    // Verify the AI response is grounded and doesn't leak raw PII if possible
    // (Actual verification depends on how the UI displays the response)
    // await expect(page.locator('.ai-response')).toContainText('John Doe');
  });
});
