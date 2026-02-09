// Player movement physics for 2D court

import { Position2D, Velocity2D, CourtPlayer, COURT } from './types';

// Speed constants (feet per second)
const BASE_SPEEDS: Record<string, { topSpeed: number; acceleration: number }> = {
  PG: { topSpeed: 26, acceleration: 15 },
  SG: { topSpeed: 25, acceleration: 14 },
  SF: { topSpeed: 24, acceleration: 13 },
  PF: { topSpeed: 22, acceleration: 11 },
  C: { topSpeed: 20, acceleration: 9 },
};

const LATERAL_SPEED_MULTIPLIER = 0.65; // Defensive slide is slower
const FRICTION = 0.92;

export function normalizeVector(v: { x: number; y: number }): { x: number; y: number } {
  const mag = Math.sqrt(v.x * v.x + v.y * v.y);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: v.x / mag, y: v.y / mag };
}

export function distance(p1: Position2D, p2: Position2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getPlayerTopSpeed(player: CourtPlayer, isDefending: boolean): number {
  // Base speed from position archetype
  const baseSpeed = 22 + (player.speed / 100) * 6; // 22-28 ft/s
  
  // Fatigue penalty (up to 15%)
  const fatiguePenalty = (player.fatigue / 100) * 0.15;
  
  // Defensive slide is slower
  const defensiveMultiplier = isDefending ? LATERAL_SPEED_MULTIPLIER : 1;
  
  return baseSpeed * (1 - fatiguePenalty) * defensiveMultiplier;
}

export function movePlayerToward(
  player: CourtPlayer,
  target: Position2D,
  dt: number, // delta time in seconds
  isDefending: boolean = false
): void {
  const dx = target.x - player.position.x;
  const dy = target.y - player.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist < 0.5) {
    // Close enough, stop
    player.velocity.vx *= FRICTION;
    player.velocity.vy *= FRICTION;
    return;
  }
  
  // Normalize direction
  const dirX = dx / dist;
  const dirY = dy / dist;
  
  // Acceleration
  const acceleration = 12 + (player.speed / 100) * 6;
  player.velocity.vx += dirX * acceleration * dt;
  player.velocity.vy += dirY * acceleration * dt;
  
  // Clamp to top speed
  const topSpeed = getPlayerTopSpeed(player, isDefending);
  const currentSpeed = Math.sqrt(
    player.velocity.vx * player.velocity.vx +
    player.velocity.vy * player.velocity.vy
  );
  
  if (currentSpeed > topSpeed) {
    player.velocity.vx = (player.velocity.vx / currentSpeed) * topSpeed;
    player.velocity.vy = (player.velocity.vy / currentSpeed) * topSpeed;
  }
  
  // Update position
  player.position.x += player.velocity.vx * dt;
  player.position.y += player.velocity.vy * dt;
  
  // Keep in bounds
  player.position.x = clamp(player.position.x, -COURT.width / 2 + 1, COURT.width / 2 - 1);
  player.position.y = clamp(player.position.y, -COURT.halfLength + 1, COURT.halfLength - 1);
}

export function resolvePlayerCollision(p1: CourtPlayer, p2: CourtPlayer): void {
  const dx = p2.position.x - p1.position.x;
  const dy = p2.position.y - p1.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = 1.5; // Player body width in feet
  
  if (dist < minDist && dist > 0) {
    // Push players apart
    const overlap = minDist - dist;
    const nx = dx / dist;
    const ny = dy / dist;
    
    // Mass-based push (stronger player moves less)
    const totalStrength = p1.strength + p2.strength;
    const ratio1 = p2.strength / totalStrength;
    const ratio2 = p1.strength / totalStrength;
    
    p1.position.x -= nx * overlap * ratio1 * 0.5;
    p1.position.y -= ny * overlap * ratio1 * 0.5;
    p2.position.x += nx * overlap * ratio2 * 0.5;
    p2.position.y += ny * overlap * ratio2 * 0.5;
    
    // Dampen velocities
    p1.velocity.vx *= 0.7;
    p1.velocity.vy *= 0.7;
    p2.velocity.vx *= 0.7;
    p2.velocity.vy *= 0.7;
  }
}

export function getDefensivePosition(
  defender: CourtPlayer,
  ballHandler: CourtPlayer,
  basketY: number
): Position2D {
  // Position between ball handler and basket
  const toBasket = {
    x: 0 - ballHandler.position.x,
    y: basketY - ballHandler.position.y,
  };
  const norm = normalizeVector(toBasket);
  
  // Stay 3-4 feet from ball handler toward basket
  return {
    x: ballHandler.position.x + norm.x * 3.5,
    y: ballHandler.position.y + norm.y * 3.5,
  };
}

export function getHelpDefensePosition(
  defender: CourtPlayer,
  assignment: CourtPlayer,
  ballHandler: CourtPlayer,
  basketY: number
): Position2D {
  // Split the difference between assignment and ball
  const midX = (assignment.position.x + ballHandler.position.x) / 2;
  const midY = (assignment.position.y + ballHandler.position.y) / 2;
  
  // Shade toward basket
  const toBasket = normalizeVector({
    x: 0 - midX,
    y: basketY - midY,
  });
  
  return {
    x: midX + toBasket.x * 2,
    y: midY + toBasket.y * 2,
  };
}

export function generateOffensivePositions(
  isHomeTeam: boolean,
  playType: string
): Position2D[] {
  const basketY = isHomeTeam ? COURT.basketYAway : COURT.basketYHome;
  const direction = isHomeTeam ? 1 : -1;
  
  // Base positions for motion offense
  const positions: Position2D[] = [
    { x: 0, y: basketY - 25 * direction },      // Point guard at top
    { x: 15, y: basketY - 20 * direction },     // Shooting guard wing
    { x: -15, y: basketY - 20 * direction },    // Small forward wing
    { x: 8, y: basketY - 10 * direction },      // Power forward high post
    { x: -4, y: basketY - 5 * direction },      // Center low post
  ];
  
  // Add some randomness
  return positions.map(p => ({
    x: p.x + (Math.random() - 0.5) * 4,
    y: p.y + (Math.random() - 0.5) * 4,
  }));
}

export function generateDefensivePositions(
  offensivePositions: Position2D[],
  basketY: number
): Position2D[] {
  return offensivePositions.map(offPos => 
    getDefensivePosition(
      { position: offPos } as CourtPlayer,
      { position: offPos } as CourtPlayer,
      basketY
    )
  );
}

export function updateFatigue(player: CourtPlayer, dt: number, isActive: boolean): void {
  // Active play drains stamina faster
  const drainRate = isActive ? 0.02 : 0.005;
  const recoveryRate = 0.001;
  
  const speed = Math.sqrt(
    player.velocity.vx * player.velocity.vx +
    player.velocity.vy * player.velocity.vy
  );
  
  if (speed > 5) {
    // Running
    player.fatigue += drainRate * dt * (speed / 10);
  } else {
    // Resting/walking
    player.fatigue -= recoveryRate * dt * 60;
  }
  
  player.fatigue = clamp(player.fatigue, 0, 100);
}
