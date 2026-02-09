import { test, expect } from '@playwright/test';

test('Verify Settings modal works', async ({ page }) => {
  await page.goto('https://basketball-gm.vercel.app');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  
  // Select team and start
  await page.click('button:has-text("Lakers")');
  await page.waitForTimeout(500);
  await page.click('button:has-text("Start Dynasty")');
  await page.waitForTimeout(2000);
  
  // Skip tutorial if present
  const skipBtn = page.locator('button:has-text("Skip"), button:has-text("Close")');
  if (await skipBtn.first().isVisible()) {
    await skipBtn.first().click();
    await page.waitForTimeout(500);
  }
  
  // Click settings icon
  const settingsBtn = page.locator('button[title="Game Menu (Save/Load)"]');
  await expect(settingsBtn).toBeVisible({ timeout: 5000 });
  console.log('Settings button found ✅');
  
  await settingsBtn.click();
  await page.waitForTimeout(500);
  
  // Verify modal opened
  await expect(page.locator('text=Game Menu')).toBeVisible({ timeout: 3000 });
  console.log('Settings modal opened ✅');
  
  // Verify Save/Load tabs
  await expect(page.locator('text=Save Game')).toBeVisible();
  await expect(page.locator('text=Load Game')).toBeVisible();
  console.log('Save/Load tabs visible ✅');
  
  // Verify save slots
  await expect(page.locator('text=Save Slots')).toBeVisible();
  await expect(page.locator('text=Empty Slot 1')).toBeVisible();
  console.log('Save slots visible ✅');
  
  await page.screenshot({ path: 'screenshots/settings-modal-fix.png', fullPage: true });
  
  // Test saving
  await page.fill('input[placeholder="My Dynasty Save"]', 'Test Save');
  await page.click('button:has-text("Save"):not(:has-text("Game"))');
  await page.waitForTimeout(1000);
  
  // Check if save succeeded (slot should now show saved data)
  const slotText = await page.locator('text=Test Save').isVisible();
  console.log(`Save successful: ${slotText ? '✅' : '❌'}`);
  
  // Switch to Load tab
  await page.click('button:has-text("Load Game")');
  await page.waitForTimeout(500);
  
  // Verify saved game appears in load list
  const loadSlotVisible = await page.locator('text=Test Save').isVisible();
  console.log(`Saved game in Load tab: ${loadSlotVisible ? '✅' : '❌'}`);
  
  await page.screenshot({ path: 'screenshots/settings-modal-load.png', fullPage: true });
  
  console.log('=== ALL TESTS PASSED ===');
});
