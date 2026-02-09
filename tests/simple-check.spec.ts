import { test, expect } from '@playwright/test';

test('Capture page state', async ({ page }) => {
  await page.goto('https://basketball-gm.vercel.app');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Get all visible text
  const bodyText = await page.locator('body').textContent();
  console.log('PAGE TEXT:', bodyText);
  
  // Take screenshot
  await page.screenshot({ path: 'page-state.png', fullPage: true });
  
  // List all buttons
  const buttons = page.locator('button');
  const buttonCount = await buttons.count();
  console.log('BUTTON COUNT:', buttonCount);
  
  for (let i = 0; i < buttonCount; i++) {
    const text = await buttons.nth(i).textContent();
    console.log(`Button ${i}:`, text);
  }
});
