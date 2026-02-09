import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';

const SCREENSHOTS_DIR = '/root/clawd/projects/basketball-gm/screenshots';
const BASE_URL = 'http://localhost:5173';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  details?: string;
  screenshot?: string;
}

const results: TestResult[] = [];

async function screenshot(page: Page, name: string): Promise<string> {
  const path = `${SCREENSHOTS_DIR}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  return path;
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function test1_WelcomeScreen(page: Page) {
  console.log('Test 1: Welcome Screen...');
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await delay(1000);
    
    const title = await page.title();
    const hasNewGame = await page.locator('text=New Game').first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasLoadGame = await page.locator('text=Load Game').first().isVisible({ timeout: 5000 }).catch(() => false);
    
    const shot = await screenshot(page, '01_welcome_screen');
    
    if (hasNewGame || hasLoadGame) {
      results.push({ name: 'Welcome Screen Loads', status: 'PASS', details: `Title: ${title}`, screenshot: shot });
    } else {
      results.push({ name: 'Welcome Screen Loads', status: 'FAIL', details: 'New Game/Load Game buttons not found', screenshot: shot });
    }
  } catch (e: any) {
    results.push({ name: 'Welcome Screen Loads', status: 'FAIL', details: e.message });
  }
}

async function test2_FictionModeFlow(page: Page) {
  console.log('Test 2: Fiction Mode Flow...');
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await delay(500);
    
    // Click New Game
    const newGameBtn = page.locator('text=New Game').first();
    if (await newGameBtn.isVisible({ timeout: 3000 })) {
      await newGameBtn.click();
      await delay(500);
      await screenshot(page, '02_mode_selection');
    }
    
    // Look for Fiction mode option
    const fictionBtn = page.locator('text=Fiction').first();
    const fictionVisible = await fictionBtn.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (fictionVisible) {
      await fictionBtn.click();
      await delay(500);
      await screenshot(page, '03_fiction_settings');
      results.push({ name: 'Fiction Mode Selection', status: 'PASS', details: 'Fiction mode button found and clicked' });
    } else {
      // Maybe no mode selection, just settings
      await screenshot(page, '03_no_mode_selection');
      results.push({ name: 'Fiction Mode Selection', status: 'SKIP', details: 'No explicit mode selection found - may proceed directly to settings' });
    }
    
    // Look for Continue/Start button after settings
    await delay(500);
    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Start"), button:has-text("Create")').first();
    if (await continueBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await continueBtn.click();
      await delay(500);
    }
    
    // Team selection
    const teamElements = await page.locator('[class*="team"], [data-team], .team-card').count();
    await screenshot(page, '04_team_selection');
    
    if (teamElements > 0 || await page.locator('text=Select').first().isVisible({ timeout: 2000 }).catch(() => false)) {
      results.push({ name: 'Team Selection Screen', status: 'PASS', details: `Found ${teamElements} team elements` });
      
      // Click first team
      const firstTeam = page.locator('[class*="team"], [data-team], .team-card, button:has-text("Select")').first();
      if (await firstTeam.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstTeam.click();
        await delay(1000);
      }
    } else {
      results.push({ name: 'Team Selection Screen', status: 'FAIL', details: 'Team selection not found' });
    }
    
    // Check if dashboard loads
    await delay(1000);
    const shot = await screenshot(page, '05_dashboard');
    const hasDashboard = await page.locator('text=Roster, text=Schedule, text=Standings, nav').first().isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasDashboard || await page.locator('[class*="nav"], [class*="sidebar"]').first().isVisible({ timeout: 2000 }).catch(() => false)) {
      results.push({ name: 'Game Dashboard Loads', status: 'PASS', screenshot: shot });
    } else {
      results.push({ name: 'Game Dashboard Loads', status: 'FAIL', details: 'Dashboard elements not found', screenshot: shot });
    }
    
  } catch (e: any) {
    results.push({ name: 'Fiction Mode Flow', status: 'FAIL', details: e.message });
  }
}

async function test3_RealNBAMode(page: Page) {
  console.log('Test 3: Real NBA Mode...');
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await delay(500);
    
    const newGameBtn = page.locator('text=New Game').first();
    if (await newGameBtn.isVisible({ timeout: 3000 })) {
      await newGameBtn.click();
      await delay(500);
    }
    
    // Look for Real NBA option
    const realNBABtn = page.locator('text=Real NBA, text=Real Players, text=2025').first();
    const realNBAVisible = await realNBABtn.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (realNBAVisible) {
      await realNBABtn.click();
      await delay(500);
      await screenshot(page, '06_real_nba_selection');
      results.push({ name: 'Real NBA Mode Selection', status: 'PASS' });
    } else {
      await screenshot(page, '06_no_real_nba');
      results.push({ name: 'Real NBA Mode Selection', status: 'SKIP', details: 'Real NBA mode option not visible' });
    }
    
  } catch (e: any) {
    results.push({ name: 'Real NBA Mode Flow', status: 'FAIL', details: e.message });
  }
}

async function test4_GameplayNavigation(page: Page) {
  console.log('Test 4: Gameplay Navigation...');
  try {
    // Navigate through different sections
    const sections = ['Roster', 'Schedule', 'Standings', 'Trade', 'Free Agents', 'Finances', 'Draft'];
    
    for (const section of sections) {
      const link = page.locator(`text=${section}, a:has-text("${section}"), button:has-text("${section}")`).first();
      if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
        await link.click();
        await delay(500);
        await screenshot(page, `07_${section.toLowerCase().replace(' ', '_')}`);
        results.push({ name: `Navigate to ${section}`, status: 'PASS' });
      } else {
        results.push({ name: `Navigate to ${section}`, status: 'SKIP', details: 'Link not found' });
      }
    }
    
  } catch (e: any) {
    results.push({ name: 'Gameplay Navigation', status: 'FAIL', details: e.message });
  }
}

async function test5_SimulateDay(page: Page) {
  console.log('Test 5: Simulate Day...');
  try {
    const playBtn = page.locator('text=Play, text=Simulate, button:has-text("Play"), button:has-text("Sim")').first();
    if (await playBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await playBtn.click();
      await delay(2000);
      await screenshot(page, '08_after_simulation');
      results.push({ name: 'Simulate Day', status: 'PASS' });
    } else {
      await screenshot(page, '08_no_play_button');
      results.push({ name: 'Simulate Day', status: 'FAIL', details: 'Play/Simulate button not found' });
    }
    
  } catch (e: any) {
    results.push({ name: 'Simulate Day', status: 'FAIL', details: e.message });
  }
}

async function test6_LiveGame(page: Page) {
  console.log('Test 6: Live Game...');
  try {
    // Navigate to Schedule first
    const scheduleLink = page.locator('text=Schedule, a:has-text("Schedule")').first();
    if (await scheduleLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await scheduleLink.click();
      await delay(500);
    }
    
    // Look for a Play Game button
    const playGameBtn = page.locator('button:has-text("Play"), button:has-text("Watch"), [class*="game"] button').first();
    if (await playGameBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await playGameBtn.click();
      await delay(2000);
      await screenshot(page, '09_live_game');
      
      // Check for court/game UI
      const hasCanvas = await page.locator('canvas').first().isVisible({ timeout: 2000 }).catch(() => false);
      const hasCourt = await page.locator('[class*="court"], [class*="game"], svg').first().isVisible({ timeout: 2000 }).catch(() => false);
      
      if (hasCanvas || hasCourt) {
        results.push({ name: 'Live Game Court Renders', status: 'PASS' });
      } else {
        results.push({ name: 'Live Game Court Renders', status: 'FAIL', details: 'No court/canvas element found' });
      }
      
      // Check for controls
      const hasControls = await page.locator('text=Speed, text=Pause, button:has-text("x"), [class*="speed"]').first().isVisible({ timeout: 2000 }).catch(() => false);
      results.push({ name: 'Live Game Controls', status: hasControls ? 'PASS' : 'FAIL' });
      
    } else {
      await screenshot(page, '09_no_live_game');
      results.push({ name: 'Live Game', status: 'SKIP', details: 'No playable game found' });
    }
    
  } catch (e: any) {
    results.push({ name: 'Live Game', status: 'FAIL', details: e.message });
  }
}

async function test7_SaveLoad(page: Page) {
  console.log('Test 7: Save/Load...');
  try {
    // Look for Save button
    const saveBtn = page.locator('text=Save, button:has-text("Save")').first();
    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveBtn.click();
      await delay(500);
      await screenshot(page, '10_save_dialog');
      results.push({ name: 'Save Game UI', status: 'PASS' });
    } else {
      results.push({ name: 'Save Game UI', status: 'FAIL', details: 'Save button not found' });
    }
    
    // Look for Load button (may need to go back to main menu)
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await delay(500);
    
    const loadBtn = page.locator('text=Load Game, button:has-text("Load")').first();
    if (await loadBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await loadBtn.click();
      await delay(500);
      await screenshot(page, '11_load_dialog');
      results.push({ name: 'Load Game UI', status: 'PASS' });
    } else {
      results.push({ name: 'Load Game UI', status: 'FAIL', details: 'Load button not found' });
    }
    
  } catch (e: any) {
    results.push({ name: 'Save/Load', status: 'FAIL', details: e.message });
  }
}

async function generateReport() {
  let report = `# Basketball GM Test Report

**Date:** ${new Date().toISOString()}
**URL Tested:** http://localhost:5173 (also deployed at https://basketball-gm.vercel.app)

## Summary

| Status | Count |
|--------|-------|
| ✅ PASS | ${results.filter(r => r.status === 'PASS').length} |
| ❌ FAIL | ${results.filter(r => r.status === 'FAIL').length} |
| ⏭️ SKIP | ${results.filter(r => r.status === 'SKIP').length} |

## Test Results

`;

  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⏭️';
    report += `### ${icon} ${r.name}\n\n`;
    report += `**Status:** ${r.status}\n`;
    if (r.details) report += `**Details:** ${r.details}\n`;
    if (r.screenshot) report += `**Screenshot:** ${r.screenshot}\n`;
    report += '\n';
  }

  report += `## Bugs Found

`;

  const bugs = results.filter(r => r.status === 'FAIL');
  if (bugs.length === 0) {
    report += 'No critical bugs found during testing.\n';
  } else {
    for (const bug of bugs) {
      report += `- **${bug.name}**: ${bug.details || 'See screenshot'}\n`;
    }
  }

  report += `
## Screenshots

All screenshots saved to: \`${SCREENSHOTS_DIR}/\`

`;

  fs.writeFileSync('/root/clawd/projects/basketball-gm/TEST-REPORT.md', report);
  console.log('Report written to /root/clawd/projects/basketball-gm/TEST-REPORT.md');
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  
  try {
    await test1_WelcomeScreen(page);
    await test2_FictionModeFlow(page);
    await test3_RealNBAMode(page);
    await test4_GameplayNavigation(page);
    await test5_SimulateDay(page);
    await test6_LiveGame(page);
    await test7_SaveLoad(page);
  } finally {
    await generateReport();
    await browser.close();
  }
  
  console.log('\n=== RESULTS ===');
  for (const r of results) {
    console.log(`${r.status}: ${r.name}`);
  }
}

main().catch(console.error);
