// ============================================
// Player Generation System
// ============================================

import { Player, PlayerStats, DraftProspect, SeasonStats } from '../types';

// Name pools for realistic player generation
const FIRST_NAMES = [
  'James', 'Michael', 'Anthony', 'Kevin', 'Stephen', 'LeBron', 'Giannis', 'Luka',
  'Jayson', 'Devin', 'Trae', 'Ja', 'Tyrese', 'Cade', 'Paolo', 'Victor', 'Jalen',
  'Darius', 'Donovan', 'Brandon', 'Tyler', 'Marcus', 'Kyrie', 'Damian', 'Russell',
  'Chris', 'Paul', 'Kawhi', 'Jimmy', 'Bam', 'Nikola', 'Joel', 'Anthony', 'Karl',
  'De\'Aaron', 'Domantas', 'Pascal', 'Fred', 'Scottie', 'OG', 'Alperen', 'Jabari',
  'Keldon', 'Desmond', 'Keegan', 'Lauri', 'Jrue', 'Khris', 'Brook', 'Bobby'
];

const LAST_NAMES = [
  'Johnson', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Anderson', 'Taylor',
  'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Robinson',
  'Clark', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright',
  'Green', 'Baker', 'Adams', 'Nelson', 'Hill', 'Campbell', 'Mitchell', 'Roberts',
  'Carter', 'Phillips', 'Evans', 'Turner', 'Torres', 'Parker', 'Edwards', 'Collins',
  'Stewart', 'Morris', 'Murphy', 'Rivera', 'Cook', 'Rogers', 'Morgan', 'Peterson'
];

const COLLEGES = [
  'Duke', 'Kentucky', 'Kansas', 'North Carolina', 'UCLA', 'Michigan', 'Gonzaga',
  'Villanova', 'Arizona', 'Texas', 'Baylor', 'Auburn', 'Tennessee', 'LSU', 
  'Arkansas', 'Indiana', 'Ohio State', 'Michigan State', 'Florida', 'Syracuse',
  'Georgetown', 'Louisville', 'UConn', 'Memphis', 'Oklahoma', 'Virginia',
  'USC', 'Oregon', 'Alabama', 'Georgia', 'Purdue', 'Iowa', 'Wisconsin', null
];

const COMPARISON_PLAYERS = [
  'Michael Jordan', 'LeBron James', 'Stephen Curry', 'Kevin Durant', 'Kobe Bryant',
  'Magic Johnson', 'Larry Bird', 'Tim Duncan', 'Shaquille O\'Neal', 'Hakeem Olajuwon',
  'Russell Westbrook', 'James Harden', 'Chris Paul', 'Kawhi Leonard', 'Giannis Antetokounmpo',
  'Luka Doncic', 'Jayson Tatum', 'Anthony Edwards', 'Ja Morant', 'Trae Young'
];

// Position-based height ranges (in inches)
const POSITION_HEIGHTS: Record<string, { min: number; max: number }> = {
  'PG': { min: 70, max: 77 },
  'SG': { min: 73, max: 79 },
  'SF': { min: 77, max: 82 },
  'PF': { min: 79, max: 84 },
  'C': { min: 81, max: 88 }
};

// Position-based weight ranges (in pounds)
const POSITION_WEIGHTS: Record<string, { min: number; max: number }> = {
  'PG': { min: 170, max: 200 },
  'SG': { min: 185, max: 215 },
  'SF': { min: 200, max: 240 },
  'PF': { min: 220, max: 260 },
  'C': { min: 240, max: 290 }
};

// Position-based stat tendencies (multipliers for base stats)
const POSITION_TENDENCIES: Record<string, Partial<PlayerStats>> = {
  'PG': {
    ballHandling: 1.3, passing: 1.3, speed: 1.2, threePoint: 1.1,
    interiorDefense: 0.7, blocking: 0.5, offensiveRebounding: 0.6
  },
  'SG': {
    threePoint: 1.2, midRange: 1.2, speed: 1.1, perimeterDefense: 1.1,
    interiorDefense: 0.8, blocking: 0.6, offensiveRebounding: 0.7
  },
  'SF': {
    // Most balanced position
  },
  'PF': {
    strength: 1.2, defensiveRebounding: 1.2, offensiveRebounding: 1.1,
    insideScoring: 1.1, interiorDefense: 1.1, ballHandling: 0.8
  },
  'C': {
    strength: 1.3, defensiveRebounding: 1.4, offensiveRebounding: 1.3,
    blocking: 1.5, interiorDefense: 1.3, insideScoring: 1.2,
    speed: 0.7, ballHandling: 0.6, threePoint: 0.6
  }
};

function generateId(): string {
  return `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Generate a stat value based on overall rating tier
function generateStat(tier: 'star' | 'starter' | 'rotation' | 'bench' | 'prospect', variance: number = 10): number {
  const tierBases = {
    'star': 85,
    'starter': 72,
    'rotation': 62,
    'bench': 52,
    'prospect': 45
  };
  
  const base = tierBases[tier];
  return clamp(base + (Math.random() - 0.5) * variance * 2, 25, 99);
}

export function calculateOverall(stats: PlayerStats): number {
  const weights = {
    speed: 0.06,
    strength: 0.04,
    jumping: 0.04,
    endurance: 0.04,
    insideScoring: 0.09,
    midRange: 0.08,
    threePoint: 0.10,
    freeThrow: 0.04,
    ballHandling: 0.07,
    passing: 0.06,
    perimeterDefense: 0.08,
    interiorDefense: 0.06,
    stealing: 0.04,
    blocking: 0.04,
    offensiveRebounding: 0.04,
    defensiveRebounding: 0.05,
    basketballIQ: 0.05,
    workEthic: 0.00,
    durability: 0.00,
    clutch: 0.02
  };
  
  let total = 0;
  for (const [key, weight] of Object.entries(weights)) {
    total += (stats[key as keyof PlayerStats] || 50) * weight;
  }
  
  return Math.round(total);
}

export function generatePlayerStats(
  position: Player['position'],
  tier: 'star' | 'starter' | 'rotation' | 'bench' | 'prospect'
): PlayerStats {
  const tendencies = POSITION_TENDENCIES[position] || {};
  
  const baseStats: PlayerStats = {
    speed: generateStat(tier),
    strength: generateStat(tier),
    jumping: generateStat(tier),
    endurance: generateStat(tier),
    insideScoring: generateStat(tier),
    midRange: generateStat(tier),
    threePoint: generateStat(tier),
    freeThrow: generateStat(tier),
    ballHandling: generateStat(tier),
    passing: generateStat(tier),
    perimeterDefense: generateStat(tier),
    interiorDefense: generateStat(tier),
    stealing: generateStat(tier),
    blocking: generateStat(tier),
    offensiveRebounding: generateStat(tier),
    defensiveRebounding: generateStat(tier),
    basketballIQ: generateStat(tier),
    workEthic: 40 + Math.floor(Math.random() * 60),
    durability: 40 + Math.floor(Math.random() * 60),
    clutch: 40 + Math.floor(Math.random() * 60),
    overall: 0
  };
  
  // Apply position tendencies
  for (const [stat, multiplier] of Object.entries(tendencies)) {
    const key = stat as keyof PlayerStats;
    baseStats[key] = clamp(Math.round(baseStats[key] * (multiplier as number)), 25, 99);
  }
  
  baseStats.overall = calculateOverall(baseStats);
  return baseStats;
}

export function emptySeasonStats(): SeasonStats {
  return {
    gamesPlayed: 0,
    gamesStarted: 0,
    minutesPerGame: 0,
    points: 0,
    rebounds: 0,
    assists: 0,
    steals: 0,
    blocks: 0,
    turnovers: 0,
    fieldGoalsMade: 0,
    fieldGoalsAttempted: 0,
    threePointersMade: 0,
    threePointersAttempted: 0,
    freeThrowsMade: 0,
    freeThrowsAttempted: 0,
    personalFouls: 0,
    plusMinus: 0
  };
}

export function generatePlayer(options: {
  position?: Player['position'];
  tier?: 'star' | 'starter' | 'rotation' | 'bench';
  age?: number;
  teamId?: string | null;
  yearsExperience?: number;
}): Player {
  const positions: Player['position'][] = ['PG', 'SG', 'SF', 'PF', 'C'];
  const position = options.position || positions[Math.floor(Math.random() * positions.length)];
  const tier = options.tier || 'rotation';
  const age = options.age || (19 + Math.floor(Math.random() * 16));
  const yearsExperience = options.yearsExperience ?? Math.max(0, age - 19);
  
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  
  const heightRange = POSITION_HEIGHTS[position];
  const weightRange = POSITION_WEIGHTS[position];
  
  const stats = generatePlayerStats(position, tier);
  
  // Calculate potential based on age and tier
  let potential = stats.overall;
  if (age < 25) {
    potential += Math.floor((25 - age) * 2 + Math.random() * 10);
  }
  potential = Math.min(99, potential);
  
  // Calculate peak age
  const peakAge = 26 + Math.floor(Math.random() * 5);
  
  // Generate salary based on overall and age
  const baseSalary = calculateBaseSalary(stats.overall, age, yearsExperience);
  
  const player: Player = {
    id: generateId(),
    firstName,
    lastName,
    position,
    secondaryPosition: Math.random() > 0.5 ? getSecondaryPosition(position) : undefined,
    height: Math.round(randomBetween(heightRange.min, heightRange.max)),
    weight: Math.round(randomBetween(weightRange.min, weightRange.max)),
    age,
    birthYear: new Date().getFullYear() - age,
    yearsExperience,
    college: yearsExperience === 0 ? undefined : COLLEGES[Math.floor(Math.random() * COLLEGES.length)] || undefined,
    draftYear: yearsExperience > 0 ? new Date().getFullYear() - yearsExperience : undefined,
    draftRound: yearsExperience > 0 ? (Math.random() > 0.5 ? 1 : 2) : undefined,
    draftPick: yearsExperience > 0 ? Math.floor(Math.random() * 30) + 1 : undefined,
    
    stats,
    potential,
    peakAge,
    
    teamId: options.teamId ?? null,
    contract: {
      salary: baseSalary,
      years: 1 + Math.floor(Math.random() * 4),
      type: 'standard',
      noTradeClause: stats.overall >= 85 && Math.random() > 0.5,
      signedYear: new Date().getFullYear()
    },
    birdRights: yearsExperience >= 3,
    
    injury: null,
    morale: {
      happiness: 60 + Math.floor(Math.random() * 40),
      loyalty: 50 + Math.floor(Math.random() * 50),
      chemistry: 60 + Math.floor(Math.random() * 40),
      tradeDesire: Math.floor(Math.random() * 30),
      factors: {
        playingTime: 0,
        teamSuccess: 0,
        cityPreference: 0,
        coaching: 0,
        teammates: 0
      }
    },
    
    seasonStats: {},
    careerStats: emptySeasonStats(),
    awards: [],
    allStarSelections: 0
  };
  
  return player;
}

function getSecondaryPosition(primary: Player['position']): Player['position'] | undefined {
  const adjacentPositions: Record<string, Player['position'][]> = {
    'PG': ['SG'],
    'SG': ['PG', 'SF'],
    'SF': ['SG', 'PF'],
    'PF': ['SF', 'C'],
    'C': ['PF']
  };
  
  const options = adjacentPositions[primary];
  return options[Math.floor(Math.random() * options.length)];
}

function calculateBaseSalary(overall: number, age: number, experience: number): number {
  // 2025-26 NBA salary scale approximations
  const minSalary = 1100000;
  const maxSalary = 50000000;
  const midLevelSalary = 12800000;
  
  if (overall >= 90) {
    return Math.round(randomBetween(40000000, maxSalary));
  } else if (overall >= 85) {
    return Math.round(randomBetween(30000000, 45000000));
  } else if (overall >= 80) {
    return Math.round(randomBetween(20000000, 35000000));
  } else if (overall >= 75) {
    return Math.round(randomBetween(12000000, 25000000));
  } else if (overall >= 70) {
    return Math.round(randomBetween(6000000, 15000000));
  } else if (overall >= 65) {
    return Math.round(randomBetween(2000000, 8000000));
  } else {
    // Veteran minimum based on experience
    const vetMinimums = [1100000, 1800000, 2100000, 2400000, 2900000];
    return vetMinimums[Math.min(experience, vetMinimums.length - 1)];
  }
}

export function generateDraftProspect(pickNumber: number): DraftProspect {
  const positions: Player['position'][] = ['PG', 'SG', 'SF', 'PF', 'C'];
  const position = positions[Math.floor(Math.random() * positions.length)];
  
  // Higher picks are generally better
  let tier: 'star' | 'starter' | 'rotation' | 'bench' | 'prospect';
  if (pickNumber <= 3) {
    tier = Math.random() > 0.2 ? 'star' : 'starter';
  } else if (pickNumber <= 10) {
    tier = Math.random() > 0.3 ? 'starter' : 'rotation';
  } else if (pickNumber <= 20) {
    tier = Math.random() > 0.4 ? 'rotation' : 'bench';
  } else if (pickNumber <= 40) {
    tier = Math.random() > 0.5 ? 'bench' : 'prospect';
  } else {
    tier = 'prospect';
  }
  
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const college = COLLEGES[Math.floor(Math.random() * COLLEGES.length)];
  
  const heightRange = POSITION_HEIGHTS[position];
  const weightRange = POSITION_WEIGHTS[position];
  
  const stats = generatePlayerStats(position, tier);
  
  // True potential hidden until draft
  const truePotential = Math.min(99, stats.overall + Math.floor(Math.random() * 25) + (pickNumber <= 5 ? 10 : 0));
  
  // Scouted values may be off
  const scoutedStats = { ...stats };
  for (const key of Object.keys(scoutedStats) as (keyof PlayerStats)[]) {
    if (typeof scoutedStats[key] === 'number') {
      scoutedStats[key] = clamp(
        scoutedStats[key] + Math.floor((Math.random() - 0.5) * 10),
        25,
        99
      );
    }
  }
  scoutedStats.overall = calculateOverall(scoutedStats);
  
  const age = 19 + Math.floor(Math.random() * 4); // 19-22
  
  const grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'] as const;
  const strengths = [
    'Elite athleticism', 'Pure shooter', 'Lockdown defender', 'High basketball IQ',
    'Great vision', 'Strong finisher', 'Excellent rebounder', 'Shot blocker',
    'Ball handler', 'Leadership', 'Clutch performer', 'Motor never stops'
  ];
  const weaknesses = [
    'Needs strength', 'Defensive lapses', 'Shot selection', 'Turnover prone',
    'Limited range', 'Free throw struggles', 'Conditioning concerns', 'Injury history',
    'Consistency issues', 'Lack of aggression', 'Poor footwork', 'Decision making'
  ];
  const roles = ['Star', 'Starter', 'Rotation', 'Deep Bench', 'Bust'] as const;
  
  return {
    id: generateId(),
    firstName,
    lastName,
    position,
    secondaryPosition: Math.random() > 0.5 ? getSecondaryPosition(position) : undefined,
    height: Math.round(randomBetween(heightRange.min, heightRange.max)),
    weight: Math.round(randomBetween(weightRange.min, weightRange.max)),
    age,
    birthYear: new Date().getFullYear() - age,
    yearsExperience: 0,
    college: college || undefined,
    
    stats: scoutedStats,
    potential: Math.min(99, scoutedStats.overall + Math.floor((Math.random() - 0.5) * 15) + 15),
    peakAge: 25 + Math.floor(Math.random() * 5),
    
    injury: null,
    morale: {
      happiness: 70 + Math.floor(Math.random() * 30),
      loyalty: 50 + Math.floor(Math.random() * 50),
      chemistry: 70 + Math.floor(Math.random() * 30),
      tradeDesire: 0,
      factors: { playingTime: 0, teamSuccess: 0, cityPreference: 0, coaching: 0, teammates: 0 }
    },
    
    trueOverall: stats.overall,
    truePotential,
    projectedPick: pickNumber + Math.floor((Math.random() - 0.5) * 10),
    comparisonPlayer: Math.random() > 0.3 ? COMPARISON_PLAYERS[Math.floor(Math.random() * COMPARISON_PLAYERS.length)] : undefined,
    
    scoutingReports: [
      {
        scoutId: 'scout-1',
        overallGrade: grades[Math.min(Math.floor((100 - scoutedStats.overall) / 5), grades.length - 1)],
        strengths: [
          strengths[Math.floor(Math.random() * strengths.length)],
          strengths[Math.floor(Math.random() * strengths.length)]
        ],
        weaknesses: [
          weaknesses[Math.floor(Math.random() * weaknesses.length)]
        ],
        projectedRole: roles[Math.min(Math.floor(pickNumber / 15), roles.length - 1)],
        notes: `Solid prospect with ${pickNumber <= 10 ? 'high upside' : 'potential to contribute'}.`
      }
    ]
  };
}

export function generateDraftClass(year: number, count: number = 60): DraftProspect[] {
  const prospects: DraftProspect[] = [];
  
  for (let i = 1; i <= count; i++) {
    const prospect = generateDraftProspect(i);
    prospects.push(prospect);
  }
  
  // Sort by projected pick (with some randomness)
  prospects.sort((a, b) => a.projectedPick - b.projectedPick);
  
  return prospects;
}

export function generateRoster(teamId: string, count: number = 15): Player[] {
  const roster: Player[] = [];
  
  // Ensure position balance
  const positions: Player['position'][] = ['PG', 'SG', 'SF', 'PF', 'C'];
  
  // Generate 2-3 starters/stars
  for (let i = 0; i < 2; i++) {
    roster.push(generatePlayer({
      position: positions[i],
      tier: Math.random() > 0.5 ? 'star' : 'starter',
      teamId
    }));
  }
  
  // Generate 3 more starters
  for (let i = 2; i < 5; i++) {
    roster.push(generatePlayer({
      position: positions[i],
      tier: 'starter',
      teamId
    }));
  }
  
  // Generate rotation players
  for (let i = 5; i < 10; i++) {
    roster.push(generatePlayer({
      position: positions[i % 5],
      tier: 'rotation',
      teamId
    }));
  }
  
  // Generate bench players
  for (let i = 10; i < count; i++) {
    roster.push(generatePlayer({
      position: positions[i % 5],
      tier: 'bench',
      teamId
    }));
  }
  
  return roster;
}

export function generateFreeAgents(count: number = 100): Player[] {
  const freeAgents: Player[] = [];
  
  for (let i = 0; i < count; i++) {
    const tier = i < 10 ? 'starter' : (i < 30 ? 'rotation' : 'bench');
    freeAgents.push(generatePlayer({ tier, teamId: null }));
  }
  
  return freeAgents;
}
