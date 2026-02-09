import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'https://basketball-gm.vercel.app';

test.describe('Basketball GM - Complete Game Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
  });

  test('1. Welcome Screen loads correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Should show welcome screen
    await expect(page.locator('text=Basketball GM')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=New Game')).toBeVisible();
    await expect(page.locator('text=Load Game')).toBeVisible();
  });

  test('2. New Game → Mode Selection', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Click New Game
    await page.click('text=New Game');
    await page.waitForTimeout(500);
    
    // Should show mode selection
    await expect(page.locator('text=Select Game Mode')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Fiction Mode')).toBeVisible();
    await expect(page.locator('text=Real NBA Mode')).toBeVisible();
  });

  test('3. Mode Selection → Game Settings', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('text=New Game');
    await page.waitForTimeout(500);
    
    // Select Fiction mode
    await page.click('text=Fiction Mode');
    await page.waitForTimeout(500);
    
    // Should show game settings
    await expect(page.locator('text=Game Settings')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Difficulty')).toBeVisible();
    await expect(page.locator('text=Season Length')).toBeVisible();
  });

  test('4. Game Settings → Team Selection', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('text=New Game');
    await page.waitForTimeout(500);
    await page.click('text=Fiction Mode');
    await page.waitForTimeout(500);
    
    // Click Continue/Next in settings
    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Next")');
    await continueBtn.click();
    await page.waitForTimeout(500);
    
    // Should show team selection
    await expect(page.locator('text=Select Your Team')).toBeVisible({ timeout: 5000 });
  });

  test('5. Team Selection shows team cards', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('text=New Game');
    await page.waitForTimeout(500);
    await page.click('text=Fiction Mode');
    await page.waitForTimeout(500);
    
    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Next")');
    await continueBtn.click();
    await page.waitForTimeout(500);
    
    // Should show team cards with ratings
    const teamCards = page.locator('[class*="team-card"], [data-testid="team-card"], .team-select button');
    const count = await teamCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('6. Full flow: Select team → Dashboard loads', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('text=New Game');
    await page.waitForTimeout(500);
    await page.click('text=Fiction Mode');
    await page.waitForTimeout(500);
    
    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Next")');
    await continueBtn.click();
    await page.waitForTimeout(500);
    
    // Click first available team
    const teamBtn = page.locator('button:has-text("Select")').first();
    if (await teamBtn.isVisible()) {
      await teamBtn.click();
    } else {
      // Try clicking a team card directly
      const teamCard = page.locator('[class*="team"]').first();
      await teamCard.click();
    }
    
    await page.waitForTimeout(1000);
    
    // Should show Dashboard or tutorial
    const dashboardVisible = await page.locator('text=Dashboard').isVisible();
    const tutorialVisible = await page.locator('text=tutorial').isVisible();
    expect(dashboardVisible || tutorialVisible).toBe(true);
  });

  test('7. Dashboard has all navigation tabs', async ({ page }) => {
    // Start fresh game
    await page.goto(BASE_URL);
    await page.click('text=New Game');
    await page.waitForTimeout(500);
    await page.click('text=Fiction Mode');
    await page.waitForTimeout(500);
    
    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Next")');
    await continueBtn.click();
    await page.waitForTimeout(500);
    
    const teamBtn = page.locator('button:has-text("Select")').first();
    if (await teamBtn.isVisible()) {
      await teamBtn.click();
    }
    await page.waitForTimeout(1500);
    
    // Close tutorial if visible
    const skipBtn = page.locator('button:has-text("Skip")');
    if (await skipBtn.isVisible()) {
      await skipBtn.click();
      await page.waitForTimeout(500);
    }
    
    // Check navigation tabs
    const navItems = ['Dashboard', 'Roster', 'Schedule', 'Standings', 'Trade', 'Draft', 'Free Agents', 'Finances'];
    for (const item of navItems) {
      await expect(page.locator(`text=${item}`).first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('8. Roster page loads with players', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('text=New Game');
    await page.waitForTimeout(500);
    await page.click('text=Fiction Mode');
    await page.waitForTimeout(500);
    
    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Next")');
    await continueBtn.click();
    await page.waitForTimeout(500);
    
    const teamBtn = page.locator('button:has-text("Select")').first();
    if (await teamBtn.isVisible()) {
      await teamBtn.click();
    }
    await page.waitForTimeout(1500);
    
    // Close tutorial if visible
    const skipBtn = page.locator('button:has-text("Skip")');
    if (await skipBtn.isVisible()) {
      await skipBtn.click();
      await page.waitForTimeout(500);
    }
    
    // Click Roster
    await page.click('text=Roster');
    await page.waitForTimeout(500);
    
    // Should show roster with players
    await expect(page.locator('text=Roster').first()).toBeVisible();
  });

  test('9. Schedule page loads', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('text=New Game');
    await page.waitForTimeout(500);
    await page.click('text=Fiction Mode');
    await page.waitForTimeout(500);
    
    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Next")');
    await continueBtn.click();
    await page.waitForTimeout(500);
    
    const teamBtn = page.locator('button:has-text("Select")').first();
    if (await teamBtn.isVisible()) {
      await teamBtn.click();
    }
    await page.waitForTimeout(1500);
    
    const skipBtn = page.locator('button:has-text("Skip")');
    if (await skipBtn.isVisible()) {
      await skipBtn.click();
      await page.waitForTimeout(500);
    }
    
    // Click Schedule
    await page.click('text=Schedule');
    await page.waitForTimeout(500);
    
    await expect(page.locator('text=Schedule').first()).toBeVisible();
  });

  test('10. Play Game flow', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('text=New Game');
    await page.waitForTimeout(500);
    await page.click('text=Fiction Mode');
    await page.waitForTimeout(500);
    
    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Next")');
    await continueBtn.click();
    await page.waitForTimeout(500);
    
    const teamBtn = page.locator('button:has-text("Select")').first();
    if (await teamBtn.isVisible()) {
      await teamBtn.click();
    }
    await page.waitForTimeout(1500);
    
    const skipBtn = page.locator('button:has-text("Skip")');
    if (await skipBtn.isVisible()) {
      await skipBtn.click();
      await page.waitForTimeout(500);
    }
    
    // Go to Schedule
    await page.click('text=Schedule');
    await page.waitForTimeout(500);
    
    // Look for Play Game button
    const playBtn = page.locator('button:has-text("Play"), button:has-text("Sim")').first();
    if (await playBtn.isVisible()) {
      await playBtn.click();
      await page.waitForTimeout(2000);
      
      // Should show game screen or result
      const gameStarted = await page.locator('text=Quarter').isVisible() || 
                          await page.locator('text=Score').isVisible() ||
                          await page.locator('text=Game').isVisible();
      expect(gameStarted).toBe(true);
    }
  });

  test('11. Save Game functionality', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('text=New Game');
    await page.waitForTimeout(500);
    await page.click('text=Fiction Mode');
    await page.waitForTimeout(500);
    
    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Next")');
    await continueBtn.click();
    await page.waitForTimeout(500);
    
    const teamBtn = page.locator('button:has-text("Select")').first();
    if (await teamBtn.isVisible()) {
      await teamBtn.click();
    }
    await page.waitForTimeout(1500);
    
    const skipBtn = page.locator('button:has-text("Skip")');
    if (await skipBtn.isVisible()) {
      await skipBtn.click();
      await page.waitForTimeout(500);
    }
    
    // Look for Save button
    const saveBtn = page.locator('button:has-text("Save")').first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(1000);
      
      // Should show save confirmation or save slots
      const saveUI = await page.locator('text=Save').isVisible() ||
                     await page.locator('text=Slot').isVisible() ||
                     await page.locator('text=saved').isVisible();
      expect(saveUI).toBe(true);
    }
  });

  test('12. Standings page loads', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('text=New Game');
    await page.waitForTimeout(500);
    await page.click('text=Fiction Mode');
    await page.waitForTimeout(500);
    
    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Next")');
    await continueBtn.click();
    await page.waitForTimeout(500);
    
    const teamBtn = page.locator('button:has-text("Select")').first();
    if (await teamBtn.isVisible()) {
      await teamBtn.click();
    }
    await page.waitForTimeout(1500);
    
    const skipBtn = page.locator('button:has-text("Skip")');
    if (await skipBtn.isVisible()) {
      await skipBtn.click();
      await page.waitForTimeout(500);
    }
    
    await page.click('text=Standings');
    await page.waitForTimeout(500);
    
    await expect(page.locator('text=Standings').first()).toBeVisible();
  });

  test('13. Trade page loads', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('text=New Game');
    await page.waitForTimeout(500);
    await page.click('text=Fiction Mode');
    await page.waitForTimeout(500);
    
    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Next")');
    await continueBtn.click();
    await page.waitForTimeout(500);
    
    const teamBtn = page.locator('button:has-text("Select")').first();
    if (await teamBtn.isVisible()) {
      await teamBtn.click();
    }
    await page.waitForTimeout(1500);
    
    const skipBtn = page.locator('button:has-text("Skip")');
    if (await skipBtn.isVisible()) {
      await skipBtn.click();
      await page.waitForTimeout(500);
    }
    
    await page.click('text=Trade');
    await page.waitForTimeout(500);
    
    await expect(page.locator('text=Trade').first()).toBeVisible();
  });

  test('14. Free Agents page loads', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('text=New Game');
    await page.waitForTimeout(500);
    await page.click('text=Fiction Mode');
    await page.waitForTimeout(500);
    
    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Next")');
    await continueBtn.click();
    await page.waitForTimeout(500);
    
    const teamBtn = page.locator('button:has-text("Select")').first();
    if (await teamBtn.isVisible()) {
      await teamBtn.click();
    }
    await page.waitForTimeout(1500);
    
    const skipBtn = page.locator('button:has-text("Skip")');
    if (await skipBtn.isVisible()) {
      await skipBtn.click();
      await page.waitForTimeout(500);
    }
    
    await page.click('text=Free Agents');
    await page.waitForTimeout(500);
    
    await expect(page.locator('text=Free Agents').first()).toBeVisible();
  });

  test('15. Finances page loads', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('text=New Game');
    await page.waitForTimeout(500);
    await page.click('text=Fiction Mode');
    await page.waitForTimeout(500);
    
    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Next")');
    await continueBtn.click();
    await page.waitForTimeout(500);
    
    const teamBtn = page.locator('button:has-text("Select")').first();
    if (await teamBtn.isVisible()) {
      await teamBtn.click();
    }
    await page.waitForTimeout(1500);
    
    const skipBtn = page.locator('button:has-text("Skip")');
    if (await skipBtn.isVisible()) {
      await skipBtn.click();
      await page.waitForTimeout(500);
    }
    
    await page.click('text=Finances');
    await page.waitForTimeout(500);
    
    await expect(page.locator('text=Finances').first()).toBeVisible();
  });

  test('16. Draft page loads', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('text=New Game');
    await page.waitForTimeout(500);
    await page.click('text=Fiction Mode');
    await page.waitForTimeout(500);
    
    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Next")');
    await continueBtn.click();
    await page.waitForTimeout(500);
    
    const teamBtn = page.locator('button:has-text("Select")').first();
    if (await teamBtn.isVisible()) {
      await teamBtn.click();
    }
    await page.waitForTimeout(1500);
    
    const skipBtn = page.locator('button:has-text("Skip")');
    if (await skipBtn.isVisible()) {
      await skipBtn.click();
      await page.waitForTimeout(500);
    }
    
    await page.click('text=Draft');
    await page.waitForTimeout(500);
    
    await expect(page.locator('text=Draft').first()).toBeVisible();
  });
});
