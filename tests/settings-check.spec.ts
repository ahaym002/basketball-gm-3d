import { test, expect } from '@playwright/test';

test('Check settings/save menu', async ({ page }) => {
  await page.goto('https://basketball-gm.vercel.app');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  
  // Select a team and start
  await page.click('button:has-text("Lakers")');
  await page.waitForTimeout(500);
  await page.click('button:has-text("Start Dynasty")');
  await page.waitForTimeout(2000);
  
  // Look for settings icon
  const settingsIcon = page.locator('[class*="settings"], [aria-label*="settings"], button:has(svg), .gear, [class*="cog"]');
  console.log('Settings icons found:', await settingsIcon.count());
  
  // Click the gear icon in top right
  const gearBtn = page.locator('button').filter({ has: page.locator('svg') }).last();
  if (await gearBtn.isVisible()) {
    console.log('Clicking settings icon');
    await gearBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/settings-menu.png', fullPage: true });
    
    // Check what's in the menu
    const menuText = await page.locator('body').textContent();
    console.log('Menu content:', menuText?.substring(0, 500));
    
    // Look for Save option
    const saveOption = page.locator('text=Save, text=save');
    if (await saveOption.first().isVisible()) {
      console.log('Save option found!');
    }
  }
  
  // Also check for modal/popup with save
  const saveInPage = page.locator('button:has-text("Save"), text=Save Game');
  console.log('Save buttons found:', await saveInPage.count());
});
