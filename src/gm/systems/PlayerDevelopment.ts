// ============================================
// Player Development System
// ============================================

import { Player, PlayerStats, Team, Coach, Injury, LeagueState } from '../types';
import { calculateOverall } from '../data/players';

// Injury types with severity and recovery time
const INJURY_TYPES: {
  name: string;
  severity: Injury['severity'];
  minGames: number;
  maxGames: number;
  probability: number;
}[] = [
  { name: 'Sore ankle', severity: 'minor', minGames: 1, maxGames: 3, probability: 0.3 },
  { name: 'Knee soreness', severity: 'minor', minGames: 2, maxGames: 5, probability: 0.2 },
  { name: 'Back spasms', severity: 'minor', minGames: 1, maxGames: 4, probability: 0.15 },
  { name: 'Quad strain', severity: 'moderate', minGames: 5, maxGames: 15, probability: 0.1 },
  { name: 'Hamstring strain', severity: 'moderate', minGames: 7, maxGames: 20, probability: 0.08 },
  { name: 'Calf strain', severity: 'moderate', minGames: 5, maxGames: 15, probability: 0.07 },
  { name: 'Sprained ankle', severity: 'moderate', minGames: 10, maxGames: 25, probability: 0.05 },
  { name: 'MCL sprain', severity: 'severe', minGames: 20, maxGames: 40, probability: 0.025 },
  { name: 'Shoulder injury', severity: 'severe', minGames: 15, maxGames: 35, probability: 0.02 },
  { name: 'ACL tear', severity: 'career-threatening', minGames: 50, maxGames: 82, probability: 0.005 },
  { name: 'Achilles rupture', severity: 'career-threatening', minGames: 60, maxGames: 82, probability: 0.003 },
];

export interface DevelopmentResult {
  playerId: string;
  playerName: string;
  changes: StatChange[];
  overallChange: number;
  newOverall: number;
  event?: string;
}

export interface StatChange {
  stat: keyof PlayerStats;
  oldValue: number;
  newValue: number;
  change: number;
}

// Age curve - determines development/decline rate
function getAgeCurve(age: number, peakAge: number): number {
  // Rapid improvement before 22
  if (age < 22) return 1.5;
  
  // Steady improvement approaching peak
  if (age < peakAge) return 1.0 + (peakAge - age) * 0.15;
  
  // At peak
  if (age === peakAge) return 0.5;
  
  // Gradual decline after peak
  const yearsAfterPeak = age - peakAge;
  if (yearsAfterPeak <= 3) return -0.3;
  if (yearsAfterPeak <= 5) return -0.6;
  if (yearsAfterPeak <= 7) return -1.0;
  
  // Sharp decline after 35+
  return -1.5;
}

// Develop a player for one season
export function developPlayer(
  player: Player,
  coach: Coach | null,
  playingTime: number, // minutes per game
  teamSuccess: number  // win percentage
): DevelopmentResult {
  const changes: StatChange[] = [];
  const ageCurve = getAgeCurve(player.age, player.peakAge);
  
  // Work ethic affects development rate
  const workEthicMultiplier = 0.5 + (player.stats.workEthic / 100);
  
  // Coach impact
  const coachBonus = coach ? coach.playerDevelopment / 200 : 0;
  
  // Playing time impact (more minutes = more development, especially for young)
  const playingTimeBonus = player.age < 25 ? Math.min(0.3, playingTime / 100) : 0;
  
  // Base development rate
  let developmentRate = ageCurve * workEthicMultiplier * (1 + coachBonus + playingTimeBonus);
  
  // Add randomness
  developmentRate += (Math.random() - 0.5) * 0.5;
  
  // Physical stats (speed, strength, jumping, endurance)
  const physicalStats: (keyof PlayerStats)[] = ['speed', 'strength', 'jumping', 'endurance'];
  for (const stat of physicalStats) {
    let change = developmentRate * (Math.random() * 0.5 + 0.5);
    
    // Physical attributes decline faster after 30
    if (player.age > 30 && stat === 'speed') {
      change -= 0.5;
    }
    if (player.age > 32 && stat === 'jumping') {
      change -= 0.3;
    }
    
    const oldValue = player.stats[stat];
    const newValue = Math.max(30, Math.min(99, oldValue + change));
    
    if (Math.abs(newValue - oldValue) >= 0.5) {
      changes.push({ stat, oldValue: Math.round(oldValue), newValue: Math.round(newValue), change: Math.round(change) });
      (player.stats[stat] as number) = newValue;
    }
  }
  
  // Skill stats (shooting, ball handling, etc.)
  const skillStats: (keyof PlayerStats)[] = [
    'insideScoring', 'midRange', 'threePoint', 'freeThrow',
    'ballHandling', 'passing'
  ];
  for (const stat of skillStats) {
    let change = developmentRate * (Math.random() * 0.6 + 0.4);
    
    // Skills can improve longer but cap effects at older ages
    if (player.age > 28) {
      change *= 0.8;
    }
    if (player.age > 32) {
      change *= 0.5;
    }
    
    // Experience can improve these even in decline
    if (player.age >= player.peakAge && player.age <= player.peakAge + 2) {
      change = Math.max(0, change);
    }
    
    const oldValue = player.stats[stat];
    const newValue = Math.max(30, Math.min(99, oldValue + change));
    
    if (Math.abs(newValue - oldValue) >= 0.5) {
      changes.push({ stat, oldValue: Math.round(oldValue), newValue: Math.round(newValue), change: Math.round(change) });
      (player.stats[stat] as number) = newValue;
    }
  }
  
  // Defensive stats
  const defenseStats: (keyof PlayerStats)[] = [
    'perimeterDefense', 'interiorDefense', 'stealing', 'blocking',
    'offensiveRebounding', 'defensiveRebounding'
  ];
  for (const stat of defenseStats) {
    let change = developmentRate * (Math.random() * 0.5 + 0.5);
    
    // Defense can be maintained longer with experience
    if (player.age > 30 && player.yearsExperience >= 8) {
      change = Math.max(-0.5, change);
    }
    
    // Blocking declines with athleticism
    if (stat === 'blocking' && player.age > 32) {
      change -= 0.5;
    }
    
    const oldValue = player.stats[stat];
    const newValue = Math.max(30, Math.min(99, oldValue + change));
    
    if (Math.abs(newValue - oldValue) >= 0.5) {
      changes.push({ stat, oldValue: Math.round(oldValue), newValue: Math.round(newValue), change: Math.round(change) });
      (player.stats[stat] as number) = newValue;
    }
  }
  
  // Basketball IQ can improve through career
  const iqChange = Math.min(2, Math.max(-0.5, player.yearsExperience * 0.1 + (Math.random() - 0.3)));
  const oldIQ = player.stats.basketballIQ;
  player.stats.basketballIQ = Math.min(99, oldIQ + iqChange);
  if (Math.abs(iqChange) >= 0.5) {
    changes.push({ 
      stat: 'basketballIQ', 
      oldValue: Math.round(oldIQ), 
      newValue: Math.round(player.stats.basketballIQ), 
      change: Math.round(iqChange) 
    });
  }
  
  // Recalculate overall
  const oldOverall = player.stats.overall;
  player.stats.overall = calculateOverall(player.stats);
  const overallChange = player.stats.overall - oldOverall;
  
  // Update morale based on development
  if (overallChange > 2) {
    player.morale.happiness = Math.min(100, player.morale.happiness + 5);
  } else if (overallChange < -2) {
    player.morale.happiness = Math.max(0, player.morale.happiness - 3);
  }
  
  // Generate development event
  let event: string | undefined;
  if (overallChange >= 5) {
    event = `${player.firstName} ${player.lastName} made a HUGE leap! (+${overallChange} OVR)`;
  } else if (overallChange >= 3) {
    event = `${player.firstName} ${player.lastName} improved significantly this offseason.`;
  } else if (overallChange <= -5) {
    event = `${player.firstName} ${player.lastName} showed major decline. (-${Math.abs(overallChange)} OVR)`;
  }
  
  return {
    playerId: player.id,
    playerName: `${player.firstName} ${player.lastName}`,
    changes,
    overallChange,
    newOverall: player.stats.overall,
    event
  };
}

// Process injury chance for a game
export function rollForInjury(
  player: Player,
  minutesPlayed: number
): Injury | null {
  // Base injury rate modified by durability and age
  let injuryChance = 0.005 * (minutesPlayed / 30);
  
  // Durability reduces injury chance
  injuryChance *= (150 - player.stats.durability) / 100;
  
  // Age increases injury risk
  if (player.age > 30) {
    injuryChance *= 1.2;
  }
  if (player.age > 34) {
    injuryChance *= 1.5;
  }
  
  // Previous injury increases re-injury risk
  if (player.injury && player.injury.recoveryProgress < 100) {
    injuryChance *= 2;
  }
  
  if (Math.random() > injuryChance) {
    return null;
  }
  
  // Determine injury type
  const roll = Math.random();
  let cumulative = 0;
  
  for (const injuryType of INJURY_TYPES) {
    cumulative += injuryType.probability;
    if (roll <= cumulative) {
      const games = Math.floor(
        injuryType.minGames + Math.random() * (injuryType.maxGames - injuryType.minGames)
      );
      
      return {
        type: injuryType.name,
        severity: injuryType.severity,
        gamesRemaining: games,
        recoveryProgress: 0
      };
    }
  }
  
  // Default minor injury
  return {
    type: 'General soreness',
    severity: 'minor',
    gamesRemaining: 1,
    recoveryProgress: 0
  };
}

// Process injury recovery
export function processInjuryRecovery(player: Player): boolean {
  if (!player.injury) return false;
  
  player.injury.gamesRemaining--;
  player.injury.recoveryProgress = Math.min(100, 
    player.injury.recoveryProgress + (100 / (player.injury.gamesRemaining + 1))
  );
  
  // Check if recovered
  if (player.injury.gamesRemaining <= 0) {
    // Career-threatening injuries may leave lasting effects
    if (player.injury.severity === 'career-threatening') {
      // Permanent stat reduction
      player.stats.speed = Math.max(40, player.stats.speed - 5);
      player.stats.jumping = Math.max(40, player.stats.jumping - 5);
      player.stats.overall = calculateOverall(player.stats);
    } else if (player.injury.severity === 'severe') {
      // Temporary reduction (will recover over time)
      player.stats.speed = Math.max(40, player.stats.speed - 2);
    }
    
    player.injury = null;
    return true;
  }
  
  return false;
}

// Update player morale
export function updateMorale(
  player: Player,
  team: Team,
  state: LeagueState,
  minutesPerGame: number
): void {
  const morale = player.morale;
  
  // Playing time satisfaction
  const expectedMinutes = player.stats.overall >= 80 ? 30 : 
                          player.stats.overall >= 70 ? 24 : 
                          player.stats.overall >= 60 ? 16 : 10;
  const minuteDiff = minutesPerGame - expectedMinutes;
  morale.factors.playingTime = Math.max(-20, Math.min(20, minuteDiff * 2));
  
  // Team success
  const winPct = team.wins / (team.wins + team.losses || 1);
  morale.factors.teamSuccess = (winPct - 0.5) * 40;
  
  // Coach relationship (random for now, could be expanded)
  if (team.coach) {
    const coachCompat = Math.random() * 20 - 10;
    morale.factors.coaching = coachCompat;
  }
  
  // Calculate overall happiness
  morale.happiness = Math.max(0, Math.min(100,
    50 + morale.factors.playingTime + 
    morale.factors.teamSuccess + 
    morale.factors.coaching + 
    morale.factors.cityPreference + 
    morale.factors.teammates
  ));
  
  // Trade desire based on unhappiness
  if (morale.happiness < 40) {
    morale.tradeDesire = Math.min(100, morale.tradeDesire + 10);
  } else if (morale.happiness > 70) {
    morale.tradeDesire = Math.max(0, morale.tradeDesire - 5);
  }
  
  // Loyalty affects trade desire
  morale.tradeDesire = Math.max(0, morale.tradeDesire - morale.loyalty * 0.2);
}

// Process end of season development for all players
export function processOffseasonDevelopment(
  state: LeagueState
): DevelopmentResult[] {
  const results: DevelopmentResult[] = [];
  const year = state.currentSeason.year;
  
  for (const player of Object.values(state.players)) {
    // Age the player
    player.age++;
    player.yearsExperience++;
    
    // Get playing time from season stats
    const seasonStats = player.seasonStats[year];
    const minutesPerGame = seasonStats?.minutesPerGame || 0;
    
    // Get team and coach
    const team = player.teamId ? state.teams[player.teamId] : null;
    const coach = team?.coach || null;
    const winPct = team ? team.wins / (team.wins + team.losses || 1) : 0.5;
    
    // Develop player
    const result = developPlayer(player, coach, minutesPerGame, winPct);
    
    // Update potential (decreases as player ages past peak)
    if (player.age > player.peakAge) {
      player.potential = Math.max(player.stats.overall, player.potential - 1);
    }
    
    // Update morale if on team
    if (team) {
      updateMorale(player, team, state, minutesPerGame);
    }
    
    if (result.changes.length > 0 || result.event) {
      results.push(result);
    }
  }
  
  // Sort by biggest changes
  results.sort((a, b) => Math.abs(b.overallChange) - Math.abs(a.overallChange));
  
  return results;
}

// Simulate training camp (small improvements before season)
export function processTrainingCamp(state: LeagueState): DevelopmentResult[] {
  const results: DevelopmentResult[] = [];
  
  for (const team of Object.values(state.teams)) {
    for (const playerId of team.roster) {
      const player = state.players[playerId];
      if (!player) continue;
      
      // Small random improvements (0-1 points)
      const improvement = Math.random() * 1.5;
      
      // Young players and high work ethic players improve more
      const multiplier = (player.age < 25 ? 1.3 : 1) * (player.stats.workEthic / 80);
      const change = improvement * multiplier;
      
      // Apply to random stat
      const improvableStats: (keyof PlayerStats)[] = [
        'threePoint', 'midRange', 'freeThrow', 'ballHandling', 'passing',
        'perimeterDefense', 'interiorDefense'
      ];
      const stat = improvableStats[Math.floor(Math.random() * improvableStats.length)];
      
      const oldValue = player.stats[stat];
      (player.stats[stat] as number) = Math.min(99, oldValue + change);
      
      const oldOverall = player.stats.overall;
      player.stats.overall = calculateOverall(player.stats);
      
      if (player.stats.overall > oldOverall) {
        results.push({
          playerId: player.id,
          playerName: `${player.firstName} ${player.lastName}`,
          changes: [{ stat, oldValue, newValue: player.stats[stat], change }],
          overallChange: player.stats.overall - oldOverall,
          newOverall: player.stats.overall
        });
      }
    }
  }
  
  return results.filter(r => r.overallChange >= 1);
}
