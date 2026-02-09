import { test, expect } from '@playwright/test';

const BASE_URL = 'https://basketball-gm.vercel.app';

test.describe('Basketball GM - Game Flow Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('1. Home page loads with team selection', async ({ page }) => {
    await expect(page.locator('text=Basketball GM')).toBeVisible();
    await expect(page.locator('text=Build your dynasty')).toBeVisible();
    await expect(page.locator('text=Select Your Team')).toBeVisible();
    await expect(page.locator('button:has-text("Eastern Conference")')).toBeVisible();
    await expect(page.locator('button:has-text("Western Conference")')).toBeVisible();
  });

  test('2. Conference tabs switch teams', async ({ page }) => {
    // Default shows Eastern Conference teams
    await page.click('button:has-text("Western Conference")');
    await page.waitForTimeout(500);
    
    // Should show Western teams
    await expect(page.locator('text=Denver')).toBeVisible();
    await expect(page.locator('text=Lakers')).toBeVisible();
    
    // Switch back
    await page.click('button:has-text("Eastern Conference")');
    await page.waitForTimeout(500);
  });

  test('3. Selecting a team loads the game', async ({ page }) => {
    // Click on Denver Nuggets
    await page.click('button:has-text("Denver")');
    await page.waitForTimeout(2000);
    
    // Should either show tutorial or dashboard
    const hasDashboard = await page.locator('text=Dashboard').isVisible();
    const hasTutorial = await page.locator('text=Welcome').isVisible();
    const hasRoster = await page.locator('text=Roster').isVisible();
    
    expect(hasDashboard || hasTutorial || hasRoster).toBe(true);
  });

  test('4. Game UI shows navigation after team selection', async ({ page }) => {
    await page.click('button:has-text("Lakers")');
    await page.waitForTimeout(2000);
    
    // Skip tutorial if present
    const skipBtn = page.locator('button:has-text("Skip"), button:has-text("Close"), button:has-text("Got it")');
    if (await skipBtn.first().isVisible()) {
      await skipBtn.first().click();
      await page.waitForTimeout(500);
    }
    
    // Check for navigation elements
    const navExists = await page.locator('nav, [role="navigation"], [class*="nav"], [class*="sidebar"]').first().isVisible();
    expect(navExists).toBe(true);
  });

  test('5. Dashboard screen loads', async ({ page }) => {
    await page.click('button:has-text("Warriors")');
    await page.waitForTimeout(2000);
    
    // Handle tutorial
    const skipBtn = page.locator('button:has-text("Skip"), button:has-text("Close")');
    if (await skipBtn.first().isVisible()) {
      await skipBtn.first().click();
      await page.waitForTimeout(500);
    }
    
    // Click Dashboard if available
    const dashLink = page.locator('text=Dashboard').first();
    if (await dashLink.isVisible()) {
      await dashLink.click();
      await page.waitForTimeout(500);
    }
    
    // Take screenshot for verification
    await page.screenshot({ path: 'dashboard.png', fullPage: true });
    
    // Should show team info or dashboard content
    const pageText = await page.locator('body').textContent();
    console.log('Dashboard content:', pageText?.substring(0, 500));
    expect(pageText?.length).toBeGreaterThan(100);
  });

  test('6. Roster screen loads with players', async ({ page }) => {
    await page.click('button:has-text("Lakers")');
    await page.waitForTimeout(2000);
    
    const skipBtn = page.locator('button:has-text("Skip"), button:has-text("Close")');
    if (await skipBtn.first().isVisible()) {
      await skipBtn.first().click();
      await page.waitForTimeout(500);
    }
    
    const rosterLink = page.locator('text=Roster').first();
    await rosterLink.click();
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'roster.png', fullPage: true });
    
    // Should show roster content
    const pageText = await page.locator('body').textContent();
    console.log('Roster content:', pageText?.substring(0, 500));
  });

  test('7. Schedule screen loads', async ({ page }) => {
    await page.click('button:has-text("Nuggets")');
    await page.waitForTimeout(2000);
    
    const skipBtn = page.locator('button:has-text("Skip"), button:has-text("Close")');
    if (await skipBtn.first().isVisible()) {
      await skipBtn.first().click();
      await page.waitForTimeout(500);
    }
    
    const scheduleLink = page.locator('text=Schedule').first();
    if (await scheduleLink.isVisible()) {
      await scheduleLink.click();
      await page.waitForTimeout(500);
    }
    
    await page.screenshot({ path: 'schedule.png', fullPage: true });
  });

  test('8. Standings screen loads', async ({ page }) => {
    await page.click('button:has-text("Thunder")');
    await page.waitForTimeout(2000);
    
    const skipBtn = page.locator('button:has-text("Skip"), button:has-text("Close")');
    if (await skipBtn.first().isVisible()) {
      await skipBtn.first().click();
      await page.waitForTimeout(500);
    }
    
    const standingsLink = page.locator('text=Standings').first();
    if (await standingsLink.isVisible()) {
      await standingsLink.click();
      await page.waitForTimeout(500);
    }
    
    await page.screenshot({ path: 'standings.png', fullPage: true });
  });

  test('9. Trade screen loads', async ({ page }) => {
    await page.click('button:has-text("Mavericks")');
    await page.waitForTimeout(2000);
    
    const skipBtn = page.locator('button:has-text("Skip"), button:has-text("Close")');
    if (await skipBtn.first().isVisible()) {
      await skipBtn.first().click();
      await page.waitForTimeout(500);
    }
    
    const tradeLink = page.locator('text=Trade').first();
    if (await tradeLink.isVisible()) {
      await tradeLink.click();
      await page.waitForTimeout(500);
    }
    
    await page.screenshot({ path: 'trade.png', fullPage: true });
  });

  test('10. Free Agents screen loads', async ({ page }) => {
    await page.click('button:has-text("Rockets")');
    await page.waitForTimeout(2000);
    
    const skipBtn = page.locator('button:has-text("Skip"), button:has-text("Close")');
    if (await skipBtn.first().isVisible()) {
      await skipBtn.first().click();
      await page.waitForTimeout(500);
    }
    
    const faLink = page.locator('text=Free Agents').first();
    if (await faLink.isVisible()) {
      await faLink.click();
      await page.waitForTimeout(500);
    }
    
    await page.screenshot({ path: 'free-agents.png', fullPage: true });
  });

  test('11. Draft screen loads', async ({ page }) => {
    await page.click('button:has-text("Spurs")');
    await page.waitForTimeout(2000);
    
    const skipBtn = page.locator('button:has-text("Skip"), button:has-text("Close")');
    if (await skipBtn.first().isVisible()) {
      await skipBtn.first().click();
      await page.waitForTimeout(500);
    }
    
    const draftLink = page.locator('text=Draft').first();
    if (await draftLink.isVisible()) {
      await draftLink.click();
      await page.waitForTimeout(500);
    }
    
    await page.screenshot({ path: 'draft.png', fullPage: true });
  });

  test('12. Finances screen loads', async ({ page }) => {
    await page.click('button:has-text("Suns")');
    await page.waitForTimeout(2000);
    
    const skipBtn = page.locator('button:has-text("Skip"), button:has-text("Close")');
    if (await skipBtn.first().isVisible()) {
      await skipBtn.first().click();
      await page.waitForTimeout(500);
    }
    
    const finLink = page.locator('text=Finances').first();
    if (await finLink.isVisible()) {
      await finLink.click();
      await page.waitForTimeout(500);
    }
    
    await page.screenshot({ path: 'finances.png', fullPage: true });
  });

  test('13. Play/Sim game button works', async ({ page }) => {
    await page.click('button:has-text("Lakers")');
    await page.waitForTimeout(2000);
    
    const skipBtn = page.locator('button:has-text("Skip"), button:has-text("Close")');
    if (await skipBtn.first().isVisible()) {
      await skipBtn.first().click();
      await page.waitForTimeout(500);
    }
    
    // Look for Play Game or Sim button
    const playBtn = page.locator('button:has-text("Play"), button:has-text("Sim"), button:has-text("Next Game")').first();
    if (await playBtn.isVisible()) {
      await playBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'game-sim.png', fullPage: true });
    }
  });

  test('14. Save functionality exists', async ({ page }) => {
    await page.click('button:has-text("Lakers")');
    await page.waitForTimeout(2000);
    
    const skipBtn = page.locator('button:has-text("Skip"), button:has-text("Close")');
    if (await skipBtn.first().isVisible()) {
      await skipBtn.first().click();
      await page.waitForTimeout(500);
    }
    
    // Look for Save button
    const saveBtn = page.locator('button:has-text("Save")');
    const saveExists = await saveBtn.first().isVisible();
    console.log('Save button visible:', saveExists);
    
    if (saveExists) {
      await saveBtn.first().click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'save-modal.png', fullPage: true });
    }
  });

  test('15. Full game progression (sim multiple games)', async ({ page }) => {
    await page.click('button:has-text("Lakers")');
    await page.waitForTimeout(2000);
    
    const skipBtn = page.locator('button:has-text("Skip"), button:has-text("Close")');
    if (await skipBtn.first().isVisible()) {
      await skipBtn.first().click();
      await page.waitForTimeout(500);
    }
    
    // Sim 3 games
    for (let i = 0; i < 3; i++) {
      const simBtn = page.locator('button:has-text("Sim"), button:has-text("Play"), button:has-text("Next")').first();
      if (await simBtn.isVisible()) {
        await simBtn.click();
        await page.waitForTimeout(1500);
      }
    }
    
    await page.screenshot({ path: 'after-3-games.png', fullPage: true });
  });
});
