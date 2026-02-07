// ============================================
// Expansion Team System
// ============================================

import { Team, Player, LeagueState, DraftPick } from '../types';
import { generateRoster, generatePlayer } from '../data/players';
import { generateCoachingStaff } from './CoachingSystem';
import { createDefaultPhilosophy, createDefaultPlaybook, createDefaultRotation, createDefaultIdentity } from './TeamStrategy';
import { CAP_VALUES } from './ContractSystem';

// ==================== TYPES ====================

export interface ExpansionCity {
  name: string;
  state: string;
  market: 'small' | 'medium' | 'large' | 'major';
  population: number;
  region: 'Northeast' | 'Southeast' | 'Midwest' | 'Southwest' | 'West';
  hasNBAHistory: boolean;
  previousTeam?: string;
  arenaOptions: string[];
}

export interface ExpansionTeamConfig {
  city: ExpansionCity;
  teamName: string;
  abbreviation: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  arena: string;
  mascot?: string;
  slogan?: string;
  ticketPriceMultiplier: number; // 0.8 - 1.5
  marketingBudget: number;
}

export interface ExpansionDraftState {
  phase: 'protection' | 'selection' | 'complete';
  protectedPlayers: Map<string, string[]>; // teamId -> playerIds
  availablePlayers: ExpansionDraftPlayer[];
  selectedPlayers: string[];
  currentPick: number;
  maxPicks: number;
}

export interface ExpansionDraftPlayer {
  player: Player;
  originalTeamId: string;
  originalTeamName: string;
  protectionStatus: 'unprotected' | 'protected';
  value: number;
}

export interface ExpansionFinances {
  expansionFee: number;
  initialBudget: number;
  yearOneRevenue: number;
  fanbaseSize: number; // 0-100
  fanbaseLoyalty: number; // 0-100
  localTVDeal: number;
  sponsorshipDeals: number;
  merchandiseSales: number;
  ticketRevenue: number;
}

export interface ExpansionMilestone {
  year: number;
  type: 'first-win' | 'first-playoff' | 'first-series-win' | 'first-conference-finals' | 'first-finals' | 'first-championship' |
        'sellout-streak' | 'all-star-selection' | 'draft-pick' | 'major-signing' | 'retired-number';
  description: string;
  playerId?: string;
}

// ==================== EXPANSION CITIES ====================

export const EXPANSION_CITIES: ExpansionCity[] = [
  {
    name: 'Seattle',
    state: 'WA',
    market: 'large',
    population: 3500000,
    region: 'West',
    hasNBAHistory: true,
    previousTeam: 'SuperSonics',
    arenaOptions: ['Climate Pledge Arena', 'KeyArena', 'Seattle Center Coliseum']
  },
  {
    name: 'Las Vegas',
    state: 'NV',
    market: 'large',
    population: 2800000,
    region: 'West',
    hasNBAHistory: false,
    arenaOptions: ['T-Mobile Arena', 'MGM Grand Garden Arena', 'Allegiant Stadium']
  },
  {
    name: 'Vancouver',
    state: 'BC',
    market: 'medium',
    population: 2500000,
    region: 'West',
    hasNBAHistory: true,
    previousTeam: 'Grizzlies',
    arenaOptions: ['Rogers Arena', 'BC Place', 'Pacific Coliseum']
  },
  {
    name: 'Louisville',
    state: 'KY',
    market: 'medium',
    population: 1300000,
    region: 'Midwest',
    hasNBAHistory: false,
    arenaOptions: ['KFC Yum! Center', 'Freedom Hall', 'Louisville Arena']
  },
  {
    name: 'Kansas City',
    state: 'MO',
    market: 'medium',
    population: 2100000,
    region: 'Midwest',
    hasNBAHistory: true,
    previousTeam: 'Kings',
    arenaOptions: ['T-Mobile Center', 'Sprint Center', 'Kemper Arena']
  },
  {
    name: 'Pittsburgh',
    state: 'PA',
    market: 'medium',
    population: 2300000,
    region: 'Northeast',
    hasNBAHistory: true,
    previousTeam: 'Condors',
    arenaOptions: ['PPG Paints Arena', 'Civic Arena', 'Pittsburgh Arena']
  },
  {
    name: 'Montreal',
    state: 'QC',
    market: 'large',
    population: 4000000,
    region: 'Northeast',
    hasNBAHistory: false,
    arenaOptions: ['Bell Centre', 'Olympic Stadium', 'Montreal Forum']
  },
  {
    name: 'Mexico City',
    state: 'MX',
    market: 'major',
    population: 21000000,
    region: 'Southwest',
    hasNBAHistory: false,
    arenaOptions: ['Arena Ciudad de México', 'Palacio de los Deportes', 'Arena CDMX']
  },
  {
    name: 'San Diego',
    state: 'CA',
    market: 'large',
    population: 3300000,
    region: 'West',
    hasNBAHistory: true,
    previousTeam: 'Clippers',
    arenaOptions: ['Pechanga Arena', 'SDSU Viejas Arena', 'San Diego Sports Arena']
  },
  {
    name: 'Austin',
    state: 'TX',
    market: 'medium',
    population: 2300000,
    region: 'Southwest',
    hasNBAHistory: false,
    arenaOptions: ['Moody Center', 'Frank Erwin Center', 'Austin Arena']
  },
  {
    name: 'Nashville',
    state: 'TN',
    market: 'medium',
    population: 1900000,
    region: 'Southeast',
    hasNBAHistory: false,
    arenaOptions: ['Bridgestone Arena', 'Nashville Arena', 'Music City Center']
  },
  {
    name: 'Baltimore',
    state: 'MD',
    market: 'large',
    population: 2800000,
    region: 'Northeast',
    hasNBAHistory: true,
    previousTeam: 'Bullets',
    arenaOptions: ['CFG Bank Arena', 'Baltimore Arena', 'Royal Farms Arena']
  },
  {
    name: 'Tampa',
    state: 'FL',
    market: 'large',
    population: 3100000,
    region: 'Southeast',
    hasNBAHistory: false,
    arenaOptions: ['Amalie Arena', 'Tampa Bay Arena', 'Raymond James Coliseum']
  },
  {
    name: 'St. Louis',
    state: 'MO',
    market: 'medium',
    population: 2800000,
    region: 'Midwest',
    hasNBAHistory: true,
    previousTeam: 'Hawks',
    arenaOptions: ['Enterprise Center', 'St. Louis Arena', 'Scottrade Center']
  },
  {
    name: 'Virginia Beach',
    state: 'VA',
    market: 'medium',
    population: 1800000,
    region: 'Southeast',
    hasNBAHistory: false,
    arenaOptions: ['Virginia Beach Arena', 'Hampton Coliseum', 'Norfolk Scope']
  }
];

// ==================== TEAM NAME SUGGESTIONS ====================

export const TEAM_NAME_SUGGESTIONS: Record<string, string[]> = {
  'Seattle': ['SuperSonics', 'Storm', 'Reign', 'Emeralds', 'Sasquatch', 'Totems', 'Steelheads'],
  'Las Vegas': ['Aces', 'Royals', 'Knights', 'Vipers', 'Outlaws', 'High Rollers', 'Neons'],
  'Vancouver': ['Grizzlies', 'Ravens', 'Cascades', 'Orcas', 'Mountaineers', 'Voyageurs'],
  'Louisville': ['Colonels', 'Thoroughbreds', 'Derby', 'Cardinals', 'Sluggers', 'Barons'],
  'Kansas City': ['Kings', 'Monarchs', 'Pioneers', 'Scouts', 'Fountains', 'BBQ'],
  'Pittsburgh': ['Ironmen', 'Steelers', 'Rivers', 'Condors', 'Bridges', 'Forge'],
  'Montreal': ['Royals', 'Expos', 'Nordiques', 'Habitants', 'Voyageurs', 'Blizzard'],
  'Mexico City': ['Aztecs', 'Diablos', 'Capitanes', 'Guerreros', 'Jaguars', 'Águilas'],
  'San Diego': ['Clippers', 'Conquistadors', 'Waves', 'Sails', 'Surf', 'Padres'],
  'Austin': ['Armadillos', 'Outlaws', 'Vipers', 'Lone Stars', 'Bats', 'Circuit'],
  'Nashville': ['Sounds', 'Stars', 'Volunteers', 'Rhythm', 'Titans', 'Strummers'],
  'Baltimore': ['Bullets', 'Ravens', 'Orioles', 'Harbor', 'Crabs', 'Charm'],
  'Tampa': ['Bay', 'Lightning', 'Rays', 'Tarpons', 'Bandits', 'Thunder'],
  'St. Louis': ['Spirits', 'Hawks', 'Arches', 'Blues', 'Pioneers', 'Gateway'],
  'Virginia Beach': ['Neptune', 'Admirals', 'Breakers', 'Cavaliers', 'Tides', 'Sailors']
};

// ==================== COLOR PRESETS ====================

export const COLOR_PRESETS: { name: string; primary: string; secondary: string; accent: string }[] = [
  { name: 'Sonic Green', primary: '#00653A', secondary: '#FFC425', accent: '#FFFFFF' },
  { name: 'Vegas Gold', primary: '#B4975A', secondary: '#333F42', accent: '#000000' },
  { name: 'Pacific Blue', primary: '#0077C0', secondary: '#00A9CE', accent: '#FFFFFF' },
  { name: 'Royal Purple', primary: '#5D2E8C', secondary: '#FFB81C', accent: '#FFFFFF' },
  { name: 'Midnight Black', primary: '#000000', secondary: '#C41E3A', accent: '#FFFFFF' },
  { name: 'Desert Orange', primary: '#E35205', secondary: '#002D62', accent: '#FFFFFF' },
  { name: 'Forest Green', primary: '#154734', secondary: '#B3A369', accent: '#FFFFFF' },
  { name: 'Ocean Teal', primary: '#00778B', secondary: '#FF6720', accent: '#FFFFFF' },
  { name: 'Cardinal Red', primary: '#C41E3A', secondary: '#000000', accent: '#FFFFFF' },
  { name: 'Electric Blue', primary: '#0066B3', secondary: '#00AEEF', accent: '#FFFFFF' },
  { name: 'Sunset Pink', primary: '#E31C79', secondary: '#00A1DE', accent: '#FFFFFF' },
  { name: 'Steel Gray', primary: '#6D6E71', secondary: '#FFB612', accent: '#000000' }
];

// ==================== FUNCTIONS ====================

export function calculateExpansionFee(city: ExpansionCity): number {
  const baseFee = 2500000000; // $2.5 billion base
  
  const marketMultipliers = {
    'small': 0.7,
    'medium': 0.9,
    'large': 1.1,
    'major': 1.4
  };
  
  let fee = baseFee * marketMultipliers[city.market];
  
  // History bonus (returning market)
  if (city.hasNBAHistory) {
    fee *= 1.1;
  }
  
  return Math.round(fee);
}

export function calculateInitialBudget(city: ExpansionCity, expansionFee: number): ExpansionFinances {
  const marketRevenue = {
    'small': 80000000,
    'medium': 120000000,
    'large': 180000000,
    'major': 250000000
  };
  
  const baseRevenue = marketRevenue[city.market];
  
  return {
    expansionFee,
    initialBudget: 200000000, // Starting budget
    yearOneRevenue: baseRevenue * 0.7, // Lower first year
    fanbaseSize: city.hasNBAHistory ? 40 : 20, // Start with some fans if returning
    fanbaseLoyalty: city.hasNBAHistory ? 50 : 30,
    localTVDeal: baseRevenue * 0.3,
    sponsorshipDeals: baseRevenue * 0.2,
    merchandiseSales: baseRevenue * 0.15,
    ticketRevenue: baseRevenue * 0.35
  };
}

export function createExpansionTeam(
  config: ExpansionTeamConfig,
  conference: 'Eastern' | 'Western',
  division: string,
  year: number
): Team {
  const finances = calculateInitialBudget(config.city, calculateExpansionFee(config.city));
  const coachingStaff = generateCoachingStaff();
  
  const team: Team = {
    id: config.abbreviation,
    name: config.teamName,
    city: config.city.name,
    abbreviation: config.abbreviation,
    conference,
    division,
    colors: config.colors,
    arena: config.arena,
    coach: coachingStaff.headCoach,
    roster: [],
    salaryCap: CAP_VALUES.salaryCap,
    taxLine: CAP_VALUES.luxuryTax,
    budget: finances.initialBudget,
    payroll: 0,
    ownerWealth: config.city.market === 'major' ? 'luxury' : (config.city.market === 'large' ? 'willing' : 'moderate'),
    exceptions: [
      { type: 'mid-level', amount: CAP_VALUES.midLevelException, remaining: CAP_VALUES.midLevelException, expiresYear: year + 1 },
      { type: 'bi-annual', amount: CAP_VALUES.biAnnualException, remaining: CAP_VALUES.biAnnualException, expiresYear: year + 1 }
    ],
    draftPicks: [],
    wins: 0,
    losses: 0,
    streak: 0,
    lastTenGames: [],
    championships: [],
    retiredNumbers: [],
    strategy: {
      philosophy: createDefaultPhilosophy(),
      playbook: createDefaultPlaybook(),
      identity: {
        ...createDefaultIdentity(),
        establishedYears: 0,
        knownFor: ['Expansion Team']
      },
      coachingStaff
    }
  };
  
  // Generate draft picks for next 7 years
  for (let y = 0; y < 7; y++) {
    team.draftPicks.push({
      year: year + 1 + y,
      round: 1,
      originalTeamId: config.abbreviation,
      currentTeamId: config.abbreviation,
      isSwap: false
    });
    team.draftPicks.push({
      year: year + 1 + y,
      round: 2,
      originalTeamId: config.abbreviation,
      currentTeamId: config.abbreviation,
      isSwap: false
    });
  }
  
  return team;
}

export function initializeExpansionDraft(
  existingTeams: Team[],
  players: Record<string, Player>,
  protectionLimit: number = 8
): ExpansionDraftState {
  const protectedPlayers = new Map<string, string[]>();
  
  // Each team protects their best players (AI decision)
  for (const team of existingTeams) {
    const teamPlayers = team.roster
      .map(id => players[id])
      .filter(Boolean)
      .sort((a, b) => {
        // Sort by value: overall + age factor + contract value
        const aValue = a.stats.overall + (a.age < 28 ? 10 : 0) - (a.contract.salary > 30000000 ? 5 : 0);
        const bValue = b.stats.overall + (b.age < 28 ? 10 : 0) - (b.contract.salary > 30000000 ? 5 : 0);
        return bValue - aValue;
      });
    
    // Protect top players up to limit
    const protected_ = teamPlayers.slice(0, protectionLimit).map(p => p.id);
    protectedPlayers.set(team.id, protected_);
  }
  
  // Build available players list
  const availablePlayers: ExpansionDraftPlayer[] = [];
  
  for (const team of existingTeams) {
    const protectedIds = protectedPlayers.get(team.id) || [];
    
    for (const playerId of team.roster) {
      const player = players[playerId];
      if (!player) continue;
      
      const isProtected = protectedIds.includes(playerId);
      
      availablePlayers.push({
        player,
        originalTeamId: team.id,
        originalTeamName: `${team.city} ${team.name}`,
        protectionStatus: isProtected ? 'protected' : 'unprotected',
        value: calculateExpansionValue(player)
      });
    }
  }
  
  // Sort unprotected players by value
  availablePlayers.sort((a, b) => {
    if (a.protectionStatus !== b.protectionStatus) {
      return a.protectionStatus === 'unprotected' ? -1 : 1;
    }
    return b.value - a.value;
  });
  
  return {
    phase: 'selection',
    protectedPlayers,
    availablePlayers,
    selectedPlayers: [],
    currentPick: 1,
    maxPicks: Math.min(existingTeams.length, 15) // One from each team, max 15
  };
}

function calculateExpansionValue(player: Player): number {
  let value = player.stats.overall;
  
  // Age adjustment
  if (player.age < 25) value += 15;
  else if (player.age < 28) value += 10;
  else if (player.age > 32) value -= 10;
  else if (player.age > 35) value -= 20;
  
  // Contract adjustment
  const salaryPercent = player.contract.salary / CAP_VALUES.salaryCap;
  if (salaryPercent > 0.25) value -= 15;
  else if (salaryPercent > 0.15) value -= 5;
  else if (salaryPercent < 0.05) value += 5;
  
  // Potential for young players
  if (player.age < 25) {
    value += (player.potential - player.stats.overall) * 0.5;
  }
  
  // Contract years
  if (player.contract.years === 1) value += 5; // Expiring
  else if (player.contract.years > 3) value -= 5;
  
  return Math.round(value);
}

export function selectExpansionPlayer(
  state: ExpansionDraftState,
  playerId: string,
  expansionTeam: Team,
  players: Record<string, Player>,
  teams: Record<string, Team>
): ExpansionDraftState {
  const playerEntry = state.availablePlayers.find(p => p.player.id === playerId);
  if (!playerEntry || playerEntry.protectionStatus === 'protected') {
    return state;
  }
  
  // Already selected from this team?
  const selectedFromTeam = state.selectedPlayers.some(id => {
    const entry = state.availablePlayers.find(p => p.player.id === id);
    return entry?.originalTeamId === playerEntry.originalTeamId;
  });
  
  if (selectedFromTeam) {
    return state; // Can only take one player per team
  }
  
  // Move player to expansion team
  const player = players[playerId];
  const originalTeam = teams[playerEntry.originalTeamId];
  
  if (player && originalTeam) {
    // Remove from original team
    const idx = originalTeam.roster.indexOf(playerId);
    if (idx > -1) {
      originalTeam.roster.splice(idx, 1);
      originalTeam.payroll -= player.contract.salary;
    }
    
    // Add to expansion team
    player.teamId = expansionTeam.id;
    expansionTeam.roster.push(playerId);
    expansionTeam.payroll += player.contract.salary;
  }
  
  const newState: ExpansionDraftState = {
    ...state,
    selectedPlayers: [...state.selectedPlayers, playerId],
    currentPick: state.currentPick + 1,
    availablePlayers: state.availablePlayers.map(p => 
      p.player.id === playerId ? { ...p, protectionStatus: 'protected' as const } : p
    )
  };
  
  if (newState.currentPick > newState.maxPicks) {
    newState.phase = 'complete';
  }
  
  return newState;
}

export function autoSelectExpansionPlayer(
  state: ExpansionDraftState,
  expansionTeam: Team,
  players: Record<string, Player>,
  teams: Record<string, Team>
): ExpansionDraftState {
  // Find teams we haven't selected from yet
  const selectedTeams = new Set(
    state.selectedPlayers.map(id => {
      const entry = state.availablePlayers.find(p => p.player.id === id);
      return entry?.originalTeamId;
    }).filter(Boolean)
  );
  
  // Get best available unprotected player from a team we haven't picked from
  const bestPlayer = state.availablePlayers
    .filter(p => 
      p.protectionStatus === 'unprotected' && 
      !selectedTeams.has(p.originalTeamId) &&
      !state.selectedPlayers.includes(p.player.id)
    )
    .sort((a, b) => b.value - a.value)[0];
  
  if (bestPlayer) {
    return selectExpansionPlayer(state, bestPlayer.player.id, expansionTeam, players, teams);
  }
  
  return { ...state, phase: 'complete' };
}

export function fillExpansionRoster(
  team: Team,
  players: Record<string, Player>,
  freeAgents: string[],
  state: LeagueState
): void {
  const minRoster = 12;
  const targetRoster = 15;
  
  // Sort free agents by value
  const availableFAs = freeAgents
    .map(id => players[id])
    .filter(Boolean)
    .sort((a, b) => b.stats.overall - a.stats.overall);
  
  // Sign players until we have enough
  while (team.roster.length < minRoster && availableFAs.length > 0) {
    const player = availableFAs.shift()!;
    
    // Check salary cap
    if (team.payroll + player.contract.salary <= team.salaryCap * 1.2) {
      player.teamId = team.id;
      team.roster.push(player.id);
      team.payroll += player.contract.salary;
      
      // Remove from free agents
      const faIdx = state.freeAgents.indexOf(player.id);
      if (faIdx > -1) state.freeAgents.splice(faIdx, 1);
    }
  }
  
  // Generate additional players if needed
  while (team.roster.length < minRoster) {
    const newPlayer = generatePlayer({
      tier: 'bench',
      teamId: team.id
    });
    
    players[newPlayer.id] = newPlayer;
    team.roster.push(newPlayer.id);
    team.payroll += newPlayer.contract.salary;
  }
  
  // Update rotation
  if (team.strategy) {
    const rosterPlayers = team.roster.map(id => players[id]).filter(Boolean);
    team.strategy.rotation = createDefaultRotation(rosterPlayers);
  }
}

export function updateExpansionFanbase(
  team: Team,
  seasonResult: { wins: number; playoffAppearance: boolean; championshipWin: boolean },
  currentFanbase: ExpansionFinances
): ExpansionFinances {
  let fanbaseGrowth = 0;
  let loyaltyGrowth = 0;
  
  // Wins affect fanbase
  const winPct = seasonResult.wins / 82;
  if (winPct >= 0.6) {
    fanbaseGrowth += 8;
    loyaltyGrowth += 5;
  } else if (winPct >= 0.5) {
    fanbaseGrowth += 5;
    loyaltyGrowth += 3;
  } else if (winPct >= 0.4) {
    fanbaseGrowth += 2;
    loyaltyGrowth += 1;
  } else {
    fanbaseGrowth += 1; // Minimal growth even when losing
    loyaltyGrowth -= 2;
  }
  
  // Playoff bonus
  if (seasonResult.playoffAppearance) {
    fanbaseGrowth += 5;
    loyaltyGrowth += 5;
  }
  
  // Championship massive boost
  if (seasonResult.championshipWin) {
    fanbaseGrowth += 20;
    loyaltyGrowth += 15;
  }
  
  // Natural growth each year (brand awareness)
  fanbaseGrowth += 3;
  
  const newFanbase = Math.min(100, currentFanbase.fanbaseSize + fanbaseGrowth);
  const newLoyalty = Math.max(0, Math.min(100, currentFanbase.fanbaseLoyalty + loyaltyGrowth));
  
  // Revenue scales with fanbase
  const fanbaseMultiplier = 0.5 + (newFanbase / 100) * 0.5;
  
  return {
    ...currentFanbase,
    fanbaseSize: newFanbase,
    fanbaseLoyalty: newLoyalty,
    ticketRevenue: currentFanbase.ticketRevenue * fanbaseMultiplier * 1.03, // 3% annual increase
    merchandiseSales: currentFanbase.merchandiseSales * fanbaseMultiplier * 1.05,
    sponsorshipDeals: currentFanbase.sponsorshipDeals * (0.9 + newFanbase / 100) * 1.02,
    yearOneRevenue: 0 // No longer year one
  };
}

export function addExpansionMilestone(
  milestones: ExpansionMilestone[],
  type: ExpansionMilestone['type'],
  year: number,
  description: string,
  playerId?: string
): ExpansionMilestone[] {
  // Check if milestone already achieved
  if (milestones.some(m => m.type === type)) {
    return milestones;
  }
  
  return [
    ...milestones,
    { year, type, description, playerId }
  ];
}

export function determineExpansionDivision(
  city: ExpansionCity,
  existingTeams: Team[]
): { conference: 'Eastern' | 'Western'; division: string } {
  // Determine conference based on region
  const eastRegions = ['Northeast', 'Southeast'];
  const isEast = eastRegions.includes(city.region);
  const conference: 'Eastern' | 'Western' = isEast ? 'Eastern' : 'Western';
  
  // Find division with fewest teams
  const divisions = conference === 'Eastern' 
    ? ['Atlantic', 'Central', 'Southeast']
    : ['Northwest', 'Pacific', 'Southwest'];
  
  const divisionCounts = divisions.map(div => ({
    division: div,
    count: existingTeams.filter(t => t.conference === conference && t.division === div).length
  }));
  
  divisionCounts.sort((a, b) => a.count - b.count);
  
  return {
    conference,
    division: divisionCounts[0].division
  };
}

export function validateExpansionConfig(config: Partial<ExpansionTeamConfig>): string[] {
  const errors: string[] = [];
  
  if (!config.city) {
    errors.push('City is required');
  }
  
  if (!config.teamName || config.teamName.length < 3) {
    errors.push('Team name must be at least 3 characters');
  }
  
  if (!config.abbreviation || config.abbreviation.length !== 3) {
    errors.push('Abbreviation must be exactly 3 characters');
  }
  
  if (!config.colors?.primary || !config.colors?.secondary) {
    errors.push('Primary and secondary colors are required');
  }
  
  if (!config.arena || config.arena.length < 3) {
    errors.push('Arena name must be at least 3 characters');
  }
  
  if (config.ticketPriceMultiplier && (config.ticketPriceMultiplier < 0.5 || config.ticketPriceMultiplier > 2)) {
    errors.push('Ticket price multiplier must be between 0.5 and 2');
  }
  
  return errors;
}

export function generateExpansionTeamId(teamName: string, city: string): string {
  // Generate 3-letter abbreviation
  const cityPart = city.substring(0, 2).toUpperCase();
  const namePart = teamName.substring(0, 1).toUpperCase();
  return cityPart + namePart;
}
