// ============================================
// Team Strategy & Philosophy System
// ============================================

import { Player, Team, LeagueState } from '../types';
import { 
  OffensiveSystem, DefensiveScheme, PaceSetting, DevelopmentPhilosophy,
  ExtendedCoach 
} from './CoachingSystem';

// ==================== TEAM PHILOSOPHY ====================

export interface TeamPhilosophy {
  // Core systems
  offensiveSystem: OffensiveSystem;
  defensiveScheme: DefensiveScheme;
  pace: PaceSetting;
  developmentFocus: DevelopmentPhilosophy;
  
  // Priorities (0-100, must sum to ~300)
  priorities: {
    threePointShooting: number;
    insidePaint: number;
    defense: number;
    fastBreak: number;
    halfCourtExecution: number;
    rebounding: number;
  };
  
  // Player usage
  starUsageRate: number;       // How much to feed the star (0-100)
  benchDepth: number;          // How many players in rotation (8-12)
  veteranMinutes: boolean;     // Prioritize veteran minutes over development
}

export interface RotationSettings {
  starters: string[];          // 5 player IDs
  rotation: string[];          // 8-12 player IDs in order
  closers: string[];           // 5 player IDs for clutch time
  
  // Minutes distribution per position
  minutesByPosition: {
    PG: { starter: number; backup: number };
    SG: { starter: number; backup: number };
    SF: { starter: number; backup: number };
    PF: { starter: number; backup: number };
    C: { starter: number; backup: number };
  };
  
  // Load management
  loadManagement: {
    enabled: boolean;
    restGamesPerMonth: number;  // 0-4
    backToBackRest: boolean;
    minutesLimit: number;       // Max minutes per game for stars
    targetPlayers: string[];    // Player IDs to manage
  };
}

export interface Playbook {
  plays: Play[];
  primaryActions: PlayAction[];
  situationalPlays: {
    lastSecondShot: Play | null;
    outOfBounds: Play | null;
    afterTimeout: Play | null;
    fastBreakFinisher: Play | null;
  };
}

export interface Play {
  id: string;
  name: string;
  type: 'iso' | 'pick-and-roll' | 'post-up' | 'motion' | 'set-play' | 'fast-break';
  primaryOption: string;        // Position that gets the ball
  secondaryOptions: string[];
  difficulty: number;           // How hard to execute (affects turnover rate)
  threePointFrequency: number;  // % of plays ending in 3pt attempt
  midRangeFrequency: number;
  rimFrequency: number;
  expectedPPP: number;          // Points per possession
}

export type PlayAction = 
  | 'high-pick-and-roll'
  | 'low-post'
  | 'wing-iso'
  | 'dribble-handoff'
  | 'off-ball-screens'
  | 'corner-action'
  | 'transition'
  | 'early-offense';

// ==================== TEAM IDENTITY ====================

export interface TeamIdentity {
  // Built over time (multiple seasons)
  establishedYears: number;
  
  // Identity traits
  offensiveIdentity: OffensiveIdentity;
  defensiveIdentity: DefensiveIdentity;
  culture: TeamCulture;
  
  // Reputation
  leaguePerception: {
    offensiveRanking: number;     // 1-30
    defensiveRanking: number;
    clutchRating: number;         // 0-100
    homeCourtAdvantage: number;   // 0-100
    intimidationFactor: number;   // 0-100
  };
  
  // Historical identity
  knownFor: string[];  // "3-point shooting", "grit-and-grind defense", etc.
}

export type OffensiveIdentity = 
  | 'three-point-barrage'    // Warriors-style
  | 'motion-maestros'        // Spurs-style
  | 'iso-heavy-stars'        // Early 2000s style
  | 'inside-out'             // Post-focused with shooters
  | 'pace-and-space'         // Modern spread offense
  | 'balanced-attack'        // No clear identity
  | 'grind-it-out';          // Slow, physical

export type DefensiveIdentity = 
  | 'lockdown-perimeter'     // Elite wing defenders
  | 'rim-protection'         // Shot blocking bigs
  | 'full-court-pressure'    // Aggressive, turnover-forcing
  | 'switch-everything'      // Positionless defense
  | 'grit-and-grind'         // Physical, low-scoring games
  | 'disciplined'            // Rarely foul, fundamental
  | 'opportunistic';         // Gambles for steals

export type TeamCulture = 
  | 'championship-or-bust'   // High expectations
  | 'player-development'     // Focus on growth
  | 'blue-collar'            // Hard work over talent
  | 'star-driven'            // Everything revolves around stars
  | 'team-first'             // Sacrifice for the group
  | 'analytics-focused'      // Numbers-driven decisions
  | 'old-school';            // Traditional approach

// ==================== PLAYER FIT ====================

export interface PlayerSystemFit {
  playerId: string;
  playerName: string;
  
  // Fit scores (0-100)
  offensiveFit: number;
  defensiveFit: number;
  cultureFit: number;
  overallFit: number;
  
  // Specific compatibility
  skillsNeeded: string[];      // What the system needs from this position
  playerStrengths: string[];   // What the player provides
  gaps: string[];              // Where player doesn't fit
  
  // Impact
  expectedBoost: number;       // +/- OVR in this system
  roleClarity: 'star' | 'starter' | 'rotation' | 'specialist' | 'developing';
}

// ==================== FUNCTIONS ====================

export function createDefaultPhilosophy(): TeamPhilosophy {
  return {
    offensiveSystem: 'balanced',
    defensiveScheme: 'man-to-man',
    pace: 'moderate',
    developmentFocus: 'balanced',
    priorities: {
      threePointShooting: 50,
      insidePaint: 50,
      defense: 50,
      fastBreak: 50,
      halfCourtExecution: 50,
      rebounding: 50
    },
    starUsageRate: 50,
    benchDepth: 9,
    veteranMinutes: false
  };
}

export function createDefaultPlaybook(): Playbook {
  const plays: Play[] = [
    {
      id: 'high-pnr',
      name: 'High Pick & Roll',
      type: 'pick-and-roll',
      primaryOption: 'PG',
      secondaryOptions: ['C', 'SF'],
      difficulty: 40,
      threePointFrequency: 35,
      midRangeFrequency: 25,
      rimFrequency: 40,
      expectedPPP: 1.05
    },
    {
      id: 'wing-iso',
      name: 'Wing Isolation',
      type: 'iso',
      primaryOption: 'SF',
      secondaryOptions: ['SG'],
      difficulty: 30,
      threePointFrequency: 20,
      midRangeFrequency: 40,
      rimFrequency: 40,
      expectedPPP: 0.95
    },
    {
      id: 'post-up',
      name: 'Low Post',
      type: 'post-up',
      primaryOption: 'C',
      secondaryOptions: ['PF'],
      difficulty: 35,
      threePointFrequency: 10,
      midRangeFrequency: 30,
      rimFrequency: 60,
      expectedPPP: 0.98
    },
    {
      id: 'motion',
      name: 'Motion Offense',
      type: 'motion',
      primaryOption: 'PG',
      secondaryOptions: ['SG', 'SF', 'PF', 'C'],
      difficulty: 60,
      threePointFrequency: 40,
      midRangeFrequency: 25,
      rimFrequency: 35,
      expectedPPP: 1.08
    },
    {
      id: 'fast-break',
      name: 'Transition',
      type: 'fast-break',
      primaryOption: 'PG',
      secondaryOptions: ['SG', 'SF'],
      difficulty: 25,
      threePointFrequency: 25,
      midRangeFrequency: 10,
      rimFrequency: 65,
      expectedPPP: 1.15
    }
  ];
  
  return {
    plays,
    primaryActions: ['high-pick-and-roll', 'transition', 'off-ball-screens'],
    situationalPlays: {
      lastSecondShot: plays[1], // Wing ISO
      outOfBounds: plays[0],    // High PnR
      afterTimeout: plays[3],   // Motion
      fastBreakFinisher: plays[4]
    }
  };
}

export function createDefaultRotation(roster: Player[]): RotationSettings {
  // Sort by overall rating
  const sorted = [...roster]
    .filter(p => !p.injury)
    .sort((a, b) => b.stats.overall - a.stats.overall);
  
  // Find best 5 starters by position
  const positions: Player['position'][] = ['PG', 'SG', 'SF', 'PF', 'C'];
  const starters: string[] = [];
  const usedIds = new Set<string>();
  
  for (const pos of positions) {
    const player = sorted.find(p => p.position === pos && !usedIds.has(p.id));
    if (player) {
      starters.push(player.id);
      usedIds.add(player.id);
    }
  }
  
  // Fill any gaps with best available
  while (starters.length < 5 && sorted.length > starters.length) {
    const player = sorted.find(p => !usedIds.has(p.id));
    if (player) {
      starters.push(player.id);
      usedIds.add(player.id);
    } else break;
  }
  
  // Rotation is starters + next best 4
  const rotation = [...starters];
  for (const player of sorted) {
    if (!usedIds.has(player.id) && rotation.length < 9) {
      rotation.push(player.id);
    }
  }
  
  return {
    starters,
    rotation,
    closers: starters, // Default: closers are starters
    minutesByPosition: {
      PG: { starter: 32, backup: 16 },
      SG: { starter: 32, backup: 16 },
      SF: { starter: 32, backup: 16 },
      PF: { starter: 30, backup: 18 },
      C: { starter: 28, backup: 20 }
    },
    loadManagement: {
      enabled: false,
      restGamesPerMonth: 1,
      backToBackRest: true,
      minutesLimit: 34,
      targetPlayers: []
    }
  };
}

export function createDefaultIdentity(): TeamIdentity {
  return {
    establishedYears: 0,
    offensiveIdentity: 'balanced-attack',
    defensiveIdentity: 'disciplined',
    culture: 'team-first',
    leaguePerception: {
      offensiveRanking: 15,
      defensiveRanking: 15,
      clutchRating: 50,
      homeCourtAdvantage: 50,
      intimidationFactor: 50
    },
    knownFor: []
  };
}

export function calculatePlayerFit(
  player: Player,
  philosophy: TeamPhilosophy,
  coach: ExtendedCoach
): PlayerSystemFit {
  const skillsNeeded: string[] = [];
  const playerStrengths: string[] = [];
  const gaps: string[] = [];
  
  let offensiveFit = 50;
  let defensiveFit = 50;
  let cultureFit = 50;
  
  // Offensive system fit
  switch (philosophy.offensiveSystem) {
    case 'pace-and-space':
      skillsNeeded.push('3-point shooting', 'ball handling', 'speed');
      if (player.stats.threePoint >= 75) {
        playerStrengths.push('3-point shooting');
        offensiveFit += 15;
      } else if (player.stats.threePoint < 60) {
        gaps.push('Limited shooting');
        offensiveFit -= 10;
      }
      if (player.stats.speed >= 70) {
        playerStrengths.push('Speed');
        offensiveFit += 5;
      }
      break;
      
    case 'pick-and-roll':
      skillsNeeded.push('ball handling', 'finishing', 'passing');
      if (player.position === 'PG' && player.stats.ballHandling >= 75) {
        playerStrengths.push('PnR ball handler');
        offensiveFit += 15;
      }
      if (player.position === 'C' && player.stats.insideScoring >= 70) {
        playerStrengths.push('Roll man');
        offensiveFit += 10;
      }
      break;
      
    case 'post-up':
      skillsNeeded.push('post moves', 'strength', 'rebounding');
      if ((player.position === 'C' || player.position === 'PF') && 
          player.stats.insideScoring >= 75) {
        playerStrengths.push('Post scorer');
        offensiveFit += 15;
      }
      if (player.stats.threePoint >= 70) {
        playerStrengths.push('Floor spacing');
        offensiveFit += 5;
      }
      break;
      
    case 'motion':
      skillsNeeded.push('basketball IQ', 'passing', 'cutting');
      if (player.stats.basketballIQ >= 70) {
        playerStrengths.push('High IQ');
        offensiveFit += 10;
      }
      if (player.stats.passing >= 70) {
        playerStrengths.push('Good passer');
        offensiveFit += 5;
      }
      break;
      
    case 'iso-heavy':
      if (player.stats.overall >= 85) {
        playerStrengths.push('Star talent');
        offensiveFit += 20;
      }
      if (player.stats.ballHandling >= 75 && player.stats.midRange >= 70) {
        playerStrengths.push('Shot creator');
        offensiveFit += 10;
      }
      break;
  }
  
  // Defensive scheme fit
  switch (philosophy.defensiveScheme) {
    case 'switch-everything':
      skillsNeeded.push('versatile defense', 'lateral quickness');
      if (player.stats.perimeterDefense >= 70 && player.stats.interiorDefense >= 60) {
        playerStrengths.push('Switchable');
        defensiveFit += 15;
      } else if (player.stats.perimeterDefense < 50 || player.stats.interiorDefense < 40) {
        gaps.push('Defensive liability in switches');
        defensiveFit -= 15;
      }
      break;
      
    case 'drop-coverage':
      if (player.position === 'C' && player.stats.blocking >= 70) {
        playerStrengths.push('Rim protector');
        defensiveFit += 15;
      }
      if (player.stats.perimeterDefense >= 75) {
        playerStrengths.push('Perimeter stopper');
        defensiveFit += 10;
      }
      break;
      
    case 'aggressive-blitz':
      skillsNeeded.push('energy', 'gambling', 'recovery speed');
      if (player.stats.stealing >= 70) {
        playerStrengths.push('Ball hawk');
        defensiveFit += 10;
      }
      if (player.stats.speed >= 75) {
        playerStrengths.push('Recovery speed');
        defensiveFit += 5;
      }
      break;
  }
  
  // Pace fit
  if (philosophy.pace === 'fastest' || philosophy.pace === 'fast') {
    if (player.stats.speed >= 70 && player.stats.endurance >= 70) {
      playerStrengths.push('Pace fit');
      offensiveFit += 5;
    } else if (player.stats.speed < 55) {
      gaps.push('Too slow for pace');
      offensiveFit -= 10;
    }
  } else if (philosophy.pace === 'slow' || philosophy.pace === 'slowest') {
    if (player.stats.basketballIQ >= 70) {
      playerStrengths.push('Half-court player');
      offensiveFit += 5;
    }
  }
  
  // Culture fit (based on morale and work ethic)
  if (player.stats.workEthic >= 75) {
    playerStrengths.push('Hard worker');
    cultureFit += 10;
  }
  if (player.morale.loyalty >= 70) {
    playerStrengths.push('Loyal');
    cultureFit += 5;
  }
  if (player.morale.chemistry >= 70) {
    playerStrengths.push('Good teammate');
    cultureFit += 5;
  }
  if (player.morale.tradeDesire >= 60) {
    gaps.push('Wants out');
    cultureFit -= 15;
  }
  
  // Development philosophy fit
  if (philosophy.developmentFocus === 'develop-youth' && player.age <= 24) {
    cultureFit += 10;
  } else if (philosophy.developmentFocus === 'win-now' && player.stats.overall >= 75) {
    cultureFit += 10;
  }
  
  // Calculate overall fit
  const overallFit = Math.round((offensiveFit + defensiveFit + cultureFit) / 3);
  
  // Determine role
  let roleClarity: PlayerSystemFit['roleClarity'];
  if (player.stats.overall >= 85) {
    roleClarity = 'star';
  } else if (player.stats.overall >= 75) {
    roleClarity = 'starter';
  } else if (player.stats.overall >= 65) {
    roleClarity = 'rotation';
  } else if (player.age <= 23 && player.potential >= 75) {
    roleClarity = 'developing';
  } else {
    roleClarity = 'specialist';
  }
  
  // Calculate expected boost from fit
  const expectedBoost = Math.round((overallFit - 50) / 10);
  
  return {
    playerId: player.id,
    playerName: `${player.firstName} ${player.lastName}`,
    offensiveFit: Math.max(0, Math.min(100, offensiveFit)),
    defensiveFit: Math.max(0, Math.min(100, defensiveFit)),
    cultureFit: Math.max(0, Math.min(100, cultureFit)),
    overallFit: Math.max(0, Math.min(100, overallFit)),
    skillsNeeded,
    playerStrengths,
    gaps,
    expectedBoost,
    roleClarity
  };
}

export function calculateTeamFit(
  roster: Player[],
  philosophy: TeamPhilosophy,
  coach: ExtendedCoach
): {
  averageFit: number;
  fitByPlayer: PlayerSystemFit[];
  bestFits: PlayerSystemFit[];
  worstFits: PlayerSystemFit[];
  recommendations: string[];
} {
  const fitByPlayer = roster.map(p => calculatePlayerFit(p, philosophy, coach));
  const averageFit = fitByPlayer.reduce((sum, f) => sum + f.overallFit, 0) / fitByPlayer.length;
  
  const sortedByFit = [...fitByPlayer].sort((a, b) => b.overallFit - a.overallFit);
  const bestFits = sortedByFit.slice(0, 3);
  const worstFits = sortedByFit.slice(-3).reverse();
  
  const recommendations: string[] = [];
  
  // Generate recommendations based on gaps
  const allGaps = fitByPlayer.flatMap(f => f.gaps);
  const gapCounts = allGaps.reduce((acc, gap) => {
    acc[gap] = (acc[gap] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  for (const [gap, count] of Object.entries(gapCounts)) {
    if (count >= 3) {
      recommendations.push(`Consider addressing roster-wide issue: ${gap} (${count} players)`);
    }
  }
  
  if (averageFit < 50) {
    recommendations.push('Team poorly suited to current system - consider philosophy change');
  }
  
  if (worstFits[0] && worstFits[0].overallFit < 40) {
    recommendations.push(`${worstFits[0].playerName} is a major system mismatch - consider trade`);
  }
  
  return {
    averageFit: Math.round(averageFit),
    fitByPlayer,
    bestFits,
    worstFits,
    recommendations
  };
}

export function updateTeamIdentity(
  identity: TeamIdentity,
  team: Team,
  seasonStats: { offRtg: number; defRtg: number; pace: number; threeRate: number },
  madePlayoffs: boolean,
  wonChampionship: boolean
): TeamIdentity {
  const updated = { ...identity };
  updated.establishedYears++;
  
  // Update offensive identity based on performance
  if (seasonStats.threeRate >= 0.40) {
    if (updated.offensiveIdentity === 'three-point-barrage') {
      // Identity reinforced
    } else if (updated.establishedYears >= 3) {
      updated.offensiveIdentity = 'three-point-barrage';
      updated.knownFor.push('3-point shooting');
    }
  }
  
  if (seasonStats.pace >= 102) {
    if (updated.establishedYears >= 2 && !updated.knownFor.includes('Fast pace')) {
      updated.knownFor.push('Fast pace');
    }
  }
  
  // Update rankings
  const wins = team.wins;
  const totalGames = team.wins + team.losses;
  const winPct = wins / totalGames;
  
  if (winPct >= 0.65) {
    updated.leaguePerception.intimidationFactor = Math.min(100, updated.leaguePerception.intimidationFactor + 5);
  }
  
  if (wonChampionship) {
    updated.leaguePerception.intimidationFactor = Math.min(100, updated.leaguePerception.intimidationFactor + 15);
    updated.leaguePerception.clutchRating = Math.min(100, updated.leaguePerception.clutchRating + 10);
    if (!updated.knownFor.includes('Championship culture')) {
      updated.knownFor.push('Championship culture');
    }
  }
  
  // Home court advantage builds over time with winning
  if (winPct >= 0.5) {
    updated.leaguePerception.homeCourtAdvantage = Math.min(100, 
      updated.leaguePerception.homeCourtAdvantage + (winPct - 0.5) * 10);
  }
  
  return updated;
}

export function calculateHomeCourtBonus(identity: TeamIdentity): number {
  // Returns offensive/defensive bonus for home games
  const baseBonus = 2; // NBA average home court advantage ~2-3 points
  const identityBonus = (identity.leaguePerception.homeCourtAdvantage - 50) / 25;
  const intimidationBonus = (identity.leaguePerception.intimidationFactor - 50) / 50;
  
  return baseBonus + identityBonus + intimidationBonus;
}
