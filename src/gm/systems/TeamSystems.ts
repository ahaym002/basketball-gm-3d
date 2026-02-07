// ============================================
// Team Systems - Playbook, Rotations, Load Management
// ============================================

import { Player, Team, LeagueState } from '../types';

// ==================== PLAYBOOK SYSTEM ====================
export type PlayType = 
  | 'pick-and-roll-high'
  | 'pick-and-roll-side'
  | 'pick-and-pop'
  | 'post-up-left'
  | 'post-up-right'
  | 'iso-wing'
  | 'iso-elbow'
  | 'dribble-handoff'
  | 'backdoor-cut'
  | 'corner-action'
  | 'floppy'
  | 'spain-pnr'
  | 'horns'
  | 'princeton-action'
  | 'motion-weak'
  | 'transition-push'
  | 'ato-hammer'
  | 'ato-stagger'
  | 'lob-play'
  | 'clear-out';

export interface PlayDefinition {
  id: PlayType;
  name: string;
  category: 'half-court' | 'transition' | 'ato' | 'special';
  description: string;
  primaryPositions: ('PG' | 'SG' | 'SF' | 'PF' | 'C')[];
  requiredSkills: string[];
  difficulty: number; // 1-10, affects execution rate
  averagePointsValue: number;
  optimalSituation: string;
}

export const PLAYS: Record<PlayType, PlayDefinition> = {
  'pick-and-roll-high': {
    id: 'pick-and-roll-high',
    name: 'High Pick & Roll',
    category: 'half-court',
    description: 'Ball handler attacks off screen at top of key',
    primaryPositions: ['PG', 'SG'],
    requiredSkills: ['ballHandling', 'passing'],
    difficulty: 4,
    averagePointsValue: 1.05,
    optimalSituation: 'Against drop coverage'
  },
  'pick-and-roll-side': {
    id: 'pick-and-roll-side',
    name: 'Side Pick & Roll',
    category: 'half-court',
    description: 'Ball screen action on the wing',
    primaryPositions: ['PG', 'SG', 'SF'],
    requiredSkills: ['ballHandling', 'midRange'],
    difficulty: 5,
    averagePointsValue: 1.02,
    optimalSituation: 'Short shot clock'
  },
  'pick-and-pop': {
    id: 'pick-and-pop',
    name: 'Pick & Pop',
    category: 'half-court',
    description: 'Screener pops out for jumper instead of rolling',
    primaryPositions: ['PG', 'SG'],
    requiredSkills: ['passing', 'threePoint'],
    difficulty: 4,
    averagePointsValue: 1.08,
    optimalSituation: 'When big can shoot'
  },
  'post-up-left': {
    id: 'post-up-left',
    name: 'Left Block Post Up',
    category: 'half-court',
    description: 'Post entry on left block',
    primaryPositions: ['PF', 'C'],
    requiredSkills: ['insideScoring', 'strength'],
    difficulty: 3,
    averagePointsValue: 0.98,
    optimalSituation: 'Size mismatch'
  },
  'post-up-right': {
    id: 'post-up-right',
    name: 'Right Block Post Up',
    category: 'half-court',
    description: 'Post entry on right block',
    primaryPositions: ['PF', 'C'],
    requiredSkills: ['insideScoring', 'strength'],
    difficulty: 3,
    averagePointsValue: 0.98,
    optimalSituation: 'Size mismatch'
  },
  'iso-wing': {
    id: 'iso-wing',
    name: 'Wing Isolation',
    category: 'half-court',
    description: 'Clear out for 1-on-1 on the wing',
    primaryPositions: ['SF', 'SG'],
    requiredSkills: ['ballHandling', 'midRange'],
    difficulty: 6,
    averagePointsValue: 0.95,
    optimalSituation: 'Elite scorer with mismatch'
  },
  'iso-elbow': {
    id: 'iso-elbow',
    name: 'Elbow Isolation',
    category: 'half-court',
    description: 'Triple-threat at the elbow',
    primaryPositions: ['SF', 'PF'],
    requiredSkills: ['midRange', 'basketballIQ'],
    difficulty: 5,
    averagePointsValue: 0.93,
    optimalSituation: 'Mid-post scorer'
  },
  'dribble-handoff': {
    id: 'dribble-handoff',
    name: 'Dribble Handoff',
    category: 'half-court',
    description: 'Guard comes off DHO from big',
    primaryPositions: ['SG', 'SF'],
    requiredSkills: ['threePoint', 'ballHandling'],
    difficulty: 4,
    averagePointsValue: 1.04,
    optimalSituation: 'Shooter coming off screens'
  },
  'backdoor-cut': {
    id: 'backdoor-cut',
    name: 'Backdoor Cut',
    category: 'half-court',
    description: 'Cutter goes behind overplaying defender',
    primaryPositions: ['SF', 'SG', 'PF'],
    requiredSkills: ['speed', 'basketballIQ'],
    difficulty: 6,
    averagePointsValue: 1.35,
    optimalSituation: 'Against aggressive denial'
  },
  'corner-action': {
    id: 'corner-action',
    name: 'Corner Action',
    category: 'half-court',
    description: 'Sequence ending with corner three',
    primaryPositions: ['SF', 'SG'],
    requiredSkills: ['threePoint', 'spacing'],
    difficulty: 3,
    averagePointsValue: 1.12,
    optimalSituation: 'Open corner shooters'
  },
  'floppy': {
    id: 'floppy',
    name: 'Floppy',
    category: 'half-court',
    description: 'Shooter chooses screen direction',
    primaryPositions: ['SG', 'SF'],
    requiredSkills: ['threePoint', 'speed'],
    difficulty: 5,
    averagePointsValue: 1.08,
    optimalSituation: 'Elite off-ball shooter'
  },
  'spain-pnr': {
    id: 'spain-pnr',
    name: 'Spain Pick & Roll',
    category: 'half-court',
    description: 'PnR with backscreen on the roller\'s defender',
    primaryPositions: ['PG'],
    requiredSkills: ['passing', 'basketballIQ'],
    difficulty: 8,
    averagePointsValue: 1.18,
    optimalSituation: 'High-IQ teams'
  },
  'horns': {
    id: 'horns',
    name: 'Horns Set',
    category: 'half-court',
    description: 'Two bigs at elbows, multiple options',
    primaryPositions: ['PG', 'SG'],
    requiredSkills: ['passing', 'ballHandling'],
    difficulty: 6,
    averagePointsValue: 1.06,
    optimalSituation: 'Versatile personnel'
  },
  'princeton-action': {
    id: 'princeton-action',
    name: 'Princeton Backdoor',
    category: 'half-court',
    description: 'High-post hub with backdoor cuts',
    primaryPositions: ['PF', 'C'],
    requiredSkills: ['passing', 'basketballIQ'],
    difficulty: 7,
    averagePointsValue: 1.10,
    optimalSituation: 'High-IQ big man'
  },
  'motion-weak': {
    id: 'motion-weak',
    name: 'Motion Weak',
    category: 'half-court',
    description: 'Ball reversal with weak side action',
    primaryPositions: ['PG', 'SF'],
    requiredSkills: ['passing', 'basketballIQ'],
    difficulty: 5,
    averagePointsValue: 1.04,
    optimalSituation: 'Patient offense needed'
  },
  'transition-push': {
    id: 'transition-push',
    name: 'Early Offense Push',
    category: 'transition',
    description: 'Attack before defense sets',
    primaryPositions: ['PG', 'SG'],
    requiredSkills: ['speed', 'ballHandling'],
    difficulty: 4,
    averagePointsValue: 1.15,
    optimalSituation: 'After turnovers/makes'
  },
  'ato-hammer': {
    id: 'ato-hammer',
    name: 'ATO: Hammer',
    category: 'ato',
    description: 'Corner three off baseline screen',
    primaryPositions: ['SF', 'SG'],
    requiredSkills: ['threePoint'],
    difficulty: 5,
    averagePointsValue: 1.25,
    optimalSituation: 'After timeout'
  },
  'ato-stagger': {
    id: 'ato-stagger',
    name: 'ATO: Stagger Screens',
    category: 'ato',
    description: 'Shooter comes off double stagger',
    primaryPositions: ['SG', 'SF'],
    requiredSkills: ['threePoint', 'speed'],
    difficulty: 6,
    averagePointsValue: 1.22,
    optimalSituation: 'After timeout'
  },
  'lob-play': {
    id: 'lob-play',
    name: 'Lob Play',
    category: 'special',
    description: 'Alley-oop to athletic finisher',
    primaryPositions: ['PF', 'C'],
    requiredSkills: ['jumping', 'athleticism'],
    difficulty: 6,
    averagePointsValue: 1.40,
    optimalSituation: 'Elite athlete at rim'
  },
  'clear-out': {
    id: 'clear-out',
    name: 'Clear Out',
    category: 'special',
    description: 'Empty one side for star to operate',
    primaryPositions: ['SF', 'SG', 'PG'],
    requiredSkills: ['ballHandling', 'shotCreation'],
    difficulty: 7,
    averagePointsValue: 0.98,
    optimalSituation: 'Star needs ball in hands'
  }
};

export interface Playbook {
  halfCourtPlays: PlayType[];
  transitionPlays: PlayType[];
  atoPlays: PlayType[];
  specialPlays: PlayType[];
  playFrequencies: Record<PlayType, number>; // 0-100, how often to call
  clutchPlay: PlayType;
  lastShotPlay: PlayType;
}

export function createDefaultPlaybook(): Playbook {
  return {
    halfCourtPlays: ['pick-and-roll-high', 'pick-and-roll-side', 'corner-action', 'motion-weak', 'horns'],
    transitionPlays: ['transition-push'],
    atoPlays: ['ato-hammer', 'ato-stagger'],
    specialPlays: ['lob-play', 'clear-out'],
    playFrequencies: {
      'pick-and-roll-high': 30,
      'pick-and-roll-side': 20,
      'corner-action': 15,
      'motion-weak': 20,
      'horns': 15,
      'transition-push': 80,
      'ato-hammer': 50,
      'ato-stagger': 50,
      'lob-play': 10,
      'clear-out': 10,
      // Defaults for others
      'pick-and-pop': 0,
      'post-up-left': 0,
      'post-up-right': 0,
      'iso-wing': 0,
      'iso-elbow': 0,
      'dribble-handoff': 0,
      'backdoor-cut': 0,
      'floppy': 0,
      'spain-pnr': 0,
      'princeton-action': 0
    },
    clutchPlay: 'pick-and-roll-high',
    lastShotPlay: 'iso-wing'
  };
}

// ==================== ROTATION SYSTEM ====================
export interface LineupUnit {
  id: string;
  name: string;
  players: string[]; // Player IDs (5 players)
  purpose: 'starters' | 'bench' | 'closing' | 'rest' | 'matchup';
  minutesTarget: number; // Minutes per game this unit plays together
  offensiveRating?: number;
  defensiveRating?: number;
  netRating?: number;
}

export interface RotationSettings {
  starters: string[]; // 5 Player IDs
  closingLineup: string[]; // 5 Player IDs for clutch time
  lineupUnits: LineupUnit[];
  
  // Individual player settings
  playerSettings: Record<string, PlayerRotationSettings>;
  
  // Substitution patterns
  firstSubstitutionMinute: number; // When first subs happen
  rotationStyle: 'fixed' | 'flow' | 'matchup';
}

export interface PlayerRotationSettings {
  playerId: string;
  targetMinutes: number;
  maxMinutes: number;
  minuteRestriction: boolean;
  restGamesPattern: number; // Rest every N games (0 = never)
  playInClutch: boolean;
  playVsStarters: boolean;
  playVsBench: boolean;
  partnersWith: string[]; // Player IDs they play well with
  neverWith: string[]; // Player IDs they clash with
}

export function createDefaultRotation(players: Player[]): RotationSettings {
  const sorted = [...players].sort((a, b) => b.stats.overall - a.stats.overall);
  const starters = sorted.slice(0, 5).map(p => p.id);
  const benchCore = sorted.slice(5, 10).map(p => p.id);
  
  const playerSettings: Record<string, PlayerRotationSettings> = {};
  players.forEach((p, i) => {
    const isStarter = i < 5;
    const isBench = i >= 5 && i < 10;
    
    playerSettings[p.id] = {
      playerId: p.id,
      targetMinutes: isStarter ? 32 : isBench ? 18 : 5,
      maxMinutes: isStarter ? 40 : isBench ? 28 : 15,
      minuteRestriction: false,
      restGamesPattern: p.age >= 35 ? 5 : 0,
      playInClutch: i < 5,
      playVsStarters: isStarter,
      playVsBench: !isStarter,
      partnersWith: [],
      neverWith: []
    };
  });
  
  return {
    starters,
    closingLineup: starters,
    lineupUnits: [
      {
        id: 'starting',
        name: 'Starting Unit',
        players: starters,
        purpose: 'starters',
        minutesTarget: 12
      },
      {
        id: 'bench',
        name: 'Bench Mob',
        players: benchCore,
        purpose: 'bench',
        minutesTarget: 10
      }
    ],
    playerSettings,
    firstSubstitutionMinute: 6,
    rotationStyle: 'flow'
  };
}

// Calculate lineup chemistry
export function calculateLineupChemistry(
  playerIds: string[],
  players: Record<string, Player>,
  rotation: RotationSettings
): { chemistry: number; issues: string[] } {
  let chemistry = 50;
  const issues: string[] = [];
  
  for (let i = 0; i < playerIds.length; i++) {
    const settings = rotation.playerSettings[playerIds[i]];
    if (!settings) continue;
    
    for (let j = i + 1; j < playerIds.length; j++) {
      if (settings.partnersWith.includes(playerIds[j])) {
        chemistry += 5;
      }
      if (settings.neverWith.includes(playerIds[j])) {
        chemistry -= 15;
        const p1 = players[playerIds[i]];
        const p2 = players[playerIds[j]];
        if (p1 && p2) {
          issues.push(`${p1.lastName} and ${p2.lastName} have chemistry issues`);
        }
      }
    }
  }
  
  // Position balance check
  const positions = playerIds.map(id => players[id]?.position).filter(Boolean);
  const uniquePositions = new Set(positions);
  if (uniquePositions.size < 4) {
    chemistry -= 10;
    issues.push('Poor positional balance');
  }
  
  return { chemistry: Math.max(0, Math.min(100, chemistry)), issues };
}

// ==================== CLUTCH TIME SETTINGS ====================
export interface ClutchSettings {
  lineup: string[]; // 5 Player IDs
  primaryBallHandler: string;
  primaryScorer: string;
  inboundsPasser: string;
  clutchDefenseScheme: 'switch' | 'lock' | 'zone' | 'blitz';
  foulStrategy: 'foul-to-stop-3' | 'foul-bad-ft' | 'play-straight';
  lastPossessionPlay: PlayType;
  trustRating: Record<string, number>; // Player ID -> 0-100 clutch trust
}

export function createDefaultClutchSettings(players: Player[]): ClutchSettings {
  const sorted = [...players].sort((a, b) => {
    const clutchScore = (p: Player) => p.stats.clutch * 0.4 + p.stats.overall * 0.6;
    return clutchScore(b) - clutchScore(a);
  });
  
  const top5 = sorted.slice(0, 5);
  const bestBallHandler = [...top5].sort((a, b) => b.stats.ballHandling - a.stats.ballHandling)[0];
  const bestScorer = [...top5].sort((a, b) => 
    (b.stats.insideScoring + b.stats.midRange + b.stats.threePoint) - 
    (a.stats.insideScoring + a.stats.midRange + a.stats.threePoint)
  )[0];
  
  const trustRating: Record<string, number> = {};
  players.forEach(p => {
    trustRating[p.id] = Math.round(p.stats.clutch * 0.7 + p.stats.overall * 0.3);
  });
  
  return {
    lineup: top5.map(p => p.id),
    primaryBallHandler: bestBallHandler.id,
    primaryScorer: bestScorer.id,
    inboundsPasser: top5.find(p => p.position === 'PG' || p.position === 'SG')?.id || top5[0].id,
    clutchDefenseScheme: 'switch',
    foulStrategy: 'foul-to-stop-3',
    lastPossessionPlay: 'pick-and-roll-high',
    trustRating
  };
}

// ==================== LOAD MANAGEMENT ====================
export interface LoadManagementSettings {
  enabled: boolean;
  veteranThreshold: number; // Age above which veterans get rest
  minutesThreshold: number; // Rest if player plays above this
  backToBackRest: boolean;
  fourInFiveRest: boolean;
  injuryHistoryConsideration: boolean;
  playoffRamp: boolean; // Increase load near playoffs
  
  playerOverrides: Record<string, LoadManagementOverride>;
}

export interface LoadManagementOverride {
  playerId: string;
  neverRest: boolean;
  alwaysRest: boolean;
  maxConsecutiveGames: number;
  maxMinutesPerGame: number;
  restPattern: 'none' | 'b2b' | 'weekly' | 'custom';
  customRestDays: number[]; // Day of week (0-6) to rest
}

export function createDefaultLoadManagement(players: Player[]): LoadManagementSettings {
  const overrides: Record<string, LoadManagementOverride> = {};
  
  players.forEach(p => {
    const isVeteran = p.age >= 33;
    const isInjuryProne = p.stats.durability < 60;
    
    overrides[p.id] = {
      playerId: p.id,
      neverRest: p.age < 25 && p.stats.durability >= 80,
      alwaysRest: false,
      maxConsecutiveGames: isVeteran ? 3 : isInjuryProne ? 4 : 10,
      maxMinutesPerGame: isVeteran ? 32 : isInjuryProne ? 30 : 40,
      restPattern: isVeteran ? 'b2b' : 'none',
      customRestDays: []
    };
  });
  
  return {
    enabled: true,
    veteranThreshold: 33,
    minutesThreshold: 34,
    backToBackRest: true,
    fourInFiveRest: true,
    injuryHistoryConsideration: true,
    playoffRamp: true,
    playerOverrides: overrides
  };
}

export function shouldRestPlayer(
  player: Player,
  settings: LoadManagementSettings,
  consecutiveGames: number,
  isBackToBack: boolean,
  isFourInFive: boolean,
  gamesUntilPlayoffs: number
): { shouldRest: boolean; reason: string } {
  if (!settings.enabled) {
    return { shouldRest: false, reason: '' };
  }
  
  const override = settings.playerOverrides[player.id];
  
  if (override?.neverRest) {
    return { shouldRest: false, reason: '' };
  }
  
  if (override?.alwaysRest) {
    return { shouldRest: true, reason: 'Always rest (team policy)' };
  }
  
  // Back to back
  if (isBackToBack && settings.backToBackRest && player.age >= settings.veteranThreshold) {
    return { shouldRest: true, reason: 'Back-to-back rest (veteran)' };
  }
  
  // 4 in 5
  if (isFourInFive && settings.fourInFiveRest && player.age >= settings.veteranThreshold) {
    return { shouldRest: true, reason: '4-in-5 rest (veteran)' };
  }
  
  // Consecutive games limit
  if (override && consecutiveGames >= override.maxConsecutiveGames) {
    return { shouldRest: true, reason: `Consecutive games limit (${override.maxConsecutiveGames})` };
  }
  
  // Playoff ramp up - reduce rest near playoffs
  if (settings.playoffRamp && gamesUntilPlayoffs <= 10) {
    return { shouldRest: false, reason: '' };
  }
  
  // Injury history
  if (settings.injuryHistoryConsideration && player.stats.durability < 50) {
    if (Math.random() < 0.2) {
      return { shouldRest: true, reason: 'Precautionary rest (injury history)' };
    }
  }
  
  return { shouldRest: false, reason: '' };
}

// ==================== COMBINED TEAM SYSTEMS ====================
export interface TeamSystems {
  playbook: Playbook;
  rotation: RotationSettings;
  clutch: ClutchSettings;
  loadManagement: LoadManagementSettings;
}

export function createDefaultTeamSystems(players: Player[]): TeamSystems {
  return {
    playbook: createDefaultPlaybook(),
    rotation: createDefaultRotation(players),
    clutch: createDefaultClutchSettings(players),
    loadManagement: createDefaultLoadManagement(players)
  };
}
