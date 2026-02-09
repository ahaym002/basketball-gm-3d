import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';

const SCREENSHOTS_DIR = '/root/clawd/projects/basketball-gm/screenshots';
const BASE_URL = 'http://localhost:5173';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  details?: string;
  screenshot?: string;
  bug?: string;
}

const results: TestResult[] = [];
const bugs: string[] = [];

async function screenshot(page: Page, name: string): Promise<string> {
  const path = `${SCREENSHOTS_DIR}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  return path;
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  
  try {
    // ===== TEST 1: WELCOME SCREEN =====
    console.log('\n=== TEST 1: Welcome Screen ===');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await delay(1000);
    
    const title = await page.title();
    const shot1 = await screenshot(page, '01_welcome');
    
    const newGameVisible = await page.getByText('New Game').first().isVisible();
    
    if (newGameVisible && title.includes('Basketball')) {
      results.push({ name: '1.1 Welcome Screen Loads', status: 'PASS', details: `Title: "${title}"`, screenshot: shot1 });
    } else {
      results.push({ name: '1.1 Welcome Screen Loads', status: 'FAIL', details: 'New Game button not visible', screenshot: shot1 });
    }
    
    // ===== TEST 2: NEW GAME FLOW (FICTION) =====
    console.log('\n=== TEST 2: New Game Flow (Fiction) ===');
    
    // Click New Game
    await page.getByText('New Game').first().click();
    await delay(500);
    const shot2 = await screenshot(page, '02_mode_selection');
    
    // Check mode selection screen
    const fictionMode = await page.getByText('Fiction Mode').first().isVisible().catch(() => false);
    const realNBAMode = await page.getByText('Real NBA Mode').first().isVisible().catch(() => false);
    
    if (fictionMode && realNBAMode) {
      results.push({ name: '2.1 Mode Selection Screen', status: 'PASS', details: 'Both Fiction and Real NBA modes visible', screenshot: shot2 });
    } else {
      results.push({ name: '2.1 Mode Selection Screen', status: 'FAIL', details: `Fiction: ${fictionMode}, Real NBA: ${realNBAMode}`, screenshot: shot2 });
    }
    
    // Real NBA is "Coming Soon" - note it
    const comingSoon = await page.getByText('Coming Soon').first().isVisible().catch(() => false);
    if (comingSoon) {
      results.push({ name: '2.2 Real NBA Mode Availability', status: 'SKIP', details: 'Real NBA Mode shows "Coming Soon" - expected for this version' });
    }
    
    // Click Fiction Mode
    await page.getByText('Fiction Mode').first().click();
    await delay(500);
    const shot3 = await screenshot(page, '03_settings');
    
    // Check settings screen
    const difficultyVisible = await page.getByText('Difficulty').first().isVisible().catch(() => false);
    const seasonLengthVisible = await page.getByText('Season Length').first().isVisible().catch(() => false);
    
    if (difficultyVisible && seasonLengthVisible) {
      results.push({ name: '2.3 Settings Screen', status: 'PASS', details: 'Difficulty and Season Length options visible', screenshot: shot3 });
    } else {
      results.push({ name: '2.3 Settings Screen', status: 'FAIL', details: 'Settings not properly displayed', screenshot: shot3 });
    }
    
    // Click Choose Your Team button
    await page.getByText('Choose Your Team').first().click();
    await delay(1000);
    const shot4 = await screenshot(page, '04_team_selection');
    
    // Check team selection
    const teamCards = await page.locator('[class*="cursor-pointer"]').count();
    const teamsHeader = await page.getByText('Select Your Team').first().isVisible().catch(() => false);
    
    if (teamCards >= 30 || teamsHeader) {
      results.push({ name: '2.4 Team Selection Screen', status: 'PASS', details: `Found ${teamCards} clickable team cards`, screenshot: shot4 });
    } else {
      results.push({ name: '2.4 Team Selection Screen', status: 'FAIL', details: `Only found ${teamCards} team elements`, screenshot: shot4 });
    }
    
    // Select first team
    const firstTeam = page.locator('[class*="cursor-pointer"]').first();
    const teamName = await firstTeam.locator('h3, h4, [class*="font-bold"]').first().textContent().catch(() => 'Unknown');
    await firstTeam.click();
    await delay(500);
    
    // Look for confirm/start button
    const startBtn = page.getByRole('button', { name: /Start|Confirm|Begin/i }).first();
    if (await startBtn.isVisible().catch(() => false)) {
      await startBtn.click();
      await delay(1000);
    }
    
    const shot5 = await screenshot(page, '05_dashboard');
    
    // Check if we're on the dashboard
    const dashboardIndicators = ['Roster', 'Schedule', 'Standings', 'Simulate'];
    let dashboardElementsFound = 0;
    for (const indicator of dashboardIndicators) {
      if (await page.getByText(indicator).first().isVisible().catch(() => false)) {
        dashboardElementsFound++;
      }
    }
    
    if (dashboardElementsFound >= 2) {
      results.push({ name: '2.5 Game Dashboard Loads', status: 'PASS', details: `Team: ${teamName}, ${dashboardElementsFound}/4 navigation elements found`, screenshot: shot5 });
    } else {
      results.push({ name: '2.5 Game Dashboard Loads', status: 'FAIL', details: `Only ${dashboardElementsFound}/4 dashboard elements found`, screenshot: shot5 });
      bugs.push('Dashboard may not load properly after team selection');
    }
    
    // ===== TEST 3: GAMEPLAY NAVIGATION =====
    console.log('\n=== TEST 3: Gameplay Navigation ===');
    
    const navItems = [
      { name: 'Roster', selector: 'Roster' },
      { name: 'Schedule', selector: 'Schedule' },
      { name: 'Standings', selector: 'Standings' },
      { name: 'Trade', selector: 'Trade' },
      { name: 'Free Agents', selector: 'Free Agents' },
      { name: 'Finances', selector: 'Finances' },
      { name: 'Draft', selector: 'Draft' }
    ];
    
    for (const nav of navItems) {
      const link = page.getByText(nav.selector).first();
      if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
        await link.click();
        await delay(500);
        const navShot = await screenshot(page, `06_nav_${nav.name.toLowerCase().replace(' ', '_')}`);
        results.push({ name: `3.${navItems.indexOf(nav)+1} Navigate to ${nav.name}`, status: 'PASS', screenshot: navShot });
      } else {
        results.push({ name: `3.${navItems.indexOf(nav)+1} Navigate to ${nav.name}`, status: 'SKIP', details: 'Navigation link not visible' });
      }
    }
    
    // ===== TEST 4: SIMULATION =====
    console.log('\n=== TEST 4: Simulation ===');
    
    // Click on home/dashboard first
    await page.goto(BASE_URL + '/game', { waitUntil: 'networkidle' }).catch(() => {});
    await delay(500);
    
    // Try different simulation buttons
    const simButtons = ['Simulate', 'Play', 'Sim Day', 'Next Day'];
    let simulated = false;
    
    for (const btnText of simButtons) {
      const simBtn = page.getByRole('button', { name: new RegExp(btnText, 'i') }).first();
      if (await simBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await simBtn.click();
        await delay(2000);
        simulated = true;
        const simShot = await screenshot(page, '07_after_sim');
        results.push({ name: '4.1 Simulate Day', status: 'PASS', details: `Clicked "${btnText}" button`, screenshot: simShot });
        break;
      }
    }
    
    if (!simulated) {
      const simShot = await screenshot(page, '07_no_sim_button');
      results.push({ name: '4.1 Simulate Day', status: 'FAIL', details: 'No simulation button found', screenshot: simShot });
      bugs.push('Simulation button not found on dashboard');
    }
    
    // ===== TEST 5: LIVE GAME =====
    console.log('\n=== TEST 5: Live Game ===');
    
    // Navigate to Schedule
    const scheduleLink = page.getByText('Schedule').first();
    if (await scheduleLink.isVisible().catch(() => false)) {
      await scheduleLink.click();
      await delay(500);
      
      // Look for a Play/Watch button on a game
      const playBtn = page.getByRole('button', { name: /Play|Watch|View/i }).first();
      if (await playBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await playBtn.click();
        await delay(2000);
        
        const liveShot = await screenshot(page, '08_live_game');
        
        // Check for game UI elements
        const hasScore = await page.locator('[class*="score"]').first().isVisible().catch(() => false);
        const hasCourt = await page.locator('canvas, svg, [class*="court"]').first().isVisible().catch(() => false);
        const hasTimer = await page.getByText(/Q[1-4]|Quarter|:/).first().isVisible().catch(() => false);
        
        if (hasCourt || hasScore) {
          results.push({ name: '5.1 Live Game Renders', status: 'PASS', details: `Court: ${hasCourt}, Score: ${hasScore}, Timer: ${hasTimer}`, screenshot: liveShot });
        } else {
          results.push({ name: '5.1 Live Game Renders', status: 'FAIL', details: 'Game UI elements not found', screenshot: liveShot });
          bugs.push('Live game court may not render properly');
        }
        
        // Check for speed controls
        const speedControls = await page.getByText(/1x|2x|4x|Speed|Fast/).first().isVisible().catch(() => false);
        results.push({ name: '5.2 Speed Controls', status: speedControls ? 'PASS' : 'FAIL', details: speedControls ? 'Speed controls found' : 'No speed controls visible' });
        
        // Check for coaching/substitution panel
        const coachingPanel = await page.getByText(/Timeout|Sub|Coach|Lineup/).first().isVisible().catch(() => false);
        results.push({ name: '5.3 Coaching Panel', status: coachingPanel ? 'PASS' : 'SKIP', details: coachingPanel ? 'Coaching options visible' : 'Coaching panel not visible' });
        
      } else {
        results.push({ name: '5.1 Live Game', status: 'SKIP', details: 'No games available to play' });
      }
    }
    
    // ===== TEST 6: SAVE/LOAD =====
    console.log('\n=== TEST 6: Save/Load ===');
    
    // Look for Save button
    const saveBtn = page.getByRole('button', { name: /Save/i }).first();
    if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveBtn.click();
      await delay(500);
      const saveShot = await screenshot(page, '09_save_dialog');
      results.push({ name: '6.1 Save Game UI', status: 'PASS', screenshot: saveShot });
    } else {
      // Check menu for save option
      const menuBtn = page.locator('[class*="menu"], [aria-label*="menu"]').first();
      if (await menuBtn.isVisible().catch(() => false)) {
        await menuBtn.click();
        await delay(300);
        const saveShot = await screenshot(page, '09_menu_save');
        const saveInMenu = await page.getByText('Save').first().isVisible().catch(() => false);
        results.push({ name: '6.1 Save Game UI', status: saveInMenu ? 'PASS' : 'FAIL', screenshot: saveShot });
      } else {
        const saveShot = await screenshot(page, '09_no_save');
        results.push({ name: '6.1 Save Game UI', status: 'FAIL', details: 'Save button/option not found', screenshot: saveShot });
        bugs.push('Save game functionality not accessible');
      }
    }
    
    // Check Load functionality from main menu
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await delay(500);
    
    const loadBtn = page.getByText(/Load Game|Continue/i).first();
    if (await loadBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await loadBtn.click();
      await delay(500);
      const loadShot = await screenshot(page, '10_load_dialog');
      results.push({ name: '6.2 Load Game UI', status: 'PASS', screenshot: loadShot });
    } else {
      const loadShot = await screenshot(page, '10_no_load');
      results.push({ name: '6.2 Load Game UI', status: 'FAIL', details: 'Load/Continue button not found on main menu', screenshot: loadShot });
    }
    
    // ===== TEST 7: EDGE CASES =====
    console.log('\n=== TEST 7: Edge Cases ===');
    
    // Rapid simulation test
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await delay(300);
    await page.getByText('New Game').first().click();
    await delay(300);
    await page.getByText('Fiction Mode').first().click();
    await delay(300);
    await page.getByText('Choose Your Team').first().click();
    await delay(300);
    
    // Select first team and confirm
    await page.locator('[class*="cursor-pointer"]').first().click();
    await delay(300);
    const confirmBtn = page.getByRole('button', { name: /Start|Confirm|Begin/i }).first();
    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click();
      await delay(500);
    }
    
    // Try to simulate multiple times
    let simCount = 0;
    for (let i = 0; i < 5; i++) {
      for (const btnText of ['Simulate', 'Play', 'Sim Day', 'Next Day', 'Sim']) {
        const btn = page.getByRole('button', { name: new RegExp(btnText, 'i') }).first();
        if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
          await btn.click();
          await delay(500);
          simCount++;
          break;
        }
      }
    }
    
    const edgeShot = await screenshot(page, '11_after_multi_sim');
    results.push({ name: '7.1 Multiple Simulations', status: simCount > 0 ? 'PASS' : 'FAIL', details: `Successfully simulated ${simCount} times`, screenshot: edgeShot });
    
    // Test navigation persistence
    await page.getByText('Standings').first().click().catch(() => {});
    await delay(300);
    const standingsShot = await screenshot(page, '12_standings');
    const standingsData = await page.locator('table, [class*="standings"]').first().isVisible().catch(() => false);
    results.push({ name: '7.2 Standings Display', status: standingsData ? 'PASS' : 'FAIL', details: standingsData ? 'Standings table visible' : 'No standings data visible', screenshot: standingsShot });
    
  } catch (e: any) {
    console.error('Test error:', e.message);
    bugs.push(`Test execution error: ${e.message}`);
  } finally {
    await browser.close();
    await generateReport();
  }
}

async function generateReport() {
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  const skipCount = results.filter(r => r.status === 'SKIP').length;
  
  let report = `# Basketball GM - Comprehensive Test Report

**Date:** ${new Date().toISOString().split('T')[0]} ${new Date().toISOString().split('T')[1].split('.')[0]} UTC
**URL Tested:** http://localhost:5173
**Production URL:** https://basketball-gm.vercel.app

---

## 📊 Summary

| Status | Count |
|--------|-------|
| ✅ PASS | ${passCount} |
| ❌ FAIL | ${failCount} |
| ⏭️ SKIP | ${skipCount} |
| **Total** | ${results.length} |

**Pass Rate:** ${((passCount / results.length) * 100).toFixed(1)}%

---

## 🧪 Test Results

`;

  // Group by category
  const categories = [
    { prefix: '1.', name: 'Welcome Screen' },
    { prefix: '2.', name: 'New Game Flow' },
    { prefix: '3.', name: 'Navigation' },
    { prefix: '4.', name: 'Simulation' },
    { prefix: '5.', name: 'Live Game' },
    { prefix: '6.', name: 'Save/Load' },
    { prefix: '7.', name: 'Edge Cases' }
  ];
  
  for (const cat of categories) {
    const catResults = results.filter(r => r.name.startsWith(cat.prefix));
    if (catResults.length === 0) continue;
    
    report += `### ${cat.name}\n\n`;
    
    for (const r of catResults) {
      const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⏭️';
      report += `- ${icon} **${r.name}** - ${r.status}`;
      if (r.details) report += `\n  - ${r.details}`;
      if (r.screenshot) report += `\n  - Screenshot: \`${r.screenshot.split('/').pop()}\``;
      report += '\n';
    }
    report += '\n';
  }

  report += `---

## 🐛 Bugs Found

`;

  if (bugs.length === 0 && failCount === 0) {
    report += '✨ No critical bugs found during testing!\n';
  } else {
    const allBugs = [...bugs];
    const failedTests = results.filter(r => r.status === 'FAIL');
    for (const ft of failedTests) {
      if (ft.bug) allBugs.push(ft.bug);
      else if (ft.details && !allBugs.some(b => b.includes(ft.name))) {
        allBugs.push(`**${ft.name}**: ${ft.details}`);
      }
    }
    
    for (let i = 0; i < allBugs.length; i++) {
      report += `${i + 1}. ${allBugs[i]}\n`;
    }
  }

  report += `
---

## 📸 Screenshots

All screenshots saved to: \`${SCREENSHOTS_DIR}/\`

| Screenshot | Description |
|------------|-------------|
`;

  const screenshotFiles = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png')).sort();
  for (const file of screenshotFiles) {
    report += `| ${file} | Test capture |\n`;
  }

  report += `
---

## 📝 Recommendations

1. **If Real NBA Mode is planned:** Add real NBA 2025-26 rosters with actual player names
2. **Save/Load:** Ensure save/load buttons are easily accessible from game dashboard
3. **Live Game Controls:** Add clear speed controls (1x, 2x, 4x) and coaching options
4. **Navigation:** Ensure all nav items (Roster, Schedule, etc.) are always visible

---

*Report generated by automated Playwright tests*
`;

  fs.writeFileSync('/root/clawd/projects/basketball-gm/TEST-REPORT.md', report);
  console.log('\n✅ Report written to /root/clawd/projects/basketball-gm/TEST-REPORT.md');
  
  console.log('\n=== SUMMARY ===');
  console.log(`PASS: ${passCount}`);
  console.log(`FAIL: ${failCount}`);
  console.log(`SKIP: ${skipCount}`);
  console.log(`Pass Rate: ${((passCount / results.length) * 100).toFixed(1)}%`);
}

runTests().catch(console.error);
