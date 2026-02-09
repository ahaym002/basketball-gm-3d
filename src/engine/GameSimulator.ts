// Core game simulation loop

import {
  MatchState,
  CourtPlayer,
  GamePlayerStats,
  TeamGameState,
  TeamTactics,
  Ball,
  GameClock,
  PlayByPlayEntry,
  QUARTER_LENGTH,
  SHOT_CLOCK,
  COURT,
  SimSpeed,
} from './types';
import { simulatePossession } from './PossessionEngine';
import { generateOffensivePositions, updateFatigue } from './PlayerMovement';
import { evaluateSubstitutions, evaluateTactics, generateAITactics } from './AICoach';
import { Player, Team } from '../gm/types';

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function createEmptyStats(): GamePlayerStats {
  return {
    minutes: 0,
    points: 0,
    rebounds: 0,
    assists: 0,
    steals: 0,
    blocks: 0,
    turnovers: 0,
    fgm: 0,
    fga: 0,
    tpm: 0,
    tpa: 0,
    ftm: 0,
    fta: 0,
    fouls: 0,
    plusMinus: 0,
  };
}

function playerToCourtPlayer(player: Player, teamId: string): CourtPlayer {
  return {
    playerId: player.id,
    position: { x: 0, y: 0 },
    velocity: { vx: 0, vy: 0 },
    teamId,
    jerseyNumber: Math.floor(Math.random() * 99) + 1,
    hasBall: false,
    fatigue: 0,
    fouls: 0,
    isHot: false,
    isCold: false,
    stats: createEmptyStats(),
    speed: player.stats.speed,
    strength: player.stats.strength,
    shooting: (player.stats.midRange + player.stats.threePoint + player.stats.insideScoring) / 3,
    defense: (player.stats.perimeterDefense + player.stats.interiorDefense) / 2,
  };
}

export function initializeMatch(
  gameId: string,
  homeTeam: Team,
  awayTeam: Team,
  homePlayers: Player[],
  awayPlayers: Player[]
): MatchState {
  // Create court players
  const players: Record<string, CourtPlayer> = {};
  
  // Home team players
  homePlayers.forEach(p => {
    players[p.id] = playerToCourtPlayer(p, homeTeam.id);
  });
  
  // Away team players
  awayPlayers.forEach(p => {
    players[p.id] = playerToCourtPlayer(p, awayTeam.id);
  });
  
  // Select starters (top 5 by overall)
  const homeStarters = homePlayers
    .sort((a, b) => b.stats.overall - a.stats.overall)
    .slice(0, 5)
    .map(p => p.id);
  
  const homeBench = homePlayers
    .filter(p => !homeStarters.includes(p.id))
    .map(p => p.id);
  
  const awayStarters = awayPlayers
    .sort((a, b) => b.stats.overall - a.stats.overall)
    .slice(0, 5)
    .map(p => p.id);
  
  const awayBench = awayPlayers
    .filter(p => !awayStarters.includes(p.id))
    .map(p => p.id);
  
  // Position starters on court
  const homePositions = generateOffensivePositions(true, 'motion');
  const awayPositions = generateOffensivePositions(false, 'motion');
  
  homeStarters.forEach((id, i) => {
    if (players[id] && homePositions[i]) {
      players[id].position = homePositions[i];
    }
  });
  
  awayStarters.forEach((id, i) => {
    if (players[id] && awayPositions[i]) {
      players[id].position = awayPositions[i];
    }
  });
  
  // Give ball to home team PG
  if (homeStarters[0] && players[homeStarters[0]]) {
    players[homeStarters[0]].hasBall = true;
  }
  
  const homeTeamState: TeamGameState = {
    teamId: homeTeam.id,
    score: 0,
    timeoutsRemaining: 7,
    teamFouls: 0,
    inBonus: false,
    possession: true,
    onCourt: homeStarters,
    bench: homeBench,
    momentum: 0,
  };
  
  const awayTeamState: TeamGameState = {
    teamId: awayTeam.id,
    score: 0,
    timeoutsRemaining: 7,
    teamFouls: 0,
    inBonus: false,
    possession: false,
    onCourt: awayStarters,
    bench: awayBench,
    momentum: 0,
  };
  
  const ball: Ball = {
    position: players[homeStarters[0]]?.position || { x: 0, y: 0 },
    velocity: { vx: 0, vy: 0 },
    height: 4,
    holder: homeStarters[0],
    state: 'held',
  };
  
  const clock: GameClock = {
    quarter: 1,
    timeRemaining: QUARTER_LENGTH,
    shotClock: SHOT_CLOCK,
    isRunning: false,
  };
  
  const initialPlayByPlay: PlayByPlayEntry = {
    id: generateId(),
    quarter: 1,
    time: QUARTER_LENGTH,
    teamId: '',
    action: 'game_start',
    description: `${homeTeam.city} ${homeTeam.name} vs ${awayTeam.city} ${awayTeam.name}`,
    homeScore: 0,
    awayScore: 0,
    isImportant: true,
  };
  
  return {
    gameId,
    homeTeam: homeTeamState,
    awayTeam: awayTeamState,
    clock,
    ball,
    players,
    playByPlay: [initialPlayByPlay],
    simSpeed: 'paused',
    isPaused: true,
    isComplete: false,
    winner: null,
    homeTactics: {
      pace: 'normal',
      offenseFocus: 'balanced',
      defenseScheme: 'man',
      playCall: 'auto',
    },
    awayTactics: {
      pace: 'normal',
      offenseFocus: 'balanced',
      defenseScheme: 'man',
      playCall: 'auto',
    },
  };
}

export function simulateNextPossession(state: MatchState): MatchState {
  if (state.isComplete) return state;
  
  const offenseTeam = state.homeTeam.possession ? state.homeTeam : state.awayTeam;
  const defenseTeam = state.homeTeam.possession ? state.awayTeam : state.homeTeam;
  
  // Simulate the possession
  const result = simulatePossession(state);
  
  // Apply results
  if (result.outcome === 'made') {
    if (state.homeTeam.possession) {
      state.homeTeam.score += result.points;
      state.homeTeam.momentum = Math.min(100, state.homeTeam.momentum + 10);
      state.awayTeam.momentum = Math.max(-100, state.awayTeam.momentum - 5);
    } else {
      state.awayTeam.score += result.points;
      state.awayTeam.momentum = Math.min(100, state.awayTeam.momentum + 10);
      state.homeTeam.momentum = Math.max(-100, state.homeTeam.momentum - 5);
    }
    
    // Update shooter stats
    if (result.shooter && state.players[result.shooter]) {
      const shooter = state.players[result.shooter];
      shooter.stats.points += result.points;
      if (result.shotType === 'three') {
        shooter.stats.tpm++;
        shooter.stats.tpa++;
      } else if (result.shotType === 'ft') {
        shooter.stats.ftm += result.points;
        shooter.stats.fta += result.points; // Simplified
      } else {
        shooter.stats.fgm++;
        shooter.stats.fga++;
      }
      
      // Hot streak check
      if (shooter.stats.fgm >= 3 && shooter.stats.fga <= 5) {
        shooter.isHot = true;
      }
    }
    
    // Update assister stats
    if (result.assister && state.players[result.assister]) {
      state.players[result.assister].stats.assists++;
    }
  } else if (result.outcome === 'missed') {
    // Update shooter stats
    if (result.shooter && state.players[result.shooter]) {
      const shooter = state.players[result.shooter];
      if (result.shotType === 'three') {
        shooter.stats.tpa++;
      } else if (result.shotType === 'ft') {
        shooter.stats.fta++;
      } else {
        shooter.stats.fga++;
      }
      
      // Cold streak check
      if (shooter.stats.fga >= 5 && shooter.stats.fgm <= 1) {
        shooter.isCold = true;
      }
    }
    
    // Update rebounder stats
    if (result.rebounder && state.players[result.rebounder]) {
      state.players[result.rebounder].stats.rebounds++;
    }
  } else if (result.outcome === 'turnover') {
    // Turnover momentum swing
    if (state.homeTeam.possession) {
      state.homeTeam.momentum = Math.max(-100, state.homeTeam.momentum - 10);
      state.awayTeam.momentum = Math.min(100, state.awayTeam.momentum + 5);
    } else {
      state.awayTeam.momentum = Math.max(-100, state.awayTeam.momentum - 10);
      state.homeTeam.momentum = Math.min(100, state.homeTeam.momentum + 5);
    }
  }
  
  // Add play-by-play entries
  for (const entry of result.playByPlay) {
    entry.homeScore = state.homeTeam.score;
    entry.awayScore = state.awayTeam.score;
    state.playByPlay.push(entry);
  }
  
  // Advance clock (5-15 seconds per possession)
  const timeUsed = 5 + Math.random() * 10;
  state.clock.timeRemaining -= timeUsed;
  state.clock.shotClock = SHOT_CLOCK;
  
  // Update fatigue for active players
  for (const id of [...state.homeTeam.onCourt, ...state.awayTeam.onCourt]) {
    if (state.players[id]) {
      updateFatigue(state.players[id], timeUsed / 60, true);
      state.players[id].stats.minutes += timeUsed / 60;
    }
  }
  
  // Check for quarter end
  if (state.clock.timeRemaining <= 0) {
    if (state.clock.quarter < 4) {
      // Next quarter
      state.clock.quarter++;
      state.clock.timeRemaining = QUARTER_LENGTH;
      
      // Reset team fouls
      state.homeTeam.teamFouls = 0;
      state.awayTeam.teamFouls = 0;
      state.homeTeam.inBonus = false;
      state.awayTeam.inBonus = false;
      
      state.playByPlay.push({
        id: generateId(),
        quarter: state.clock.quarter,
        time: QUARTER_LENGTH,
        teamId: '',
        action: 'quarter_start',
        description: `Quarter ${state.clock.quarter} begins`,
        homeScore: state.homeTeam.score,
        awayScore: state.awayTeam.score,
        isImportant: true,
      });
      
      // AI makes adjustments
      state.awayTactics = generateAITactics(state, state.awayTeam.teamId);
    } else {
      // Check for overtime or game end
      if (state.homeTeam.score === state.awayTeam.score) {
        // Overtime
        state.clock.quarter++;
        state.clock.timeRemaining = 300; // 5 minute OT
        
        state.playByPlay.push({
          id: generateId(),
          quarter: state.clock.quarter,
          time: 300,
          teamId: '',
          action: 'quarter_start',
          description: `Overtime period ${state.clock.quarter - 4}!`,
          homeScore: state.homeTeam.score,
          awayScore: state.awayTeam.score,
          isImportant: true,
        });
      } else {
        // Game over
        state.isComplete = true;
        state.winner = state.homeTeam.score > state.awayTeam.score
          ? state.homeTeam.teamId
          : state.awayTeam.teamId;
        
        state.playByPlay.push({
          id: generateId(),
          quarter: state.clock.quarter,
          time: 0,
          teamId: state.winner,
          action: 'game_end',
          description: `Final: ${state.homeTeam.score} - ${state.awayTeam.score}`,
          homeScore: state.homeTeam.score,
          awayScore: state.awayTeam.score,
          isImportant: true,
        });
      }
    }
  }
  
  // Switch possession (unless offensive rebound)
  state.homeTeam.possession = !state.homeTeam.possession;
  state.awayTeam.possession = !state.awayTeam.possession;
  
  // Update ball holder
  const newOffenseTeam = state.homeTeam.possession ? state.homeTeam : state.awayTeam;
  const ballHandler = newOffenseTeam.onCourt[0];
  state.ball.holder = ballHandler;
  if (state.players[ballHandler]) {
    state.players[ballHandler].hasBall = true;
  }
  
  return state;
}

export function simulateToQuarterEnd(state: MatchState): MatchState {
  const targetQuarter = state.clock.quarter;
  
  while (!state.isComplete && state.clock.quarter === targetQuarter) {
    state = simulateNextPossession(state);
  }
  
  return state;
}

export function simulateToGameEnd(state: MatchState): MatchState {
  while (!state.isComplete) {
    state = simulateNextPossession(state);
  }
  
  return state;
}

export function makeSubstitution(
  state: MatchState,
  teamId: string,
  playerOut: string,
  playerIn: string
): MatchState {
  const team = state.homeTeam.teamId === teamId ? state.homeTeam : state.awayTeam;
  
  // Find positions
  const outIndex = team.onCourt.indexOf(playerOut);
  const inIndex = team.bench.indexOf(playerIn);
  
  if (outIndex === -1 || inIndex === -1) {
    console.warn('Invalid substitution');
    return state;
  }
  
  // Swap players
  team.onCourt[outIndex] = playerIn;
  team.bench[inIndex] = playerOut;
  
  // Transfer ball if needed
  if (state.ball.holder === playerOut) {
    state.ball.holder = playerIn;
    if (state.players[playerOut]) state.players[playerOut].hasBall = false;
    if (state.players[playerIn]) state.players[playerIn].hasBall = true;
  }
  
  // Copy position
  if (state.players[playerOut] && state.players[playerIn]) {
    state.players[playerIn].position = { ...state.players[playerOut].position };
  }
  
  // Add to play-by-play
  state.playByPlay.push({
    id: generateId(),
    quarter: state.clock.quarter,
    time: state.clock.timeRemaining,
    teamId,
    playerId: playerIn,
    secondaryPlayerId: playerOut,
    action: 'substitution',
    description: `Substitution: ${playerIn} in for ${playerOut}`,
    homeScore: state.homeTeam.score,
    awayScore: state.awayTeam.score,
    isImportant: false,
  });
  
  return state;
}

export function callTimeout(
  state: MatchState,
  teamId: string
): MatchState {
  const team = state.homeTeam.teamId === teamId ? state.homeTeam : state.awayTeam;
  
  if (team.timeoutsRemaining <= 0) {
    console.warn('No timeouts remaining');
    return state;
  }
  
  team.timeoutsRemaining--;
  state.isPaused = true;
  
  // Timeout breaks momentum
  state.homeTeam.momentum *= 0.5;
  state.awayTeam.momentum *= 0.5;
  
  state.playByPlay.push({
    id: generateId(),
    quarter: state.clock.quarter,
    time: state.clock.timeRemaining,
    teamId,
    action: 'timeout',
    description: `Timeout called`,
    homeScore: state.homeTeam.score,
    awayScore: state.awayTeam.score,
    isImportant: true,
  });
  
  // Rest players a bit
  for (const id of team.onCourt) {
    if (state.players[id]) {
      state.players[id].fatigue = Math.max(0, state.players[id].fatigue - 5);
    }
  }
  
  return state;
}

export function updateTactics(
  state: MatchState,
  teamId: string,
  newTactics: Partial<TeamTactics>
): MatchState {
  if (state.homeTeam.teamId === teamId) {
    state.homeTactics = { ...state.homeTactics, ...newTactics };
  } else {
    state.awayTactics = { ...state.awayTactics, ...newTactics };
  }
  return state;
}

export function getSpeedMultiplier(speed: SimSpeed): number {
  switch (speed) {
    case 'paused': return 0;
    case '1x': return 1;
    case '2x': return 2;
    case '4x': return 4;
    case '8x': return 8;
    case 'instant': return 1000;
    default: return 1;
  }
}
