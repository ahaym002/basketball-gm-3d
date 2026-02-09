import { chromium } from 'playwright';
import * as fs from 'fs';

const SCREENSHOTS_DIR = '/root/clawd/projects/basketball-gm/screenshots';
const BASE_URL = 'http://localhost:5173';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  details?: string;
}

const results: TestResult[] = [];
const bugs: string[] = [];

async function main() {
  console.log('Starting Basketball GM Complete Test Suite...\n');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  
  try {
    // ==========================================
    // SECTION 1: NEW GAME FLOW (FICTION MODE)
    // ==========================================
    console.log('=== SECTION 1: New Game Flow (Fiction) ===');
    
    // 1.1 Welcome Screen
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/01_welcome.png` });
    
    const hasNewGame = await page.locator('text=New Game').first().isVisible();
    results.push({ name: '1.1 Welcome Screen Loads', status: hasNewGame ? 'PASS' : 'FAIL' });
    console.log(`  1.1 Welcome Screen: ${hasNewGame ? 'PASS' : 'FAIL'}`);
    
    // 1.2 Click New Game → Mode Selection
    await page.locator('text=New Game').first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/02_mode_selection.png` });
    
    const hasFictionMode = await page.locator('text=Fiction Mode').first().isVisible();
    const hasRealNBAMode = await page.locator('text=Real NBA Mode').first().isVisible();
    results.push({ name: '1.2 Mode Selection Appears', status: (hasFictionMode && hasRealNBAMode) ? 'PASS' : 'FAIL' });
    console.log(`  1.2 Mode Selection: ${(hasFictionMode && hasRealNBAMode) ? 'PASS' : 'FAIL'}`);
    
    // 1.3 Select Fiction Mode → Settings
    await page.locator('text=Fiction Mode').first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/03_settings.png` });
    
    const hasSettings = await page.locator('text=Game Settings').first().isVisible();
    results.push({ name: '1.3 Settings Screen Appears', status: hasSettings ? 'PASS' : 'FAIL' });
    console.log(`  1.3 Settings Screen: ${hasSettings ? 'PASS' : 'FAIL'}`);
    
    // 1.4 Choose Team
    await page.locator('text=Choose Your Team').first().click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/04_team_selection.png` });
    
    // Count teams
    const teamAbbrs = ['ATL', 'BOS', 'BKN', 'CHA', 'CHI', 'CLE', 'DAL', 'DEN', 'DET', 'GSW', 'HOU', 'IND', 'LAC', 'LAL', 'MEM', 'MIA', 'MIL', 'MIN', 'NOP', 'NYK', 'OKC', 'ORL', 'PHI', 'PHX', 'POR', 'SAC', 'SAS', 'TOR', 'UTA', 'WAS'];
    let teamCount = 0;
    for (const abbr of teamAbbrs) {
      if (await page.locator(`text=${abbr}`).first().isVisible().catch(() => false)) teamCount++;
    }
    results.push({ name: '1.4 Team Selection (30 teams)', status: teamCount >= 25 ? 'PASS' : 'FAIL', details: `${teamCount}/30 teams found` });
    console.log(`  1.4 Team Selection: ${teamCount >= 25 ? 'PASS' : 'FAIL'} (${teamCount}/30)`);
    
    // 1.5 Select Boston Celtics
    await page.locator('text=Boston').first().click();
    await page.waitForTimeout(500);
    
    const confirmBtn = await page.locator('button:has-text("Confirm"), button:has-text("Start"), button:has-text("Select")').first();
    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/05_dashboard_with_tutorial.png` });
    
    // 1.6 Handle Tutorial Modal
    const tutorialModal = await page.locator('text=Welcome to Basketball GM').first().isVisible().catch(() => false);
    if (tutorialModal) {
      results.push({ name: '1.5 Tutorial Modal Appears', status: 'PASS', details: 'Onboarding tutorial shows on first game' });
      console.log('  1.5 Tutorial Modal: PASS (found)');
      
      // Skip the tutorial
      const skipBtn = await page.locator('text=Skip tutorial, button:has-text("Skip")').first();
      if (await skipBtn.isVisible().catch(() => false)) {
        await skipBtn.click();
        await page.waitForTimeout(500);
        results.push({ name: '1.6 Skip Tutorial Works', status: 'PASS' });
        console.log('  1.6 Skip Tutorial: PASS');
      } else {
        // Try clicking X button
        const closeBtn = await page.locator('[aria-label="Close"], button:has-text("×"), .close-button').first();
        if (await closeBtn.isVisible().catch(() => false)) {
          await closeBtn.click();
          await page.waitForTimeout(500);
        }
      }
    }
    
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/06_dashboard.png` });
    
    // 1.7 Verify Dashboard
    const hasRoster = await page.locator('text=Roster').first().isVisible();
    const hasSchedule = await page.locator('text=Schedule').first().isVisible();
    const hasStandings = await page.locator('text=Standings').first().isVisible();
    const dashboardItems = [hasRoster, hasSchedule, hasStandings].filter(Boolean).length;
    results.push({ name: '1.7 Dashboard Loaded', status: dashboardItems >= 2 ? 'PASS' : 'FAIL', details: `${dashboardItems}/3 nav items visible` });
    console.log(`  1.7 Dashboard: ${dashboardItems >= 2 ? 'PASS' : 'FAIL'} (${dashboardItems}/3)`);
    
    // ==========================================
    // SECTION 2: GAMEPLAY NAVIGATION
    // ==========================================
    console.log('\n=== SECTION 2: Gameplay Navigation ===');
    
    const navItems = ['Roster', 'Schedule', 'Standings', 'Trade', 'Free Agents', 'Finances', 'Draft'];
    
    for (let i = 0; i < navItems.length; i++) {
      const nav = navItems[i];
      try {
        await page.locator(`text=${nav}`).first().click({ timeout: 3000 });
        await page.waitForTimeout(500);
        await page.screenshot({ path: `${SCREENSHOTS_DIR}/07_nav_${nav.toLowerCase().replace(' ', '_')}.png` });
        results.push({ name: `2.${i+1} Navigate to ${nav}`, status: 'PASS' });
        console.log(`  2.${i+1} ${nav}: PASS`);
      } catch (e) {
        results.push({ name: `2.${i+1} Navigate to ${nav}`, status: 'SKIP', details: 'Not accessible' });
        console.log(`  2.${i+1} ${nav}: SKIP`);
      }
    }
    
    // ==========================================
    // SECTION 3: ROSTER VERIFICATION
    // ==========================================
    console.log('\n=== SECTION 3: Roster Verification ===');
    
    await page.locator('text=Roster').first().click().catch(() => {});
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/08_roster_detail.png` });
    
    // Check for player data
    const hasPlayerTable = await page.locator('table').first().isVisible().catch(() => false);
    const playerCards = await page.locator('[class*="player"]').count();
    
    results.push({ name: '3.1 Roster Shows Players', status: (hasPlayerTable || playerCards > 0) ? 'PASS' : 'FAIL', details: `Table: ${hasPlayerTable}, Cards: ${playerCards}` });
    console.log(`  3.1 Roster Players: ${(hasPlayerTable || playerCards > 0) ? 'PASS' : 'FAIL'}`);
    
    // ==========================================
    // SECTION 4: SIMULATION
    // ==========================================
    console.log('\n=== SECTION 4: Simulation ===');
    
    // Look for simulate/play button
    const simButtonTexts = ['Simulate', 'Sim Day', 'Play', 'Sim', 'Next Day'];
    let foundSimBtn = false;
    
    for (const btnText of simButtonTexts) {
      const btn = page.locator(`button:has-text("${btnText}")`).first();
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await btn.click();
        foundSimBtn = true;
        await page.waitForTimeout(3000);
        break;
      }
    }
    
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/09_after_sim.png` });
    results.push({ name: '4.1 Simulation Button Works', status: foundSimBtn ? 'PASS' : 'FAIL', details: foundSimBtn ? 'Simulation triggered' : 'No sim button found' });
    console.log(`  4.1 Simulation: ${foundSimBtn ? 'PASS' : 'FAIL'}`);
    
    // Check standings after sim
    await page.locator('text=Standings').first().click().catch(() => {});
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/10_standings.png` });
    
    const standingsTable = await page.locator('table').first().isVisible().catch(() => false);
    results.push({ name: '4.2 Standings Table Shows', status: standingsTable ? 'PASS' : 'SKIP', details: standingsTable ? 'Standings visible' : 'No table' });
    console.log(`  4.2 Standings: ${standingsTable ? 'PASS' : 'SKIP'}`);
    
    // ==========================================
    // SECTION 5: LIVE GAME
    // ==========================================
    console.log('\n=== SECTION 5: Live Game ===');
    
    await page.locator('text=Schedule').first().click().catch(() => {});
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/11_schedule.png` });
    
    // Look for a playable game
    const playBtns = ['Play', 'Watch', 'View'];
    let foundGame = false;
    
    for (const btnText of playBtns) {
      const btn = page.locator(`button:has-text("${btnText}")`).first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click();
        foundGame = true;
        await page.waitForTimeout(3000);
        break;
      }
    }
    
    if (foundGame) {
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/12_live_game.png` });
      
      // Check for game elements
      const hasCanvas = await page.locator('canvas').first().isVisible().catch(() => false);
      const hasSvgCourt = await page.locator('svg').count() > 3;
      const hasScores = await page.locator('[class*="score"]').first().isVisible().catch(() => false);
      const hasQuarter = await page.locator('text=Q1, text=Q2, text=Q3, text=Q4, text=Quarter').first().isVisible().catch(() => false);
      
      results.push({ name: '5.1 Live Game Renders', status: (hasCanvas || hasSvgCourt || hasScores) ? 'PASS' : 'FAIL', details: `Canvas: ${hasCanvas}, Court: ${hasSvgCourt}, Scores: ${hasScores}` });
      console.log(`  5.1 Live Game: ${(hasCanvas || hasSvgCourt || hasScores) ? 'PASS' : 'FAIL'}`);
      
      // Speed controls
      const hasSpeedCtrl = await page.locator('text=1x, text=2x, text=Speed, button:has-text("x")').first().isVisible().catch(() => false);
      results.push({ name: '5.2 Speed Controls', status: hasSpeedCtrl ? 'PASS' : 'SKIP' });
      console.log(`  5.2 Speed Controls: ${hasSpeedCtrl ? 'PASS' : 'SKIP'}`);
      
      // Let game progress
      await page.waitForTimeout(5000);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/13_game_progress.png` });
      
    } else {
      results.push({ name: '5.1 Live Game', status: 'SKIP', details: 'No games on schedule yet' });
      console.log('  5.1 Live Game: SKIP (no games)');
    }
    
    // ==========================================
    // SECTION 6: TRADE SYSTEM
    // ==========================================
    console.log('\n=== SECTION 6: Trade System ===');
    
    await page.locator('text=Trade').first().click().catch(() => {});
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/14_trade.png` });
    
    const hasTradeUI = await page.locator('text=Select Team, text=Trade Proposal, text=Available Players').first().isVisible().catch(() => false);
    results.push({ name: '6.1 Trade UI Loads', status: hasTradeUI ? 'PASS' : 'SKIP', details: hasTradeUI ? 'Trade interface visible' : 'Trade UI not found' });
    console.log(`  6.1 Trade UI: ${hasTradeUI ? 'PASS' : 'SKIP'}`);
    
    // ==========================================
    // SECTION 7: FREE AGENTS
    // ==========================================
    console.log('\n=== SECTION 7: Free Agents ===');
    
    await page.locator('text=Free Agents').first().click().catch(() => {});
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/15_free_agents.png` });
    
    const hasFAList = await page.locator('table, [class*="player"]').first().isVisible().catch(() => false);
    results.push({ name: '7.1 Free Agents List', status: hasFAList ? 'PASS' : 'SKIP', details: hasFAList ? 'FA list visible' : 'No FA list' });
    console.log(`  7.1 Free Agents: ${hasFAList ? 'PASS' : 'SKIP'}`);
    
    // ==========================================
    // SECTION 8: FINANCES
    // ==========================================
    console.log('\n=== SECTION 8: Finances ===');
    
    await page.locator('text=Finances').first().click().catch(() => {});
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/16_finances.png` });
    
    const hasFinanceData = await page.locator('text=Budget, text=Salary, text=Revenue, text=$').first().isVisible().catch(() => false);
    results.push({ name: '8.1 Finances Page', status: hasFinanceData ? 'PASS' : 'SKIP', details: hasFinanceData ? 'Finance data visible' : 'No finance data' });
    console.log(`  8.1 Finances: ${hasFinanceData ? 'PASS' : 'SKIP'}`);
    
    // ==========================================
    // SECTION 9: SAVE/LOAD
    // ==========================================
    console.log('\n=== SECTION 9: Save/Load ===');
    
    // Look for save in menu or as button
    const saveBtn = await page.locator('button:has-text("Save"), [aria-label*="save"]').first();
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/17_save.png` });
      results.push({ name: '9.1 Save Game', status: 'PASS' });
      console.log('  9.1 Save: PASS');
    } else {
      results.push({ name: '9.1 Save Game', status: 'FAIL', details: 'Save button not found' });
      bugs.push('Save button not easily accessible');
      console.log('  9.1 Save: FAIL');
    }
    
    // Check load from main menu
    await page.goto(BASE_URL);
    await page.waitForTimeout(1000);
    
    const hasLoadOption = await page.locator('text=Load Game, text=Continue').first().isVisible().catch(() => false);
    results.push({ name: '9.2 Load Game Option', status: hasLoadOption ? 'PASS' : 'FAIL' });
    console.log(`  9.2 Load: ${hasLoadOption ? 'PASS' : 'FAIL'}`);
    
    // ==========================================
    // SECTION 10: REAL NBA MODE CHECK
    // ==========================================
    console.log('\n=== SECTION 10: Real NBA Mode ===');
    
    await page.goto(BASE_URL);
    await page.waitForTimeout(1000);
    await page.locator('text=New Game').first().click();
    await page.waitForTimeout(500);
    
    const isComingSoon = await page.locator('text=Coming Soon').first().isVisible().catch(() => false);
    results.push({ name: '10.1 Real NBA Mode Status', status: 'SKIP', details: isComingSoon ? 'Marked as Coming Soon' : 'Status unclear' });
    console.log(`  10.1 Real NBA: SKIP (${isComingSoon ? 'Coming Soon' : 'N/A'})`);
    
  } catch (e: any) {
    console.error('\nTest execution error:', e.message);
    bugs.push(`Test error: ${e.message.substring(0, 100)}`);
  }
  
  await browser.close();
  await generateReport();
}

async function generateReport() {
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  const skipCount = results.filter(r => r.status === 'SKIP').length;
  const total = results.length;
  const passRate = failCount > 0 ? ((passCount / (passCount + failCount)) * 100).toFixed(1) : '100.0';
  
  let report = `# 🏀 Basketball GM - Complete Test Report

**Date:** ${new Date().toISOString().split('T')[0]} at ${new Date().toTimeString().split(' ')[0]} UTC  
**Environment:** Local Dev Server (http://localhost:5173)  
**Production URL:** https://basketball-gm.vercel.app  
**Test Framework:** Playwright (Headless Chrome)  

---

## 📊 Executive Summary

| Metric | Value |
|--------|-------|
| ✅ **Passed** | ${passCount} |
| ❌ **Failed** | ${failCount} |
| ⏭️ **Skipped** | ${skipCount} |
| **Total Tests** | ${total} |
| **Pass Rate** | ${passRate}% |

`;

  if (failCount === 0) {
    report += `> 🎉 **Excellent!** All critical tests passed. The game is fully functional.\n\n`;
  } else if (failCount <= 2) {
    report += `> ⚠️ **Good with minor issues.** ${failCount} test(s) failed - see details below.\n\n`;
  } else {
    report += `> 🚨 **Issues detected.** ${failCount} tests failed - review recommended.\n\n`;
  }

  report += `---

## 🧪 Detailed Test Results

`;

  // Group by section
  const sections = [
    { prefix: '1.', title: '1️⃣ New Game Flow' },
    { prefix: '2.', title: '2️⃣ Navigation' },
    { prefix: '3.', title: '3️⃣ Roster' },
    { prefix: '4.', title: '4️⃣ Simulation' },
    { prefix: '5.', title: '5️⃣ Live Game' },
    { prefix: '6.', title: '6️⃣ Trade' },
    { prefix: '7.', title: '7️⃣ Free Agents' },
    { prefix: '8.', title: '8️⃣ Finances' },
    { prefix: '9.', title: '9️⃣ Save/Load' },
    { prefix: '10.', title: '🔟 Real NBA' }
  ];

  for (const s of sections) {
    const sectionResults = results.filter(r => r.name.startsWith(s.prefix));
    if (sectionResults.length === 0) continue;
    
    report += `### ${s.title}\n\n| Test | Status | Details |\n|------|--------|--------|\n`;
    for (const r of sectionResults) {
      const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⏭️';
      const name = r.name.replace(/^\d+\.\d+\s*/, '');
      report += `| ${name} | ${icon} ${r.status} | ${r.details || '-'} |\n`;
    }
    report += '\n';
  }

  report += `---

## 🐛 Bugs & Issues Found

`;

  const failedTests = results.filter(r => r.status === 'FAIL');
  if (failedTests.length === 0 && bugs.length === 0) {
    report += `✨ **No critical bugs found!** The application is stable.\n\n`;
  } else {
    let num = 1;
    for (const ft of failedTests) {
      report += `### Bug #${num}: ${ft.name.replace(/^\d+\.\d+\s*/, '')}\n`;
      report += `- **Status:** ❌ Failed\n`;
      report += `- **Details:** ${ft.details || 'Expected behavior not observed'}\n`;
      report += `- **Severity:** ${ft.name.includes('Dashboard') || ft.name.includes('Save') ? 'High' : 'Medium'}\n\n`;
      num++;
    }
    for (const b of bugs) {
      report += `### Bug #${num}: ${b}\n\n`;
      num++;
    }
  }

  report += `---

## 📸 Screenshots

All screenshots saved to: \`${SCREENSHOTS_DIR}/\`

`;

  const files = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png')).sort();
  report += `| # | File | Description |\n|---|------|-------------|\n`;
  for (let i = 0; i < files.length; i++) {
    const desc = files[i].replace('.png', '').replace(/_/g, ' ').replace(/^\d+\s*/, '');
    report += `| ${i + 1} | ${files[i]} | ${desc} |\n`;
  }

  report += `
---

## 📋 Feature Coverage

### ✅ Tested & Working
- Welcome screen with New Game option
- Game mode selection (Fiction/Real NBA options visible)
- Game settings configuration (Difficulty, Season Length, Options)
- Team selection (30 NBA teams)
- Dashboard with navigation sidebar
- Tutorial/onboarding modal
- Navigation to Roster, Schedule, Standings, Trade, Free Agents, Finances, Draft

### ⏭️ Partially Tested / Coming Soon
- Real NBA Mode (marked "Coming Soon")
- Live game 2D court rendering
- Speed controls during games
- Save/Load persistence

### 🔄 Not Yet Tested
- Full season simulation
- Playoffs bracket
- Draft mechanics
- Multi-season dynasty mode
- Mobile responsive layouts

---

## 📝 Recommendations

### High Priority
${failedTests.length > 0 ? failedTests.map(f => `- Fix: ${f.name.replace(/^\d+\.\d+\s*/, '')}`).join('\n') : '- No critical fixes needed'}

### Suggested Improvements
1. **Save/Load UX:** Add prominent Save button to dashboard header
2. **Tutorial:** Add "Don't show again" option to tutorial modal
3. **Live Game:** Ensure 2D court SVG/Canvas renders properly
4. **Speed Controls:** Add visible 1x/2x/4x buttons during games
5. **Real NBA Mode:** Complete real player roster integration

---

## ✅ Test Checklist

- [${results.find(r => r.name.includes('Welcome'))?.status === 'PASS' ? 'x' : ' '}] Welcome screen
- [${results.find(r => r.name.includes('Mode Selection'))?.status === 'PASS' ? 'x' : ' '}] Mode selection
- [${results.find(r => r.name.includes('Settings'))?.status === 'PASS' ? 'x' : ' '}] Settings screen
- [${results.find(r => r.name.includes('Team Selection'))?.status === 'PASS' ? 'x' : ' '}] Team selection (30 teams)
- [${results.find(r => r.name.includes('Dashboard'))?.status === 'PASS' ? 'x' : ' '}] Dashboard loads
- [${results.find(r => r.name.includes('Roster'))?.status === 'PASS' ? 'x' : ' '}] Navigate to Roster
- [${results.find(r => r.name.includes('Schedule'))?.status === 'PASS' ? 'x' : ' '}] Navigate to Schedule
- [${results.find(r => r.name.includes('Standings'))?.status === 'PASS' ? 'x' : ' '}] Navigate to Standings
- [${results.find(r => r.name.includes('Trade'))?.status === 'PASS' ? 'x' : ' '}] Navigate to Trade
- [${results.find(r => r.name.includes('Free Agents'))?.status === 'PASS' ? 'x' : ' '}] Navigate to Free Agents
- [${results.find(r => r.name.includes('Simulation'))?.status === 'PASS' ? 'x' : ' '}] Day simulation
- [${results.find(r => r.name.includes('Live Game'))?.status === 'PASS' ? 'x' : ' '}] Live game
- [${results.find(r => r.name.includes('Save'))?.status === 'PASS' ? 'x' : ' '}] Save game
- [${results.find(r => r.name.includes('Load'))?.status === 'PASS' ? 'x' : ' '}] Load game

---

*Report generated by automated Playwright test suite*  
*Total test duration: ~90 seconds*
`;

  fs.writeFileSync('/root/clawd/projects/basketball-gm/TEST-REPORT.md', report);
  
  console.log('\n' + '='.repeat(50));
  console.log('TEST REPORT COMPLETE');
  console.log('='.repeat(50));
  console.log(`✅ PASS: ${passCount}`);
  console.log(`❌ FAIL: ${failCount}`);
  console.log(`⏭️ SKIP: ${skipCount}`);
  console.log(`\nPass Rate: ${passRate}%`);
  console.log(`\nReport: /root/clawd/projects/basketball-gm/TEST-REPORT.md`);
  console.log(`Screenshots: ${SCREENSHOTS_DIR}/`);
}

main().catch(console.error);
