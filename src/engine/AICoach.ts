// AI Coach decision making

import {
  MatchState,
  TeamGameState,
  TeamTactics,
  CourtPlayer,
} from './types';

interface SubstitutionDecision {
  playerOut: string;
  playerIn: string;
  reason: string;
}

interface TacticalAdjustment {
  setting: keyof TeamTactics;
  value: string;
  reason: string;
}

interface TimeoutDecision {
  shouldCall: boolean;
  reason: string;
}

// Fatigue threshold for substitution
const FATIGUE_THRESHOLD = 65;
const FOUL_TROUBLE_THRESHOLD = 4;

export function evaluateSubstitutions(
  state: MatchState,
  teamId: string
): SubstitutionDecision[] {
  const team = state.homeTeam.teamId === teamId ? state.homeTeam : state.awayTeam;
  const decisions: SubstitutionDecision[] = [];
  
  const onCourtPlayers = team.onCourt.map(id => state.players[id]).filter(Boolean);
  const benchPlayers = team.bench.map(id => state.players[id]).filter(Boolean);
  
  if (benchPlayers.length === 0) return decisions;
  
  for (const player of onCourtPlayers) {
    // Check fatigue
    if (player.fatigue >= FATIGUE_THRESHOLD) {
      const replacement = findBestReplacement(player, benchPlayers);
      if (replacement) {
        decisions.push({
          playerOut: player.playerId,
          playerIn: replacement.playerId,
          reason: `${player.playerId} needs rest (${Math.round(player.fatigue)}% fatigue)`,
        });
      }
    }
    
    // Check foul trouble
    if (player.fouls >= FOUL_TROUBLE_THRESHOLD) {
      const replacement = findBestReplacement(player, benchPlayers);
      if (replacement && replacement.fouls < player.fouls) {
        decisions.push({
          playerOut: player.playerId,
          playerIn: replacement.playerId,
          reason: `${player.playerId} in foul trouble (${player.fouls} fouls)`,
        });
      }
    }
  }
  
  return decisions.slice(0, 2); // Max 2 subs at a time
}

function findBestReplacement(
  playerOut: CourtPlayer,
  benchPlayers: CourtPlayer[]
): CourtPlayer | null {
  // Find bench player with similar skills and low fatigue
  let bestMatch: CourtPlayer | null = null;
  let bestScore = -1;
  
  for (const benchPlayer of benchPlayers) {
    // Skip if too tired
    if (benchPlayer.fatigue > 50) continue;
    
    // Score based on skill similarity and rest
    const skillMatch = 100 - Math.abs(benchPlayer.shooting - playerOut.shooting);
    const restBonus = 100 - benchPlayer.fatigue;
    const score = skillMatch * 0.5 + restBonus * 0.5;
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = benchPlayer;
    }
  }
  
  return bestMatch;
}

export function evaluateTactics(
  state: MatchState,
  teamId: string
): TacticalAdjustment[] {
  const team = state.homeTeam.teamId === teamId ? state.homeTeam : state.awayTeam;
  const oppTeam = state.homeTeam.teamId === teamId ? state.awayTeam : state.homeTeam;
  const tactics = state.homeTeam.teamId === teamId ? state.homeTactics : state.awayTactics;
  
  const adjustments: TacticalAdjustment[] = [];
  const scoreDiff = team.score - oppTeam.score;
  const timeRemaining = state.clock.timeRemaining + (4 - state.clock.quarter) * 720;
  
  // Trailing late - push pace
  if (scoreDiff < -8 && timeRemaining < 300) {
    if (tactics.pace !== 'push') {
      adjustments.push({
        setting: 'pace',
        value: 'push',
        reason: 'Down late, need to push tempo',
      });
    }
    if (tactics.offenseFocus !== 'perimeter') {
      adjustments.push({
        setting: 'offenseFocus',
        value: 'perimeter',
        reason: 'Need quick threes to catch up',
      });
    }
  }
  
  // Leading late - slow down
  if (scoreDiff > 8 && timeRemaining < 300) {
    if (tactics.pace !== 'slow') {
      adjustments.push({
        setting: 'pace',
        value: 'slow',
        reason: 'Protecting lead, slowing down',
      });
    }
  }
  
  // Opponent on a run - adjust defense
  if (oppTeam.momentum > 50) {
    if (tactics.defenseScheme !== 'zone-23') {
      adjustments.push({
        setting: 'defenseScheme',
        value: 'zone-23',
        reason: 'Opponent hot, switching to zone',
      });
    }
  }
  
  // Blowout - play bench
  if (Math.abs(scoreDiff) > 25 && state.clock.quarter >= 4) {
    // This would trigger more substitutions
  }
  
  return adjustments;
}

export function evaluateTimeout(
  state: MatchState,
  teamId: string
): TimeoutDecision {
  const team = state.homeTeam.teamId === teamId ? state.homeTeam : state.awayTeam;
  const oppTeam = state.homeTeam.teamId === teamId ? state.awayTeam : state.homeTeam;
  
  // No timeouts left
  if (team.timeoutsRemaining <= 0) {
    return { shouldCall: false, reason: 'No timeouts remaining' };
  }
  
  // Opponent on a big run (momentum > 70)
  if (oppTeam.momentum > 70) {
    return {
      shouldCall: true,
      reason: `Opponent on a run, need to stop momentum`,
    };
  }
  
  // Late game, close game, need to set up play
  const timeRemaining = state.clock.timeRemaining;
  const scoreDiff = Math.abs(team.score - oppTeam.score);
  
  if (state.clock.quarter === 4 && timeRemaining < 60 && scoreDiff <= 5) {
    if (team.possession) {
      return {
        shouldCall: true,
        reason: 'Late game, need to draw up a play',
      };
    }
  }
  
  // End of quarter, last possession
  if (timeRemaining < 30 && team.possession) {
    if (Math.random() < 0.3) { // Don't always call
      return {
        shouldCall: true,
        reason: 'End of quarter, setting up final shot',
      };
    }
  }
  
  return { shouldCall: false, reason: '' };
}

export function getAILineup(
  players: CourtPlayer[],
  quarter: number,
  scoreDiff: number
): string[] {
  // Sort by overall skill (shooting + defense + speed)
  const sorted = [...players].sort((a, b) => {
    const aScore = a.shooting + a.defense + a.speed - a.fatigue;
    const bScore = b.shooting + b.defense + b.speed - b.fatigue;
    return bScore - aScore;
  });
  
  // Take top 5 with acceptable fatigue
  const lineup: CourtPlayer[] = [];
  
  for (const player of sorted) {
    if (lineup.length >= 5) break;
    if (player.fatigue < 80) {
      lineup.push(player);
    }
  }
  
  // Fill remaining with anyone
  for (const player of sorted) {
    if (lineup.length >= 5) break;
    if (!lineup.includes(player)) {
      lineup.push(player);
    }
  }
  
  return lineup.slice(0, 5).map(p => p.playerId);
}

export function generateAITactics(
  state: MatchState,
  teamId: string
): TeamTactics {
  const team = state.homeTeam.teamId === teamId ? state.homeTeam : state.awayTeam;
  const oppTeam = state.homeTeam.teamId === teamId ? state.awayTeam : state.homeTeam;
  const players = team.onCourt.map(id => state.players[id]).filter(Boolean);
  
  // Analyze team strengths
  const avgShooting = players.reduce((sum, p) => sum + p.shooting, 0) / 5;
  const avgStrength = players.reduce((sum, p) => sum + p.strength, 0) / 5;
  const avgSpeed = players.reduce((sum, p) => sum + p.speed, 0) / 5;
  
  // Default tactics based on roster
  let pace: TeamTactics['pace'] = 'normal';
  let offenseFocus: TeamTactics['offenseFocus'] = 'balanced';
  let defenseScheme: TeamTactics['defenseScheme'] = 'man';
  
  if (avgSpeed > 75) pace = 'push';
  if (avgSpeed < 60) pace = 'slow';
  
  if (avgShooting > 75) offenseFocus = 'perimeter';
  if (avgStrength > 75) offenseFocus = 'inside';
  
  // Adjust for game state
  const scoreDiff = team.score - oppTeam.score;
  if (scoreDiff < -10 && state.clock.quarter >= 3) {
    pace = 'push';
    offenseFocus = 'perimeter';
  }
  if (scoreDiff > 10 && state.clock.quarter >= 3) {
    pace = 'slow';
  }
  
  return {
    pace,
    offenseFocus,
    defenseScheme,
    playCall: 'auto',
  };
}
