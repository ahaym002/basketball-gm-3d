// ============================================
// Team Playstyle & Identity System
// ============================================

import { Team, Player, Coach, LeagueState } from '../types';
import { TeamStrategy, OffensiveSystem, DefensiveScheme } from './TeamStrategy';

// ==================== TEAM IDENTITY ====================
export type IdentityTrait = 
  | 'gritty-defense'      // Grind it out, physical defense
  | 'three-point-barrage' // Live and die by the three
  | 'fast-paced'          // Push tempo constantly
  | 'half-court-grind'    // Methodical, patient offense
  | 'star-driven'         // Let the stars cook
  | 'team-first'          // Move the ball, everyone contributes
  | 'rim-protectors'      // Elite shot blocking presence
  | 'switch-heavy'        // Modern switchable defense
  | 'clutch-performers'   // Rise in big moments
  | 'young-and-hungry'    // Athletic, energetic youth
  | 'veteran-savvy'       // Experience and smarts
  | 'home-court-dominance'// Nearly unbeatable at home
  | 'road-warriors'       // Tough on the road
  | 'streaky'             // Hot and cold
  | 'consistent'          // Steady performance
  | 'underdog-mentality'; // Chip on shoulder

export interface TeamIdentity {
  primaryTrait: IdentityTrait;
  secondaryTrait: IdentityTrait | null;
  traitStrength: number; // 0-100, how strongly the trait manifests
  developmentProgress: number; // 0-100, how established the identity is
  yearsBuilding: number;
  
  // Reputation
  leaguePerception: string; // How other teams/media see you
  fanbaseEnergy: number; // 0-100
  intimidationFactor: number; // 0-100
  
  // History
  identityHistory: { year: number; trait: IdentityTrait }[];
}

// ==================== STYLE COMPATIBILITY ====================
export interface StyleCompatibility {
  playerId: string;
  overallFit: number; // 0-100
  offensiveFit: number;
  defensiveFit: number;
  cultureFit: number;
  leadershipFit: number;
  issues: string[];
  strengths: string[];
}

export function calculateStyleCompatibility(
  player: Player,
  identity: TeamIdentity,
  strategy: TeamStrategy,
  coach: Coach
): StyleCompatibility {
  let offensiveFit = 50;
  let defensiveFit = 50;
  let cultureFit = 50;
  let leadershipFit = 50;
  const issues: string[] = [];
  const strengths: string[] = [];
  
  const stats = player.stats;
  
  // Check offensive system fit
  switch (strategy.offensiveSystem) {
    case 'pace-and-space':
    case 'seven-seconds':
      if (stats.threePoint >= 75) { offensiveFit += 15; strengths.push('Elite shooter'); }
      else if (stats.threePoint < 50) { offensiveFit -= 15; issues.push('Poor shooter in shooting-heavy system'); }
      if (stats.speed >= 70) offensiveFit += 5;
      break;
    case 'iso-heavy':
      if (stats.ballHandling >= 75 && stats.midRange >= 70) { offensiveFit += 20; strengths.push('Great iso scorer'); }
      break;
    case 'post-up':
      if (player.position === 'C' || player.position === 'PF') {
        if (stats.insideScoring >= 70) { offensiveFit += 15; strengths.push('Strong post presence'); }
      } else {
        if (stats.passing >= 70) offensiveFit += 5;
      }
      break;
    case 'motion':
    case 'princeton':
      if (stats.basketballIQ >= 70) { offensiveFit += 10; strengths.push('High IQ fits motion'); }
      if (stats.passing >= 70) offensiveFit += 10;
      if (stats.basketballIQ < 50) { offensiveFit -= 15; issues.push('Low IQ struggles in read-and-react'); }
      break;
    case 'pick-and-roll':
      if ((player.position === 'PG' || player.position === 'SG') && stats.ballHandling >= 75) {
        offensiveFit += 15;
        strengths.push('Excellent PnR ball handler');
      }
      if ((player.position === 'C' || player.position === 'PF') && stats.insideScoring >= 70) {
        offensiveFit += 10;
        strengths.push('Good roll man');
      }
      break;
  }
  
  // Check defensive scheme fit
  switch (strategy.defensiveScheme) {
    case 'switch-everything':
      if (stats.perimeterDefense >= 65 && stats.interiorDefense >= 50) {
        defensiveFit += 15;
        strengths.push('Versatile defender for switch scheme');
      } else if (player.position === 'C' && stats.perimeterDefense < 40) {
        defensiveFit -= 20;
        issues.push('Too slow to switch');
      }
      break;
    case 'drop-coverage':
      if (player.position === 'C' && stats.blocking >= 70) {
        defensiveFit += 15;
        strengths.push('Elite rim protector for drop');
      }
      break;
    case 'aggressive-hedge':
      if (stats.speed >= 75 && stats.perimeterDefense >= 70) {
        defensiveFit += 15;
        strengths.push('Quick enough for aggressive schemes');
      }
      break;
    case 'zone-2-3':
      if (stats.basketballIQ >= 65) defensiveFit += 5;
      if (stats.defensiveRebounding >= 70) defensiveFit += 10;
      break;
    case 'pack-the-paint':
      if (player.position === 'C' || player.position === 'PF') {
        if (stats.blocking >= 60 && stats.interiorDefense >= 60) defensiveFit += 15;
      }
      break;
  }
  
  // Identity trait compatibility
  switch (identity.primaryTrait) {
    case 'gritty-defense':
      if (stats.perimeterDefense + stats.interiorDefense >= 140) {
        cultureFit += 20;
        strengths.push('Defensive mentality matches team');
      }
      break;
    case 'three-point-barrage':
      if (stats.threePoint >= 75) {
        cultureFit += 20;
        strengths.push('Shooter fits the identity');
      } else if (stats.threePoint < 50) {
        cultureFit -= 10;
        issues.push('Non-shooter on shooting team');
      }
      break;
    case 'fast-paced':
      if (stats.speed >= 75 && stats.endurance >= 70) {
        cultureFit += 15;
        strengths.push('Athletic enough for uptempo style');
      }
      break;
    case 'star-driven':
      if (stats.overall >= 85) cultureFit += 10;
      break;
    case 'team-first':
      if (stats.passing >= 70 && player.morale.happiness >= 60) {
        cultureFit += 15;
      }
      break;
    case 'young-and-hungry':
      if (player.age <= 25) cultureFit += 15;
      if (player.age >= 32) { cultureFit -= 10; issues.push('Veteran on young team'); }
      break;
    case 'veteran-savvy':
      if (player.age >= 28) cultureFit += 10;
      if (player.yearsExperience >= 8) cultureFit += 5;
      break;
    case 'clutch-performers':
      if (stats.clutch >= 75) {
        cultureFit += 20;
        strengths.push('Big-game player');
      }
      break;
  }
  
  // Coach compatibility
  if (coach.style === 'offensive' && stats.insideScoring + stats.threePoint + stats.midRange > 200) {
    leadershipFit += 10;
  }
  if (coach.style === 'defensive' && stats.perimeterDefense + stats.interiorDefense > 130) {
    leadershipFit += 10;
  }
  if (coach.playerDevelopment >= 75 && player.age <= 24) {
    leadershipFit += 10;
    strengths.push('Good development environment');
  }
  
  // Morale and personality factors
  if (player.morale.happiness < 40) {
    cultureFit -= 20;
    issues.push('Unhappy with current situation');
  }
  if (player.morale.tradeDesire > 70) {
    cultureFit -= 15;
    issues.push('Wants out');
  }
  
  offensiveFit = Math.max(0, Math.min(100, offensiveFit));
  defensiveFit = Math.max(0, Math.min(100, defensiveFit));
  cultureFit = Math.max(0, Math.min(100, cultureFit));
  leadershipFit = Math.max(0, Math.min(100, leadershipFit));
  
  const overallFit = Math.round(
    offensiveFit * 0.35 + 
    defensiveFit * 0.25 + 
    cultureFit * 0.25 + 
    leadershipFit * 0.15
  );
  
  return {
    playerId: player.id,
    overallFit,
    offensiveFit,
    defensiveFit,
    cultureFit,
    leadershipFit,
    issues,
    strengths
  };
}

// ==================== HOME COURT ADVANTAGE ====================
export interface HomeCourtAdvantage {
  baseAdvantage: number; // 0-20 point swing
  crowdIntensity: number; // 0-100
  altitudeAdvantage: number; // For Denver, etc.
  arenaIntimidation: number; // 0-100
  
  // Affected by identity
  identityBonus: number;
  streakBonus: number;
  
  // Total multiplier for game simulation
  totalAdvantage: number;
}

const ALTITUDE_CITIES = ['DEN'];
const LOUD_ARENAS = ['GSW', 'UTA', 'OKC', 'MIL', 'BOS', 'PHX', 'MEM'];

export function calculateHomeCourtAdvantage(
  team: Team,
  identity: TeamIdentity,
  currentStreak: number
): HomeCourtAdvantage {
  let baseAdvantage = 3.5; // Standard NBA HCA
  let crowdIntensity = 60;
  let altitudeAdvantage = 0;
  let arenaIntimidation = 50;
  let identityBonus = 0;
  let streakBonus = 0;
  
  // Altitude
  if (ALTITUDE_CITIES.includes(team.id)) {
    altitudeAdvantage = 1.5;
  }
  
  // Loud arenas
  if (LOUD_ARENAS.includes(team.id)) {
    crowdIntensity += 20;
    arenaIntimidation += 15;
  }
  
  // Big markets
  const bigMarkets = ['LAL', 'NYK', 'BOS', 'CHI', 'GSW'];
  if (bigMarkets.includes(team.id)) {
    crowdIntensity += 10;
  }
  
  // Identity bonuses
  if (identity.primaryTrait === 'home-court-dominance') {
    identityBonus = identity.traitStrength * 0.03;
    crowdIntensity += 15;
    arenaIntimidation += 20;
  }
  
  // Win streak at home
  if (currentStreak > 0) {
    streakBonus = Math.min(2, currentStreak * 0.2);
    crowdIntensity = Math.min(100, crowdIntensity + currentStreak * 3);
  }
  
  // Fanbase energy from identity
  crowdIntensity = Math.min(100, crowdIntensity + identity.fanbaseEnergy * 0.2);
  
  // Team success affects crowd
  const winPct = team.wins / Math.max(1, team.wins + team.losses);
  if (winPct > 0.6) {
    crowdIntensity = Math.min(100, crowdIntensity + 10);
  }
  
  const totalAdvantage = baseAdvantage + 
    altitudeAdvantage + 
    identityBonus + 
    streakBonus + 
    (crowdIntensity / 100) + 
    (arenaIntimidation / 200);
  
  return {
    baseAdvantage,
    crowdIntensity: Math.round(crowdIntensity),
    altitudeAdvantage,
    arenaIntimidation: Math.round(arenaIntimidation),
    identityBonus,
    streakBonus,
    totalAdvantage
  };
}

// ==================== IDENTITY DEVELOPMENT ====================
export function createInitialIdentity(team: Team, players: Player[]): TeamIdentity {
  // Determine initial trait based on team characteristics
  let primaryTrait: IdentityTrait = 'team-first';
  
  const avgAge = players.reduce((sum, p) => sum + p.age, 0) / players.length;
  const starCount = players.filter(p => p.stats.overall >= 85).length;
  const avgDefense = players.reduce((sum, p) => sum + p.stats.perimeterDefense + p.stats.interiorDefense, 0) / players.length / 2;
  const avgThree = players.reduce((sum, p) => sum + p.stats.threePoint, 0) / players.length;
  
  if (starCount >= 2) {
    primaryTrait = 'star-driven';
  } else if (avgDefense >= 70) {
    primaryTrait = 'gritty-defense';
  } else if (avgThree >= 72) {
    primaryTrait = 'three-point-barrage';
  } else if (avgAge <= 25) {
    primaryTrait = 'young-and-hungry';
  } else if (avgAge >= 29) {
    primaryTrait = 'veteran-savvy';
  }
  
  return {
    primaryTrait,
    secondaryTrait: null,
    traitStrength: 30, // Start weak, develops over time
    developmentProgress: 0,
    yearsBuilding: 0,
    leaguePerception: 'Unknown quantity',
    fanbaseEnergy: 50,
    intimidationFactor: 30,
    identityHistory: []
  };
}

export function developIdentity(
  identity: TeamIdentity,
  team: Team,
  strategy: TeamStrategy,
  seasonResult: { wins: number; playoffRounds: number }
): TeamIdentity {
  const updated = { ...identity };
  
  // Development progress
  updated.developmentProgress = Math.min(100, identity.developmentProgress + 15);
  updated.yearsBuilding++;
  
  // Trait strength grows with consistency
  if (identity.yearsBuilding >= 2) {
    updated.traitStrength = Math.min(100, identity.traitStrength + 10);
  }
  
  // Success breeds intimidation
  if (seasonResult.wins >= 50) {
    updated.intimidationFactor = Math.min(100, identity.intimidationFactor + 10);
  }
  if (seasonResult.playoffRounds >= 3) {
    updated.intimidationFactor = Math.min(100, identity.intimidationFactor + 15);
  }
  
  // Fanbase energy based on performance and identity establishment
  if (seasonResult.wins >= 45) {
    updated.fanbaseEnergy = Math.min(100, identity.fanbaseEnergy + 5);
  } else if (seasonResult.wins <= 30) {
    updated.fanbaseEnergy = Math.max(20, identity.fanbaseEnergy - 5);
  }
  
  // Update perception
  if (seasonResult.wins >= 55 && seasonResult.playoffRounds >= 3) {
    updated.leaguePerception = 'Championship contender';
  } else if (seasonResult.wins >= 45) {
    updated.leaguePerception = 'Playoff team';
  } else if (seasonResult.wins >= 35) {
    updated.leaguePerception = 'Fringe playoff team';
  } else if (updated.yearsBuilding <= 2) {
    updated.leaguePerception = 'Rebuilding';
  } else {
    updated.leaguePerception = 'Lottery team';
  }
  
  return updated;
}

export function canDevelopSecondaryTrait(identity: TeamIdentity): boolean {
  return identity.developmentProgress >= 50 && identity.traitStrength >= 60 && !identity.secondaryTrait;
}

export function addSecondaryTrait(identity: TeamIdentity, trait: IdentityTrait): TeamIdentity {
  if (trait === identity.primaryTrait) return identity;
  
  return {
    ...identity,
    secondaryTrait: trait,
    identityHistory: [
      ...identity.identityHistory,
      { year: new Date().getFullYear(), trait }
    ]
  };
}

// ==================== IDENTITY EFFECTS ON GAMEPLAY ====================
export function getIdentityGameplayEffects(identity: TeamIdentity): {
  offensiveBoost: number;
  defensiveBoost: number;
  clutchBoost: number;
  fatigueResistance: number;
  homeBoost: number;
  awayBoost: number;
} {
  const base = {
    offensiveBoost: 0,
    defensiveBoost: 0,
    clutchBoost: 0,
    fatigueResistance: 0,
    homeBoost: 0,
    awayBoost: 0
  };
  
  const strength = identity.traitStrength / 100;
  
  switch (identity.primaryTrait) {
    case 'gritty-defense':
      base.defensiveBoost = 5 * strength;
      base.fatigueResistance = 3 * strength;
      break;
    case 'three-point-barrage':
      base.offensiveBoost = 4 * strength;
      break;
    case 'fast-paced':
      base.offensiveBoost = 3 * strength;
      base.fatigueResistance = -2 * strength; // More tired
      break;
    case 'clutch-performers':
      base.clutchBoost = 8 * strength;
      break;
    case 'home-court-dominance':
      base.homeBoost = 6 * strength;
      break;
    case 'road-warriors':
      base.awayBoost = 5 * strength;
      break;
    case 'underdog-mentality':
      base.clutchBoost = 4 * strength;
      base.awayBoost = 3 * strength;
      break;
    case 'veteran-savvy':
      base.clutchBoost = 3 * strength;
      base.fatigueResistance = 2 * strength;
      break;
    case 'young-and-hungry':
      base.fatigueResistance = 4 * strength;
      break;
  }
  
  return base;
}
