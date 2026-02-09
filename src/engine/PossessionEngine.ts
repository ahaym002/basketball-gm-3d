// Possession simulation engine

import {
  MatchState,
  CourtPlayer,
  PossessionResult,
  PlayByPlayEntry,
  TeamTactics,
  ShotType,
  SHOT_CLOCK,
  COURT,
} from './types';
import {
  calculateShotProbability,
  calculateFreeThrowProbability,
  calculateBlockChance,
  getDistanceToBasket,
  getShotZone,
} from './ShotCalculator';
import { distance } from './PlayerMovement';

type PossessionAction = 'shoot' | 'pass' | 'drive' | 'post' | 'turnover';

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function getTeamPlayers(state: MatchState, teamId: string): CourtPlayer[] {
  const team = state.homeTeam.teamId === teamId ? state.homeTeam : state.awayTeam;
  return team.onCourt.map(id => state.players[id]).filter(Boolean);
}

function getOpponentPlayers(state: MatchState, teamId: string): CourtPlayer[] {
  const oppTeam = state.homeTeam.teamId === teamId ? state.awayTeam : state.homeTeam;
  return oppTeam.onCourt.map(id => state.players[id]).filter(Boolean);
}

function getBallHandler(state: MatchState): CourtPlayer | null {
  if (!state.ball.holder) return null;
  return state.players[state.ball.holder] || null;
}

function createPlayByPlayEntry(
  state: MatchState,
  teamId: string,
  action: PlayByPlayEntry['action'],
  description: string,
  playerId?: string,
  secondaryPlayerId?: string,
  isImportant: boolean = false
): PlayByPlayEntry {
  return {
    id: generateId(),
    quarter: state.clock.quarter,
    time: state.clock.timeRemaining,
    teamId,
    playerId,
    secondaryPlayerId,
    action,
    description,
    homeScore: state.homeTeam.score,
    awayScore: state.awayTeam.score,
    isImportant,
  };
}

function decideAction(
  ballHandler: CourtPlayer,
  teammates: CourtPlayer[],
  defenders: CourtPlayer[],
  tactics: TeamTactics,
  shotClock: number,
  isHomeTeam: boolean
): PossessionAction {
  const distToBasket = getDistanceToBasket(ballHandler.position, isHomeTeam);
  const zone = getShotZone(ballHandler.position, isHomeTeam);
  
  // Find closest defender
  const closestDefender = defenders.reduce((closest, def) => {
    const d = distance(ballHandler.position, def.position);
    return d < distance(ballHandler.position, closest.position) ? def : closest;
  }, defenders[0]);
  
  const defenderDist = closestDefender
    ? distance(ballHandler.position, closestDefender.position)
    : 10;
  
  // Shot clock pressure
  if (shotClock <= 4) {
    return 'shoot'; // Forced shot
  }
  
  // Turnover chance (higher under pressure)
  const turnoverChance = 0.02 + (defenderDist < 3 ? 0.05 : 0);
  if (Math.random() < turnoverChance) {
    return 'turnover';
  }
  
  // Open shot opportunity
  if (defenderDist > 6 && ballHandler.shooting > 60) {
    if (zone.includes('3') && Math.random() < 0.7) {
      return 'shoot';
    }
    if (distToBasket < 18 && Math.random() < 0.5) {
      return 'shoot';
    }
  }
  
  // Tactics influence
  if (tactics.offenseFocus === 'perimeter' && zone.includes('3')) {
    if (defenderDist > 4 && Math.random() < 0.6) {
      return 'shoot';
    }
  }
  
  if (tactics.offenseFocus === 'inside') {
    if (distToBasket > 15) {
      return Math.random() < 0.6 ? 'drive' : 'pass';
    }
    if (distToBasket < 8 && defenderDist > 3) {
      return 'shoot';
    }
  }
  
  // Close to basket
  if (distToBasket < 6 && defenderDist > 2) {
    return 'shoot';
  }
  
  // Post up opportunity
  if (distToBasket < 12 && ballHandler.strength > 70) {
    if (Math.random() < 0.3) {
      return 'post';
    }
  }
  
  // Drive to basket
  if (ballHandler.speed > 70 && defenderDist > 2 && distToBasket > 10) {
    if (Math.random() < 0.35) {
      return 'drive';
    }
  }
  
  // Default to passing
  return 'pass';
}

function findOpenTeammate(
  ballHandler: CourtPlayer,
  teammates: CourtPlayer[],
  defenders: CourtPlayer[]
): CourtPlayer | null {
  let bestTarget: CourtPlayer | null = null;
  let bestScore = -1;
  
  for (const teammate of teammates) {
    if (teammate.playerId === ballHandler.playerId) continue;
    
    // Find closest defender to teammate
    let minDefDist = 100;
    for (const def of defenders) {
      const d = distance(teammate.position, def.position);
      minDefDist = Math.min(minDefDist, d);
    }
    
    // Score based on openness
    const score = minDefDist * 10 + teammate.shooting;
    if (score > bestScore) {
      bestScore = score;
      bestTarget = teammate;
    }
  }
  
  return bestTarget;
}

function simulateDrive(
  driver: CourtPlayer,
  defenders: CourtPlayer[],
  isHomeTeam: boolean
): { success: boolean; fouled: boolean; newPos: { x: number; y: number } } {
  const basketY = isHomeTeam ? COURT.basketYAway : COURT.basketYHome;
  
  // Move toward basket
  const direction = {
    x: 0 - driver.position.x,
    y: basketY - driver.position.y,
  };
  const mag = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
  
  // Drive 5-10 feet toward basket
  const driveDistance = 5 + Math.random() * 5;
  const newPos = {
    x: driver.position.x + (direction.x / mag) * driveDistance,
    y: driver.position.y + (direction.y / mag) * driveDistance,
  };
  
  // Check if blocked by defender
  let blocked = false;
  let fouled = false;
  
  for (const def of defenders) {
    const defDist = distance(newPos, def.position);
    if (defDist < 2) {
      // Contact!
      const blockChance = 0.15 + (def.defense / 200);
      const foulChance = 0.10 + (1 - def.defense / 100) * 0.15;
      
      if (Math.random() < blockChance) {
        blocked = true;
      } else if (Math.random() < foulChance) {
        fouled = true;
      }
    }
  }
  
  return {
    success: !blocked,
    fouled,
    newPos: blocked ? driver.position : newPos,
  };
}

export function simulatePossession(state: MatchState): PossessionResult {
  const offenseTeam = state.homeTeam.possession ? state.homeTeam : state.awayTeam;
  const defenseTeam = state.homeTeam.possession ? state.awayTeam : state.homeTeam;
  const tactics = state.homeTeam.possession ? state.homeTactics : state.awayTactics;
  const isHomeTeam = state.homeTeam.possession;
  
  const offensePlayers = getTeamPlayers(state, offenseTeam.teamId);
  const defensePlayers = getTeamPlayers(state, defenseTeam.teamId);
  
  const playByPlay: PlayByPlayEntry[] = [];
  let shotClock = state.clock.shotClock;
  
  // Pick initial ball handler (usually PG)
  let ballHandler = offensePlayers[0];
  for (const p of offensePlayers) {
    if (p.hasBall) {
      ballHandler = p;
      break;
    }
  }
  
  // Simulate possession actions
  let possessionComplete = false;
  let result: PossessionResult = {
    outcome: 'missed',
    points: 0,
    playByPlay,
  };
  
  let actionCount = 0;
  const maxActions = 8;
  
  while (!possessionComplete && actionCount < maxActions) {
    actionCount++;
    shotClock -= 2 + Math.random() * 3; // 2-5 seconds per action
    
    if (shotClock <= 0) {
      // Shot clock violation
      result.outcome = 'turnover';
      playByPlay.push(createPlayByPlayEntry(
        state,
        offenseTeam.teamId,
        'turnover',
        'Shot clock violation',
        ballHandler.playerId
      ));
      possessionComplete = true;
      break;
    }
    
    const action = decideAction(
      ballHandler,
      offensePlayers,
      defensePlayers,
      tactics,
      shotClock,
      isHomeTeam
    );
    
    switch (action) {
      case 'shoot': {
        const shot = calculateShotProbability(ballHandler, defensePlayers, isHomeTeam);
        
        // Check for block
        const nearestDefender = defensePlayers.reduce((closest, def) => {
          const d = distance(ballHandler.position, def.position);
          return d < distance(ballHandler.position, closest.position) ? def : closest;
        }, defensePlayers[0]);
        
        const blockChance = calculateBlockChance(ballHandler, nearestDefender, shot.shotType);
        const blocked = Math.random() < blockChance;
        
        if (blocked) {
          playByPlay.push(createPlayByPlayEntry(
            state,
            defenseTeam.teamId,
            'block',
            `${nearestDefender.playerId} blocks ${ballHandler.playerId}'s shot!`,
            nearestDefender.playerId,
            ballHandler.playerId,
            true
          ));
          
          // Loose ball - 50% each team
          if (Math.random() < 0.5) {
            result.outcome = 'turnover';
          } else {
            // Offense retains, continue possession
            shotClock = SHOT_CLOCK;
            continue;
          }
        } else if (shot.made) {
          result.outcome = 'made';
          result.points = shot.points;
          result.shooter = ballHandler.playerId;
          result.shotType = shot.shotType;
          
          const shotDesc = shot.shotType === 'three'
            ? 'hits a three-pointer!'
            : shot.shotType === 'dunk'
            ? 'throws it down!'
            : shot.shotType === 'layup'
            ? 'finishes at the rim!'
            : 'hits the jumper!';
          
          playByPlay.push(createPlayByPlayEntry(
            state,
            offenseTeam.teamId,
            shot.shotType === 'three' ? 'made_three' : 'made_shot',
            `${ballHandler.playerId} ${shotDesc} (${shot.points} pts)`,
            ballHandler.playerId,
            undefined,
            shot.points === 3
          ));
          
          // Credit assist if recent pass
          if (actionCount > 1 && Math.random() < 0.6) {
            const passer = offensePlayers.find(p => p.playerId !== ballHandler.playerId);
            if (passer) {
              result.assister = passer.playerId;
              playByPlay.push(createPlayByPlayEntry(
                state,
                offenseTeam.teamId,
                'assist',
                `Assist: ${passer.playerId}`,
                passer.playerId,
                ballHandler.playerId
              ));
            }
          }
        } else {
          // Missed shot - rebound
          const offRebChance = 0.22 + (offensePlayers.reduce((sum, p) => sum + p.strength, 0) / 500) * 0.1;
          const offRebound = Math.random() < offRebChance;
          
          playByPlay.push(createPlayByPlayEntry(
            state,
            offenseTeam.teamId,
            shot.shotType === 'three' ? 'missed_three' : 'missed_shot',
            `${ballHandler.playerId} misses the ${shot.shotType === 'three' ? 'three' : 'shot'}`,
            ballHandler.playerId
          ));
          
          if (offRebound) {
            const rebounder = offensePlayers[Math.floor(Math.random() * offensePlayers.length)];
            result.rebounder = rebounder.playerId;
            shotClock = SHOT_CLOCK;
            ballHandler = rebounder;
            
            playByPlay.push(createPlayByPlayEntry(
              state,
              offenseTeam.teamId,
              'offensive_rebound',
              `Offensive rebound by ${rebounder.playerId}`,
              rebounder.playerId
            ));
            continue; // Continue possession
          } else {
            const rebounder = defensePlayers[Math.floor(Math.random() * defensePlayers.length)];
            result.rebounder = rebounder.playerId;
            result.outcome = 'missed';
            
            playByPlay.push(createPlayByPlayEntry(
              state,
              defenseTeam.teamId,
              'defensive_rebound',
              `Defensive rebound by ${rebounder.playerId}`,
              rebounder.playerId
            ));
          }
        }
        possessionComplete = true;
        break;
      }
      
      case 'pass': {
        const target = findOpenTeammate(ballHandler, offensePlayers, defensePlayers);
        if (target) {
          // Check for steal
          const stealChance = 0.03 + (defensePlayers.reduce((max, d) => 
            Math.max(max, d.defense), 0) / 100) * 0.04;
          
          if (Math.random() < stealChance) {
            const stealer = defensePlayers[Math.floor(Math.random() * defensePlayers.length)];
            result.outcome = 'turnover';
            
            playByPlay.push(createPlayByPlayEntry(
              state,
              defenseTeam.teamId,
              'steal',
              `${stealer.playerId} steals the pass!`,
              stealer.playerId,
              ballHandler.playerId,
              true
            ));
            possessionComplete = true;
          } else {
            ballHandler = target;
          }
        }
        break;
      }
      
      case 'drive': {
        const driveResult = simulateDrive(ballHandler, defensePlayers, isHomeTeam);
        
        if (driveResult.fouled) {
          // Shooting foul
          const fouler = defensePlayers[Math.floor(Math.random() * defensePlayers.length)];
          result.fouler = fouler.playerId;
          
          playByPlay.push(createPlayByPlayEntry(
            state,
            defenseTeam.teamId,
            'foul',
            `Foul by ${fouler.playerId} on the drive`,
            fouler.playerId,
            ballHandler.playerId
          ));
          
          // Free throws
          const ft1 = Math.random() < calculateFreeThrowProbability(ballHandler);
          const ft2 = Math.random() < calculateFreeThrowProbability(ballHandler);
          
          result.points = (ft1 ? 1 : 0) + (ft2 ? 1 : 0);
          result.outcome = result.points > 0 ? 'made' : 'missed';
          result.shooter = ballHandler.playerId;
          result.shotType = 'ft';
          
          playByPlay.push(createPlayByPlayEntry(
            state,
            offenseTeam.teamId,
            ft1 ? 'made_ft' : 'missed_ft',
            `Free throw 1: ${ft1 ? 'Good!' : 'Missed'}`,
            ballHandler.playerId
          ));
          playByPlay.push(createPlayByPlayEntry(
            state,
            offenseTeam.teamId,
            ft2 ? 'made_ft' : 'missed_ft',
            `Free throw 2: ${ft2 ? 'Good!' : 'Missed'}`,
            ballHandler.playerId
          ));
          
          possessionComplete = true;
        } else if (driveResult.success) {
          // Update position and continue
          ballHandler.position = driveResult.newPos;
        }
        break;
      }
      
      case 'post': {
        // Post up moves to low post area and either shoots or kicks out
        if (Math.random() < 0.6) {
          // Post move shot
          const shot = calculateShotProbability(ballHandler, defensePlayers, isHomeTeam);
          
          if (shot.made) {
            result.outcome = 'made';
            result.points = 2;
            result.shooter = ballHandler.playerId;
            result.shotType = 'floater';
            
            playByPlay.push(createPlayByPlayEntry(
              state,
              offenseTeam.teamId,
              'made_shot',
              `${ballHandler.playerId} scores in the post!`,
              ballHandler.playerId,
              undefined,
              true
            ));
          } else {
            playByPlay.push(createPlayByPlayEntry(
              state,
              offenseTeam.teamId,
              'missed_shot',
              `${ballHandler.playerId} misses the post move`,
              ballHandler.playerId
            ));
            
            // Rebound
            const offRebound = Math.random() < 0.25;
            if (offRebound) {
              shotClock = SHOT_CLOCK;
              continue;
            }
            result.outcome = 'missed';
          }
          possessionComplete = true;
        }
        break;
      }
      
      case 'turnover': {
        result.outcome = 'turnover';
        const turnoverType = Math.random() < 0.4 ? 'lost the ball' : 'bad pass';
        
        playByPlay.push(createPlayByPlayEntry(
          state,
          offenseTeam.teamId,
          'turnover',
          `${ballHandler.playerId} ${turnoverType}`,
          ballHandler.playerId
        ));
        possessionComplete = true;
        break;
      }
    }
  }
  
  result.playByPlay = playByPlay;
  return result;
}
