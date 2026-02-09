// ============================================
// Real NBA Data Loader
// Loads real NBA players and teams from JSON data files
// ============================================

import { Player, Team, Contract, PlayerStats, Coach } from '../types';

// Import JSON data
import realTeamsData from '../../data/real/teams.json';
import realPlayersData from '../../data/real/players.json';

export interface RealTeamData {
  id: string;
  abbreviation: string;
  city: string;
  name: string;
  conference: 'Eastern' | 'Western';
  division: string;
  arena: string;
  colors: { primary: string; secondary: string };
}

export interface RealPlayerData {
  id: string;
  nbaId: string;
  firstName: string;
  lastName: string;
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C' | string;
  height: number;
  weight: number;
  age: number;
  birthYear: number;
  yearsExperience: number;
  college?: string;
  country?: string;
  jersey: string;
  teamId: string;
  draftYear?: number | string;
  draftRound?: number | string;
  draftPick?: number | string;
  stats: {
    speed: number;
    strength: number;
    jumping: number;
    endurance: number;
    insideScoring: number;
    midRange: number;
    threePoint: number;
    freeThrow: number;
    ballHandling: number;
    passing: number;
    perimeterDefense: number;
    interiorDefense: number;
    stealing: number;
    blocking: number;
    offensiveRebounding: number;
    defensiveRebounding: number;
    basketballIQ: number;
    workEthic: number;
    durability: number;
    clutch: number;
    overall: number;
  };
  potential: number;
  contract: {
    salary: number;
    years: number;
    type: string;
    noTradeClause: boolean;
  };
  currentSeasonStats?: {
    gamesPlayed: number;
    minutesPerGame: number;
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    fgPct: number;
    fg3Pct: number;
    ftPct: number;
  };
}

/**
 * Generate a coach for a team
 */
function generateCoachForTeam(teamId: string): Coach {
  const firstNames = ['Steve', 'Erik', 'Gregg', 'Doc', 'Nick', 'Mike', 'Tom', 'Jason', 'JB', 'Quin',
    'Taylor', 'Joe', 'Tyronn', 'Ime', 'Darvin', 'Mark', 'Michael', 'Willie', 'Rick', 'Monty'];
  const lastNames = ['Kerr', 'Spoelstra', 'Popovich', 'Rivers', 'Nurse', 'Malone', 'Thibodeau', 'Kidd',
    'Bickerstaff', 'Snyder', 'Jenkins', 'Mazzulla', 'Ham', 'Daigneault', 'Green', 'Brown'];
  
  const styles: Coach['style'][] = ['offensive', 'defensive', 'balanced'];
  const offSchemes: Coach['offensiveScheme'][] = ['pace-and-space', 'motion', 'isolation', 'post-up', 'balanced'];
  const defSchemes: Coach['defensiveScheme'][] = ['switch-everything', 'drop', 'aggressive', 'zone', 'balanced'];
  
  const seed = teamId.charCodeAt(0) + teamId.charCodeAt(1) + teamId.charCodeAt(2);
  
  return {
    id: `coach-${teamId}`,
    name: `${firstNames[seed % firstNames.length]} ${lastNames[(seed * 7) % lastNames.length]}`,
    age: 45 + (seed % 20),
    yearsExperience: 5 + (seed % 15),
    style: styles[seed % 3],
    playerDevelopment: 60 + (seed % 35),
    gameManagement: 60 + ((seed * 3) % 35),
    motivation: 60 + ((seed * 5) % 35),
    offensiveScheme: offSchemes[seed % 5],
    defensiveScheme: defSchemes[(seed * 2) % 5]
  };
}

/**
 * Get secondary position based on primary
 */
function getSecondaryPosition(primary: string): 'PG' | 'SG' | 'SF' | 'PF' | 'C' | undefined {
  const positionMap: Record<string, ('PG' | 'SG' | 'SF' | 'PF' | 'C')[]> = {
    'PG': ['SG'],
    'SG': ['PG', 'SF'],
    'SF': ['SG', 'PF'],
    'PF': ['SF', 'C'],
    'C': ['PF'],
  };
  const options = positionMap[primary];
  if (options && Math.random() > 0.3) {
    return options[Math.floor(Math.random() * options.length)];
  }
  return undefined;
}

/**
 * Convert real player data to game Player format
 */
function convertToGamePlayer(data: RealPlayerData): Player {
  const stats: PlayerStats = {
    speed: data.stats.speed,
    strength: data.stats.strength,
    jumping: data.stats.jumping,
    endurance: data.stats.endurance,
    insideScoring: data.stats.insideScoring,
    midRange: data.stats.midRange,
    threePoint: data.stats.threePoint,
    freeThrow: data.stats.freeThrow,
    ballHandling: data.stats.ballHandling,
    passing: data.stats.passing,
    perimeterDefense: data.stats.perimeterDefense,
    interiorDefense: data.stats.interiorDefense,
    stealing: data.stats.stealing,
    blocking: data.stats.blocking,
    offensiveRebounding: data.stats.offensiveRebounding,
    defensiveRebounding: data.stats.defensiveRebounding,
    basketballIQ: data.stats.basketballIQ,
    workEthic: data.stats.workEthic,
    durability: data.stats.durability,
    clutch: data.stats.clutch,
    overall: data.stats.overall,
  };

  const contract: Contract = {
    salary: data.contract.salary,
    years: data.contract.years,
    type: data.contract.type as Contract['type'],
    noTradeClause: data.contract.noTradeClause,
    signedYear: new Date().getFullYear() - (data.contract.years > 1 ? 1 : 0),
  };

  // Parse draft info - could be string like "Undrafted" or "2021"
  const draftYear = typeof data.draftYear === 'number' ? data.draftYear : 
                    (typeof data.draftYear === 'string' && !isNaN(parseInt(data.draftYear))) ? parseInt(data.draftYear) : undefined;
  const draftRound = typeof data.draftRound === 'number' ? (data.draftRound as 1 | 2) :
                     (typeof data.draftRound === 'string' && !isNaN(parseInt(data.draftRound))) ? (parseInt(data.draftRound) as 1 | 2) : undefined;
  const draftPick = typeof data.draftPick === 'number' ? data.draftPick :
                    (typeof data.draftPick === 'string' && !isNaN(parseInt(data.draftPick))) ? parseInt(data.draftPick) : undefined;

  // Normalize position
  const validPositions: ('PG' | 'SG' | 'SF' | 'PF' | 'C')[] = ['PG', 'SG', 'SF', 'PF', 'C'];
  const position = validPositions.includes(data.position as any) ? data.position as 'PG' | 'SG' | 'SF' | 'PF' | 'C' : 'SF';

  return {
    id: data.id,
    firstName: data.firstName,
    lastName: data.lastName,
    position,
    secondaryPosition: getSecondaryPosition(position),
    height: data.height,
    weight: data.weight,
    age: data.age,
    birthYear: data.birthYear,
    yearsExperience: data.yearsExperience,
    college: data.college,
    draftYear,
    draftRound,
    draftPick,
    stats,
    potential: data.potential,
    peakAge: Math.min(32, data.age + Math.floor(Math.random() * 4) + 2),
    teamId: data.teamId,
    contract,
    birdRights: data.yearsExperience >= 3,
    injury: null,
    morale: {
      happiness: 70 + Math.floor(Math.random() * 20),
      loyalty: 50 + Math.floor(Math.random() * 40),
      chemistry: 60 + Math.floor(Math.random() * 30),
      tradeDesire: Math.floor(Math.random() * 30),
      factors: {
        playingTime: 70,
        teamSuccess: 60,
        cityPreference: 50 + Math.floor(Math.random() * 40),
        coaching: 60,
        teammates: 70,
      },
    },
    seasonStats: {},
    careerStats: {
      gamesPlayed: Math.floor(data.yearsExperience * 60),
      gamesStarted: Math.floor(data.yearsExperience * 40),
      minutesPerGame: data.currentSeasonStats?.minutesPerGame || 20,
      points: (data.currentSeasonStats?.points || 10) * data.yearsExperience * 60,
      rebounds: (data.currentSeasonStats?.rebounds || 4) * data.yearsExperience * 60,
      assists: (data.currentSeasonStats?.assists || 2) * data.yearsExperience * 60,
      steals: (data.currentSeasonStats?.steals || 1) * data.yearsExperience * 60,
      blocks: (data.currentSeasonStats?.blocks || 0.5) * data.yearsExperience * 60,
      turnovers: (data.currentSeasonStats?.turnovers || 1.5) * data.yearsExperience * 60,
      fieldGoalsMade: 0,
      fieldGoalsAttempted: 0,
      threePointersMade: 0,
      threePointersAttempted: 0,
      freeThrowsMade: 0,
      freeThrowsAttempted: 0,
      personalFouls: 0,
      plusMinus: 0,
    },
    awards: [],
    allStarSelections: data.stats.overall >= 85 ? Math.floor(data.yearsExperience / 2) : 0,
  };
}

/**
 * Convert real team data to game Team format
 */
function convertToGameTeam(data: RealTeamData, playerIds: string[]): Team {
  const coach = generateCoachForTeam(data.id);
  
  return {
    id: data.id,
    name: data.name,
    city: data.city,
    abbreviation: data.abbreviation,
    conference: data.conference,
    division: data.division,
    colors: { ...data.colors, accent: '#FFFFFF' },
    arena: data.arena,
    coach,
    roster: playerIds,
    salaryCap: 140588000,
    taxLine: 170814000,
    budget: 180000000,
    payroll: 0,
    ownerWealth: 'moderate',
    exceptions: [
      { type: 'mid-level', amount: 14167000, remaining: 14167000, expiresYear: 2025 },
      { type: 'bi-annual', amount: 4697000, remaining: 4697000, expiresYear: 2025 },
    ],
    draftPicks: [
      { year: 2025, round: 1, originalTeamId: data.id, currentTeamId: data.id, isSwap: false },
      { year: 2025, round: 2, originalTeamId: data.id, currentTeamId: data.id, isSwap: false },
    ],
    wins: 0,
    losses: 0,
    streak: 0,
    lastTenGames: [],
    championships: [],
    retiredNumbers: [],
  };
}

/**
 * Load real NBA data and convert to game format
 */
export function loadRealNBAData(): {
  teams: Record<string, Team>;
  players: Record<string, Player>;
  freeAgents: string[];
} {
  const teams: Record<string, Team> = {};
  const players: Record<string, Player> = {};
  const freeAgents: string[] = [];
  
  // Type assertions for imported JSON
  const teamsData = realTeamsData as unknown as RealTeamData[];
  const playersData = realPlayersData as unknown as RealPlayerData[];
  
  // Create a map of team rosters
  const teamRosters: Record<string, string[]> = {};
  
  // Initialize team rosters
  teamsData.forEach((team) => {
    teamRosters[team.id] = [];
  });
  
  // Convert players and assign to teams
  playersData.forEach((playerData) => {
    const player = convertToGamePlayer(playerData);
    players[player.id] = player;
    
    if (playerData.teamId && teamRosters[playerData.teamId]) {
      teamRosters[playerData.teamId].push(player.id);
    } else {
      freeAgents.push(player.id);
    }
  });
  
  // Convert teams with their rosters
  teamsData.forEach((teamData) => {
    const playerIds = teamRosters[teamData.id] || [];
    const team = convertToGameTeam(teamData, playerIds);
    
    // Calculate payroll
    team.payroll = playerIds.reduce((sum, playerId) => {
      const player = players[playerId];
      return sum + (player?.contract.salary || 0);
    }, 0);
    
    teams[team.id] = team;
  });
  
  return { teams, players, freeAgents };
}

/**
 * Check if real data is available (has enough players)
 */
export function isRealDataAvailable(): boolean {
  try {
    const hasTeams = Array.isArray(realTeamsData) && realTeamsData.length >= 30;
    const hasPlayers = Array.isArray(realPlayersData) && realPlayersData.length >= 100;
    return hasTeams && hasPlayers;
  } catch {
    return false;
  }
}

export default {
  loadRealNBAData,
  isRealDataAvailable,
};
