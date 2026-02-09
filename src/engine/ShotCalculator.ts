// Shot probability calculator based on physics research

import { Position2D, CourtPlayer, ShotType, COURT, ShotAttempt } from './types';

// Zone-based field goal percentages from NBA data
const ZONE_FG_PERCENTAGES: Record<string, number> = {
  restrictedArea: 0.65,
  lowPaint: 0.58,
  highPaint: 0.42,
  midRangeBaseline: 0.42,
  midRangeWing: 0.38,
  midRangeTop: 0.43,
  corner3: 0.40,
  wing3: 0.36,
  top3: 0.37,
};

export function getDistanceToBasket(pos: Position2D, isHomeTeam: boolean): number {
  const basketY = isHomeTeam ? COURT.basketYAway : COURT.basketYHome;
  return Math.sqrt(pos.x * pos.x + Math.pow(pos.y - basketY, 2));
}

export function getShotZone(pos: Position2D, isHomeTeam: boolean): string {
  const distance = getDistanceToBasket(pos, isHomeTeam);
  const basketY = isHomeTeam ? COURT.basketYAway : COURT.basketYHome;
  const relativeY = Math.abs(pos.y - basketY);
  
  // Restricted area (within 4 feet)
  if (distance <= COURT.restrictedAreaRadius) {
    return 'restrictedArea';
  }
  
  // Three-point territory
  if (distance >= COURT.threePointCorner) {
    // Corner three (within 3 feet of sideline)
    if (Math.abs(pos.x) >= (COURT.width / 2 - 3)) {
      return 'corner3';
    }
    // Wing or top
    if (relativeY < 15) {
      return 'wing3';
    }
    return 'top3';
  }
  
  // Paint
  if (Math.abs(pos.x) <= COURT.keyWidth / 2) {
    if (relativeY <= 8) {
      return 'lowPaint';
    }
    return 'highPaint';
  }
  
  // Mid-range
  if (relativeY < 8) {
    return 'midRangeBaseline';
  }
  if (relativeY < 15) {
    return 'midRangeWing';
  }
  return 'midRangeTop';
}

export function getShotType(distance: number, zone: string, playerDunking: number): ShotType {
  if (distance <= 2 && playerDunking >= 70) {
    return 'dunk';
  }
  if (distance <= 4) {
    return 'layup';
  }
  if (distance <= 10) {
    return 'floater';
  }
  if (zone.includes('3') || distance >= COURT.threePointCorner) {
    return 'three';
  }
  return 'midrange';
}

export function calculateContestLevel(
  shooter: CourtPlayer,
  defenders: CourtPlayer[]
): number {
  let maxContest = 0;
  
  for (const defender of defenders) {
    const dx = shooter.position.x - defender.position.x;
    const dy = shooter.position.y - defender.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    let contest = 0;
    if (distance < 2) {
      contest = 0.25; // Heavily contested
    } else if (distance < 4) {
      contest = 0.15; // Contested
    } else if (distance < 6) {
      contest = 0.08; // Lightly contested
    } else if (distance < 8) {
      contest = 0.03; // Open
    }
    // Wide open = 0
    
    // Defender skill modifier
    contest *= (defender.defense / 70);
    
    maxContest = Math.max(maxContest, contest);
  }
  
  return maxContest;
}

export function calculateShotProbability(
  shooter: CourtPlayer,
  defenders: CourtPlayer[],
  isHomeTeam: boolean
): ShotAttempt {
  const distance = getDistanceToBasket(shooter.position, isHomeTeam);
  const zone = getShotZone(shooter.position, isHomeTeam);
  const shotType = getShotType(distance, zone, shooter.shooting);
  
  // Base probability from zone
  let probability = ZONE_FG_PERCENTAGES[zone] || 0.40;
  
  // Player skill modifier (-0.15 to +0.15)
  const skillModifier = (shooter.shooting - 50) / 333;
  
  // Contest modifier
  const contestLevel = calculateContestLevel(shooter, defenders);
  
  // Fatigue penalty (up to 8%)
  const fatiguePenalty = (shooter.fatigue / 100) * 0.08;
  
  // Hot/cold streak
  let streakModifier = 0;
  if (shooter.isHot) streakModifier = 0.05;
  if (shooter.isCold) streakModifier = -0.05;
  
  // Shot type modifiers
  let typeModifier = 0;
  if (shotType === 'dunk') typeModifier = 0.30;
  if (shotType === 'layup') typeModifier = 0.05;
  if (shotType === 'floater') typeModifier = -0.05;
  
  probability = Math.max(0.05, Math.min(0.95,
    probability +
    skillModifier +
    typeModifier -
    contestLevel -
    fatiguePenalty +
    streakModifier
  ));
  
  // Determine points
  let points = 2;
  if (shotType === 'three') points = 3;
  if (shotType === 'ft') points = 1;
  
  // Roll for make/miss
  const made = Math.random() < probability;
  
  return {
    shooterId: shooter.playerId,
    position: { ...shooter.position },
    shotType,
    distance,
    contested: contestLevel > 0.1,
    contestLevel,
    probability,
    made,
    points: made ? points : 0,
  };
}

export function calculateFreeThrowProbability(shooter: CourtPlayer): number {
  // Base FT% scaled from shooting attribute
  let probability = 0.55 + (shooter.shooting / 100) * 0.35; // 55% to 90%
  
  // Fatigue penalty (smaller for FTs)
  probability -= (shooter.fatigue / 100) * 0.03;
  
  // Clutch situations could affect this
  
  return Math.max(0.40, Math.min(0.95, probability));
}

export function calculateBlockChance(
  shooter: CourtPlayer,
  blocker: CourtPlayer,
  shotType: ShotType
): number {
  // Can't block threes or FTs effectively
  if (shotType === 'three' || shotType === 'ft') {
    return 0.01;
  }
  
  const dx = shooter.position.x - blocker.position.x;
  const dy = shooter.position.y - blocker.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Must be close
  if (distance > 3) return 0.01;
  
  // Base block chance
  let chance = 0.05;
  
  // Blocker skill
  chance += (blocker.defense / 100) * 0.10;
  
  // Shot type (easier to block layups/dunks)
  if (shotType === 'layup') chance += 0.05;
  if (shotType === 'floater') chance -= 0.02;
  
  // Distance penalty
  chance *= (1 - distance / 3);
  
  return Math.max(0.01, Math.min(0.25, chance));
}
