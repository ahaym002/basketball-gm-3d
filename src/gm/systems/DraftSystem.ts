// ============================================
// Draft System - NBA-style Draft with Lottery
// ============================================

import { Player, DraftProspect, DraftPick, Team, LeagueState, Contract } from '../types';
import { generateDraftClass, emptySeasonStats, calculateOverall } from '../data/players';

export interface LotteryResult {
  position: number;
  teamId: string;
  teamName: string;
  originalPosition: number;
  jumped: number;
  odds: number;
}

export interface DraftResult {
  round: number;
  pick: number;
  overallPick: number;
  teamId: string;
  teamName: string;
  prospectId: string;
  prospectName: string;
  position: string;
}

// NBA lottery odds for 2024 (14 lottery teams)
const LOTTERY_ODDS: Record<number, number> = {
  1: 14.0,
  2: 14.0,
  3: 14.0,
  4: 12.5,
  5: 10.5,
  6: 9.0,
  7: 7.5,
  8: 6.0,
  9: 4.5,
  10: 3.0,
  11: 2.0,
  12: 1.5,
  13: 1.0,
  14: 0.5
};

// Rookie scale salaries by pick (2024-25 approximate)
const ROOKIE_SCALE: Record<number, number> = {
  1: 12100000, 2: 10900000, 3: 9800000, 4: 9300000, 5: 8800000,
  6: 8300000, 7: 7900000, 8: 7500000, 9: 7100000, 10: 6800000,
  11: 6500000, 12: 6200000, 13: 5900000, 14: 5600000, 15: 5400000,
  16: 5100000, 17: 4900000, 18: 4700000, 19: 4500000, 20: 4300000,
  21: 4100000, 22: 3900000, 23: 3800000, 24: 3600000, 25: 3500000,
  26: 3400000, 27: 3300000, 28: 3200000, 29: 3100000, 30: 3000000,
  // Second round (two-way eligible)
  31: 1800000, 32: 1750000, 33: 1700000, 34: 1650000, 35: 1600000,
  36: 1550000, 37: 1500000, 38: 1450000, 39: 1400000, 40: 1350000,
  41: 1300000, 42: 1300000, 43: 1300000, 44: 1300000, 45: 1300000,
  46: 1200000, 47: 1200000, 48: 1200000, 49: 1200000, 50: 1200000,
  51: 1100000, 52: 1100000, 53: 1100000, 54: 1100000, 55: 1100000,
  56: 1100000, 57: 1100000, 58: 1100000, 59: 1100000, 60: 1100000
};

export function simulateLottery(
  teams: Team[],
  numPlayoffTeams: number = 16
): LotteryResult[] {
  // Sort teams by record (worst to best)
  const lotteryTeams = teams
    .filter((_, i) => i >= numPlayoffTeams) // Non-playoff teams (conceptually)
    .sort((a, b) => {
      const aWinPct = a.wins / (a.wins + a.losses || 1);
      const bWinPct = b.wins / (b.wins + b.losses || 1);
      return aWinPct - bWinPct;
    })
    .slice(0, 14);
  
  // If not enough lottery teams, use all non-playoff
  while (lotteryTeams.length < 14) {
    // Fill with worst playoff teams or just use what we have
    break;
  }
  
  const results: LotteryResult[] = [];
  const pickedPositions = new Set<number>();
  const teamPicked = new Set<string>();
  
  // Simulate top 4 picks via lottery
  for (let position = 1; position <= 4; position++) {
    let winner: { team: Team; originalPos: number } | null = null;
    
    // Weighted random selection
    const availableTeams = lotteryTeams
      .map((team, index) => ({ team, originalPos: index + 1, odds: LOTTERY_ODDS[index + 1] || 0.5 }))
      .filter(t => !teamPicked.has(t.team.id));
    
    const totalOdds = availableTeams.reduce((sum, t) => sum + t.odds, 0);
    let random = Math.random() * totalOdds;
    
    for (const entry of availableTeams) {
      random -= entry.odds;
      if (random <= 0) {
        winner = { team: entry.team, originalPos: entry.originalPos };
        break;
      }
    }
    
    if (!winner && availableTeams.length > 0) {
      winner = { team: availableTeams[0].team, originalPos: availableTeams[0].originalPos };
    }
    
    if (winner) {
      teamPicked.add(winner.team.id);
      results.push({
        position,
        teamId: winner.team.id,
        teamName: `${winner.team.city} ${winner.team.name}`,
        originalPosition: winner.originalPos,
        jumped: winner.originalPos - position,
        odds: LOTTERY_ODDS[winner.originalPos] || 0.5
      });
    }
  }
  
  // Remaining lottery picks (5-14) go in reverse order of record
  for (const team of lotteryTeams) {
    if (teamPicked.has(team.id)) continue;
    
    const position = results.length + 1;
    const originalPos = lotteryTeams.findIndex(t => t.id === team.id) + 1;
    
    results.push({
      position,
      teamId: team.id,
      teamName: `${team.city} ${team.name}`,
      originalPosition: originalPos,
      jumped: originalPos - position,
      odds: LOTTERY_ODDS[originalPos] || 0.5
    });
    
    teamPicked.add(team.id);
    
    if (results.length >= 14) break;
  }
  
  return results;
}

export function generateDraftOrder(
  teams: Team[],
  lotteryResults: LotteryResult[]
): string[] {
  const order: string[] = [];
  
  // Lottery picks (1-14)
  for (const result of lotteryResults) {
    order.push(result.teamId);
  }
  
  // Remaining first round (15-30) - playoff teams by record (worst first)
  const playoffTeams = teams
    .filter(t => !lotteryResults.some(r => r.teamId === t.id))
    .sort((a, b) => {
      const aWinPct = a.wins / (a.wins + a.losses || 1);
      const bWinPct = b.wins / (b.wins + b.losses || 1);
      return aWinPct - bWinPct;
    });
  
  for (const team of playoffTeams.slice(0, 16)) {
    order.push(team.id);
  }
  
  // Second round mirrors first round order
  for (const teamId of order.slice(0, 30)) {
    order.push(teamId);
  }
  
  return order;
}

export function applyPickTrades(
  draftOrder: string[],
  teams: Record<string, Team>,
  round: 1 | 2
): string[] {
  const newOrder = [...draftOrder];
  
  for (const team of Object.values(teams)) {
    for (const pick of team.draftPicks) {
      if (pick.round !== round) continue;
      if (pick.currentTeamId !== pick.originalTeamId) {
        // Find the original pick position
        const startIndex = (round - 1) * 30;
        const endIndex = round * 30;
        
        for (let i = startIndex; i < endIndex && i < newOrder.length; i++) {
          if (newOrder[i] === pick.originalTeamId) {
            newOrder[i] = pick.currentTeamId;
            break;
          }
        }
      }
    }
  }
  
  return newOrder;
}

export function draftPlayer(
  prospect: DraftProspect,
  teamId: string,
  draftYear: number,
  round: 1 | 2,
  pick: number,
  overallPick: number
): Player {
  // Reveal true ratings
  const player: Player = {
    id: prospect.id,
    firstName: prospect.firstName,
    lastName: prospect.lastName,
    position: prospect.position,
    secondaryPosition: prospect.secondaryPosition,
    height: prospect.height,
    weight: prospect.weight,
    age: prospect.age,
    birthYear: prospect.birthYear,
    yearsExperience: 0,
    college: prospect.college,
    draftYear,
    draftRound: round,
    draftPick: pick,
    
    stats: { ...prospect.stats },
    potential: prospect.truePotential,
    peakAge: prospect.peakAge,
    
    teamId,
    contract: createRookieContract(overallPick, round, draftYear),
    birdRights: false,
    
    injury: null,
    morale: prospect.morale,
    
    seasonStats: {},
    careerStats: emptySeasonStats(),
    awards: [],
    allStarSelections: 0
  };
  
  // Update stats to true values
  player.stats.overall = prospect.trueOverall;
  
  return player;
}

function createRookieContract(overallPick: number, round: 1 | 2, year: number): Contract {
  const baseSalary = ROOKIE_SCALE[overallPick] || 1100000;
  
  return {
    salary: baseSalary,
    years: round === 1 ? 4 : 2, // First round = 4 years (2 guaranteed + 2 team options)
    type: 'rookie',
    noTradeClause: false,
    teamOption: round === 1 ? 3 : undefined, // Team options in years 3 and 4 for 1st rounders
    signedYear: year
  };
}

export interface DraftState {
  year: number;
  phase: 'pre-lottery' | 'lottery' | 'pre-draft' | 'round1' | 'round2' | 'complete';
  lotteryResults: LotteryResult[];
  draftOrder: string[];
  currentPick: number;
  results: DraftResult[];
  availableProspects: DraftProspect[];
}

export function initializeDraft(
  year: number,
  teams: Record<string, Team>
): DraftState {
  const prospects = generateDraftClass(year, 60);
  
  // Sort teams by record for lottery
  const sortedTeams = Object.values(teams).sort((a, b) => {
    const aWinPct = a.wins / (a.wins + a.losses || 1);
    const bWinPct = b.wins / (b.wins + b.losses || 1);
    return aWinPct - bWinPct;
  });
  
  return {
    year,
    phase: 'pre-lottery',
    lotteryResults: [],
    draftOrder: [],
    currentPick: 0,
    results: [],
    availableProspects: prospects
  };
}

export function runLottery(
  draftState: DraftState,
  teams: Record<string, Team>
): DraftState {
  const teamArray = Object.values(teams).sort((a, b) => {
    const aWinPct = a.wins / (a.wins + a.losses || 1);
    const bWinPct = b.wins / (b.wins + b.losses || 1);
    return aWinPct - bWinPct;
  });
  
  const lotteryResults = simulateLottery(teamArray);
  const draftOrder = generateDraftOrder(teamArray, lotteryResults);
  
  // Apply traded picks
  const round1Order = applyPickTrades(draftOrder.slice(0, 30), teams, 1);
  const round2Order = applyPickTrades(draftOrder.slice(30, 60), teams, 2);
  
  return {
    ...draftState,
    phase: 'round1',
    lotteryResults,
    draftOrder: [...round1Order, ...round2Order],
    currentPick: 1
  };
}

export function makePickSelection(
  draftState: DraftState,
  prospectId: string,
  state: LeagueState
): { draftState: DraftState; player: Player } {
  const prospect = draftState.availableProspects.find(p => p.id === prospectId);
  if (!prospect) throw new Error('Prospect not found');
  
  const pickIndex = draftState.currentPick - 1;
  const teamId = draftState.draftOrder[pickIndex];
  const round: 1 | 2 = draftState.currentPick <= 30 ? 1 : 2;
  const pickInRound = round === 1 ? draftState.currentPick : draftState.currentPick - 30;
  
  const team = state.teams[teamId];
  
  const player = draftPlayer(
    prospect,
    teamId,
    draftState.year,
    round,
    pickInRound,
    draftState.currentPick
  );
  
  // Add to team roster
  team.roster.push(player.id);
  team.payroll += player.contract.salary;
  
  // Add to state
  state.players[player.id] = player;
  
  // Record result
  const result: DraftResult = {
    round,
    pick: pickInRound,
    overallPick: draftState.currentPick,
    teamId,
    teamName: `${team.city} ${team.name}`,
    prospectId: prospect.id,
    prospectName: `${prospect.firstName} ${prospect.lastName}`,
    position: prospect.position
  };
  
  // Update draft state
  const newState: DraftState = {
    ...draftState,
    currentPick: draftState.currentPick + 1,
    results: [...draftState.results, result],
    availableProspects: draftState.availableProspects.filter(p => p.id !== prospectId)
  };
  
  // Check if round/draft complete
  if (newState.currentPick === 31) {
    newState.phase = 'round2';
  } else if (newState.currentPick > 60) {
    newState.phase = 'complete';
  }
  
  return { draftState: newState, player };
}

export function simulateAIPick(
  draftState: DraftState,
  teamId: string,
  state: LeagueState
): DraftProspect {
  const team = state.teams[teamId];
  const available = draftState.availableProspects;
  
  // Get team position needs
  const positionCounts: Record<string, number> = { PG: 0, SG: 0, SF: 0, PF: 0, C: 0 };
  for (const playerId of team.roster) {
    const player = state.players[playerId];
    if (player) positionCounts[player.position]++;
  }
  
  // Score prospects based on rating and team need
  const scoredProspects = available.map(prospect => {
    let score = prospect.stats.overall * 2 + prospect.potential;
    
    // Bonus for filling position need
    if (positionCounts[prospect.position] < 2) {
      score += 10;
    } else if (positionCounts[prospect.position] > 3) {
      score -= 10;
    }
    
    // Some randomness
    score += (Math.random() - 0.5) * 10;
    
    return { prospect, score };
  });
  
  scoredProspects.sort((a, b) => b.score - a.score);
  
  // Usually pick best available, but some variance
  const pickIndex = Math.min(
    Math.floor(Math.random() * 3),
    scoredProspects.length - 1
  );
  
  return scoredProspects[pickIndex].prospect;
}

export function getProspectComparison(prospect: DraftProspect): string {
  if (prospect.comparisonPlayer) {
    return prospect.comparisonPlayer;
  }
  
  const { position, stats } = prospect;
  
  // Generate comparison based on style
  if (stats.threePoint >= 80) {
    return position === 'PG' ? 'Stephen Curry' : 'Klay Thompson';
  }
  if (stats.insideScoring >= 80 && position === 'C') {
    return 'Joel Embiid';
  }
  if (stats.passing >= 80 && position === 'PG') {
    return 'Chris Paul';
  }
  if (stats.overall >= 85) {
    return 'Generational talent';
  }
  
  return 'Solid role player';
}
