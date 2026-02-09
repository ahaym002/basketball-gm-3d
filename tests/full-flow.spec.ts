import { test, expect } from '@playwright/test';

test.describe('Basketball GM - Full Game Flow', () => {

  test('Complete game flow test', async ({ page }) => {
    // 1. Load and clear state
    await page.goto('https://basketball-gm.vercel.app');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    console.log('=== STEP 1: Team Selection ===');
    
    // 2. Select a team (Lakers)
    await page.click('button:has-text("Lakers")');
    await page.waitForTimeout(500);
    
    // 3. Click Start Dynasty button
    const startBtn = page.locator('button:has-text("Start Dynasty")');
    await expect(startBtn).toBeVisible({ timeout: 3000 });
    console.log('Start Dynasty button found');
    await startBtn.click();
    await page.waitForTimeout(2000);
    
    console.log('=== STEP 2: Game Started ===');
    await page.screenshot({ path: 'screenshots/01-after-start.png', fullPage: true });
    
    // 4. Check if tutorial/game loaded
    const bodyText = await page.locator('body').textContent();
    console.log('Page after start:', bodyText?.substring(0, 300));
    
    // 5. Handle tutorial if present
    const skipBtn = page.locator('button:has-text("Skip"), button:has-text("Close"), button:has-text("Got it"), button:has-text("Continue")');
    let tutorialSteps = 0;
    while (await skipBtn.first().isVisible() && tutorialSteps < 10) {
      await skipBtn.first().click();
      await page.waitForTimeout(500);
      tutorialSteps++;
    }
    console.log(`Skipped ${tutorialSteps} tutorial steps`);
    
    await page.screenshot({ path: 'screenshots/02-after-tutorial.png', fullPage: true });
    
    // 6. Check navigation elements
    console.log('=== STEP 3: Checking Navigation ===');
    const navItems = ['Dashboard', 'Roster', 'Schedule', 'Standings', 'Trade', 'Draft', 'Free Agents', 'Finances'];
    for (const item of navItems) {
      const el = page.locator(`text=${item}`).first();
      const visible = await el.isVisible().catch(() => false);
      console.log(`${item}: ${visible ? '✅' : '❌'}`);
    }
    
    // 7. Test Roster
    console.log('=== STEP 4: Testing Roster ===');
    const rosterLink = page.locator('text=Roster').first();
    if (await rosterLink.isVisible()) {
      await rosterLink.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/03-roster.png', fullPage: true });
      
      // Check for player cards or table
      const playerContent = await page.locator('body').textContent();
      const hasPlayers = playerContent?.includes('PG') || playerContent?.includes('SG') || 
                        playerContent?.includes('SF') || playerContent?.includes('PF') || 
                        playerContent?.includes('C') || playerContent?.includes('OVR');
      console.log(`Players visible: ${hasPlayers ? '✅' : '❌'}`);
    }
    
    // 8. Test Schedule
    console.log('=== STEP 5: Testing Schedule ===');
    const scheduleLink = page.locator('text=Schedule').first();
    if (await scheduleLink.isVisible()) {
      await scheduleLink.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/04-schedule.png', fullPage: true });
    }
    
    // 9. Test Play/Sim Game
    console.log('=== STEP 6: Testing Game Sim ===');
    const simBtn = page.locator('button:has-text("Play"), button:has-text("Sim"), button:has-text("Next")').first();
    if (await simBtn.isVisible()) {
      console.log('Found sim button');
      await simBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/05-game-sim.png', fullPage: true });
    }
    
    // 10. Test Standings
    console.log('=== STEP 7: Testing Standings ===');
    const standingsLink = page.locator('text=Standings').first();
    if (await standingsLink.isVisible()) {
      await standingsLink.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/06-standings.png', fullPage: true });
    }
    
    // 11. Test Trade
    console.log('=== STEP 8: Testing Trade ===');
    const tradeLink = page.locator('text=Trade').first();
    if (await tradeLink.isVisible()) {
      await tradeLink.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/07-trade.png', fullPage: true });
    }
    
    // 12. Test Save
    console.log('=== STEP 9: Testing Save ===');
    const saveBtn = page.locator('button:has-text("Save")').first();
    if (await saveBtn.isVisible()) {
      console.log('Save button found ✅');
      await saveBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/08-save-modal.png', fullPage: true });
    } else {
      console.log('Save button not found ❌');
    }
    
    // 13. Back to Dashboard
    console.log('=== STEP 10: Back to Dashboard ===');
    const dashLink = page.locator('text=Dashboard').first();
    if (await dashLink.isVisible()) {
      await dashLink.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/09-dashboard.png', fullPage: true });
    }
    
    console.log('=== TEST COMPLETE ===');
  });
});
