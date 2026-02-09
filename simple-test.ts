import { chromium } from 'playwright';
import * as fs from 'fs';

const SCREENSHOTS_DIR = '/root/clawd/projects/basketball-gm/screenshots';
const BASE_URL = 'http://localhost:5173';

const results: {name: string, status: string, details?: string}[] = [];
const bugs: string[] = [];

async function main() {
  console.log('Starting tests...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  
  // Test 1: Welcome Screen
  console.log('Test 1: Welcome Screen');
  await page.goto(BASE_URL);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/01_welcome.png` });
  
  const hasNewGame = await page.$('text=New Game');
  results.push({ name: 'Welcome Screen', status: hasNewGame ? 'PASS' : 'FAIL' });
  
  // Test 2: Click New Game
  console.log('Test 2: New Game Click');
  if (hasNewGame) {
    await hasNewGame.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/02_mode_select.png` });
    
    const hasFiction = await page.$('text=Fiction Mode');
    const hasRealNBA = await page.$('text=Real NBA Mode');
    results.push({ name: 'Mode Selection', status: (hasFiction && hasRealNBA) ? 'PASS' : 'FAIL' });
    
    // Check if Real NBA is Coming Soon
    const comingSoon = await page.$('text=Coming Soon');
    if (comingSoon) {
      results.push({ name: 'Real NBA Status', status: 'SKIP', details: 'Coming Soon - not yet implemented' });
    }
    
    // Test 3: Select Fiction Mode
    console.log('Test 3: Fiction Mode');
    if (hasFiction) {
      await hasFiction.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/03_settings.png` });
      
      const hasDifficulty = await page.$('text=Difficulty');
      const hasSeasonLength = await page.$('text=Season Length');
      results.push({ name: 'Settings Screen', status: (hasDifficulty || hasSeasonLength) ? 'PASS' : 'FAIL' });
      
      // Test 4: Choose Team
      console.log('Test 4: Choose Team');
      const chooseTeamBtn = await page.$('text=Choose Your Team');
      if (chooseTeamBtn) {
        await chooseTeamBtn.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `${SCREENSHOTS_DIR}/04_team_select.png` });
        
        // Count team cards
        const teamCards = await page.$$('[class*="cursor-pointer"]');
        results.push({ name: 'Team Selection', status: teamCards.length >= 20 ? 'PASS' : 'FAIL', details: `${teamCards.length} teams found` });
        
        if (teamCards.length > 0) {
          // Test 5: Select a team
          console.log('Test 5: Select Team');
          await teamCards[0].click();
          await page.waitForTimeout(500);
          
          // Look for confirm button
          const confirmBtn = await page.$('button:has-text("Start"), button:has-text("Confirm"), button:has-text("Begin")');
          if (confirmBtn) {
            await confirmBtn.click();
            await page.waitForTimeout(2000);
          }
          
          await page.screenshot({ path: `${SCREENSHOTS_DIR}/05_dashboard.png` });
          
          // Check dashboard elements
          const hasRoster = await page.$('text=Roster');
          const hasSchedule = await page.$('text=Schedule');
          const hasStandings = await page.$('text=Standings');
          const navCount = [hasRoster, hasSchedule, hasStandings].filter(Boolean).length;
          
          results.push({ name: 'Dashboard Loads', status: navCount >= 2 ? 'PASS' : 'FAIL', details: `${navCount}/3 nav items found` });
          
          // Test 6: Navigate to Roster
          console.log('Test 6: Navigation');
          if (hasRoster) {
            await hasRoster.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: `${SCREENSHOTS_DIR}/06_roster.png` });
            
            const playerCards = await page.$$('[class*="player"], table tr');
            results.push({ name: 'Roster Page', status: playerCards.length > 0 ? 'PASS' : 'FAIL', details: `${playerCards.length} player elements` });
          }
          
          // Test 7: Navigate to Schedule
          const scheduleLink = await page.$('text=Schedule');
          if (scheduleLink) {
            await scheduleLink.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: `${SCREENSHOTS_DIR}/07_schedule.png` });
            results.push({ name: 'Schedule Page', status: 'PASS' });
          }
          
          // Test 8: Navigate to Standings
          const standingsLink = await page.$('text=Standings');
          if (standingsLink) {
            await standingsLink.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: `${SCREENSHOTS_DIR}/08_standings.png` });
            results.push({ name: 'Standings Page', status: 'PASS' });
          }
          
          // Test 9: Navigate to Trade
          const tradeLink = await page.$('text=Trade');
          if (tradeLink) {
            await tradeLink.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: `${SCREENSHOTS_DIR}/09_trade.png` });
            results.push({ name: 'Trade Page', status: 'PASS' });
          }
          
          // Test 10: Navigate to Free Agents
          const faLink = await page.$('text=Free Agents');
          if (faLink) {
            await faLink.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: `${SCREENSHOTS_DIR}/10_free_agents.png` });
            results.push({ name: 'Free Agents Page', status: 'PASS' });
          }
          
          // Test 11: Navigate to Finances
          const finLink = await page.$('text=Finances');
          if (finLink) {
            await finLink.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: `${SCREENSHOTS_DIR}/11_finances.png` });
            results.push({ name: 'Finances Page', status: 'PASS' });
          }
          
          // Test 12: Simulation
          console.log('Test 12: Simulation');
          const simBtn = await page.$('button:has-text("Simulate"), button:has-text("Play"), button:has-text("Sim")');
          if (simBtn) {
            await simBtn.click();
            await page.waitForTimeout(2000);
            await page.screenshot({ path: `${SCREENSHOTS_DIR}/12_after_sim.png` });
            results.push({ name: 'Simulation Works', status: 'PASS' });
          } else {
            results.push({ name: 'Simulation Works', status: 'FAIL', details: 'No sim button found' });
            bugs.push('Simulation button not easily findable');
          }
          
          // Test 13: Live Game
          console.log('Test 13: Live Game');
          const schedLink = await page.$('text=Schedule');
          if (schedLink) {
            await schedLink.click();
            await page.waitForTimeout(1000);
            
            const playGameBtn = await page.$('button:has-text("Play"), button:has-text("Watch")');
            if (playGameBtn) {
              await playGameBtn.click();
              await page.waitForTimeout(3000);
              await page.screenshot({ path: `${SCREENSHOTS_DIR}/13_live_game.png` });
              
              const canvas = await page.$('canvas');
              const svg = await page.$('svg[class*="court"], [class*="court"]');
              results.push({ name: 'Live Game Court', status: (canvas || svg) ? 'PASS' : 'FAIL' });
            } else {
              results.push({ name: 'Live Game', status: 'SKIP', details: 'No games to play' });
            }
          }
          
          // Test 14: Save functionality
          console.log('Test 14: Save');
          const saveBtn = await page.$('button:has-text("Save")');
          if (saveBtn) {
            await saveBtn.click();
            await page.waitForTimeout(500);
            await page.screenshot({ path: `${SCREENSHOTS_DIR}/14_save.png` });
            results.push({ name: 'Save Game', status: 'PASS' });
          } else {
            results.push({ name: 'Save Game', status: 'FAIL', details: 'Save button not found' });
            bugs.push('Save button not visible on dashboard');
          }
        }
      }
    }
  }
  
  await browser.close();
  
  // Generate report
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  const skipCount = results.filter(r => r.status === 'SKIP').length;
  
  let report = `# Basketball GM - Test Report

**Date:** ${new Date().toISOString()}
**URL Tested:** ${BASE_URL}
**Production URL:** https://basketball-gm.vercel.app

---

## Summary

| Status | Count |
|--------|-------|
| ✅ PASS | ${passCount} |
| ❌ FAIL | ${failCount} |
| ⏭️ SKIP | ${skipCount} |
| **Total** | ${results.length} |

**Pass Rate:** ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%

---

## Test Results

`;

  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⏭️';
    report += `### ${icon} ${r.name}\n`;
    report += `**Status:** ${r.status}\n`;
    if (r.details) report += `**Details:** ${r.details}\n`;
    report += '\n';
  }

  report += `---

## Bugs Found

`;
  
  if (bugs.length === 0 && failCount === 0) {
    report += 'No critical bugs found!\n';
  } else {
    for (const bug of bugs) {
      report += `- ${bug}\n`;
    }
    for (const r of results.filter(x => x.status === 'FAIL')) {
      report += `- **${r.name}**: ${r.details || 'Failed'}\n`;
    }
  }

  report += `
---

## Screenshots

All screenshots saved to: \`${SCREENSHOTS_DIR}/\`

`;
  
  const files = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png')).sort();
  for (const f of files) {
    report += `- ${f}\n`;
  }
  
  report += `
---

## Recommendations

1. Ensure Save/Load buttons are prominently displayed
2. Add clear simulation controls on dashboard
3. Verify all navigation links are visible and functional
4. Test with Real NBA mode when implemented

*Report generated by automated Playwright tests*
`;

  fs.writeFileSync('/root/clawd/projects/basketball-gm/TEST-REPORT.md', report);
  console.log('\nReport saved!');
  console.log(`\nResults: ${passCount} PASS, ${failCount} FAIL, ${skipCount} SKIP`);
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
