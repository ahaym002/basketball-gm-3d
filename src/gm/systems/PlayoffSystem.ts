// ============================================
// Playoff System - Complete Playoff Management
// ============================================

import { 
  Game, Team, Player, LeagueState, 
  PlayoffBracket, PlayoffRound, PlayoffMatchup,
  BoxScoreStats, SeasonStats
} from '../types';
import { simulateGame, updateStandings } from './SeasonSystem';
import { emptySeasonStats } from '../data/players';

// Conference Finals and NBA Finals names
const ROUND_NAMES = [
  'First Round',
  'Conference Semifinals', 
  'Conference Finals',
  'NBA Finals'
];

// Generate playoff bracket with proper seeding
export function generatePlayoffBracket(teams: Record<string, Team>, year: number): PlayoffBracket {
  // Get top 8 from each conference, sorted by win percentage
  const eastern = Object.values(teams)
    .filter(t => t.conference === 'Eastern')
    .sort((a, b) => {
      const aWinPct = a.wins / Math.max(1, a.wins + a.losses);
      const bWinPct = b.wins / Math.max(1, b.wins + b.losses);
      if (bWinPct !== aWinPct) return bWinPct - aWinPct;
      return b.wins - a.wins; // tiebreaker: total wins
    })
    .slice(0, 8);
  
  const western = Object.values(teams)
    .filter(t => t.conference === 'Western')
    .sort((a, b) => {
      const aWinPct = a.wins / Math.max(1, a.wins + a.losses);
      const bWinPct = b.wins / Math.max(1, b.wins + b.losses);
      if (bWinPct !== aWinPct) return bWinPct - aWinPct;
      return b.wins - a.wins;
    })
    .slice(0, 8);
  
  // Store seedings for reference
  const seedings: Record<string, number> = {};
  eastern.forEach((t, i) => seedings[t.id] = i + 1);
  western.forEach((t, i) => seedings[t.id] = i + 1);
  
  const rounds: PlayoffRound[] = [];
  
  // First Round matchups (1v8, 4v5, 3v6, 2v7)
  const firstRound: PlayoffMatchup[] = [
    // Eastern Conference
    createMatchup(eastern[0], eastern[7], year, 1),
    createMatchup(eastern[3], eastern[4], year, 1),
    createMatchup(eastern[2], eastern[5], year, 1),
    createMatchup(eastern[1], eastern[6], year, 1),
    // Western Conference
    createMatchup(western[0], western[7], year, 1),
    createMatchup(western[3], western[4], year, 1),
    createMatchup(western[2], western[5], year, 1),
    createMatchup(western[1], western[6], year, 1),
  ];
  
  rounds.push({ round: 1, name: 'First Round', matchups: firstRound });
  rounds.push({ round: 2, name: 'Conference Semifinals', matchups: [] });
  rounds.push({ round: 3, name: 'Conference Finals', matchups: [] });
  rounds.push({ round: 4, name: 'NBA Finals', matchups: [] });
  
  return { 
    rounds,
    seedings
  } as PlayoffBracket & { seedings: Record<string, number> };
}

function createMatchup(higher: Team, lower: Team, year: number, round: number): PlayoffMatchup {
  return {
    higherSeed: higher.id,
    lowerSeed: lower.id,
    higherSeedWins: 0,
    lowerSeedWins: 0,
    games: [],
    conference: higher.conference
  } as PlayoffMatchup & { conference: string };
}

// Simulate next playoff game in current round
export function simulateNextPlayoffGame(state: LeagueState): Game | null {
  const playoffs = state.currentSeason.playoffs;
  if (!playoffs) return null;
  
  // Find current active round (first round with incomplete matchups)
  let activeRound: PlayoffRound | null = null;
  let roundIndex = 0;
  
  for (let i = 0; i < playoffs.rounds.length; i++) {
    const round = playoffs.rounds[i];
    if (round.matchups.length > 0) {
      const hasIncomplete = round.matchups.some(m => !m.winner);
      if (hasIncomplete) {
        activeRound = round;
        roundIndex = i;
        break;
      }
    } else if (i > 0) {
      // This round needs matchups generated from previous round
      const prevRound = playoffs.rounds[i - 1];
      if (prevRound.matchups.every(m => m.winner)) {
        advanceToNextRound(playoffs, i - 1, state.currentSeason.year);
        activeRound = playoffs.rounds[i];
        roundIndex = i;
        break;
      }
    }
  }
  
  if (!activeRound) {
    // All rounds complete - check if we have a champion
    const finals = playoffs.rounds[3];
    if (finals.matchups.length > 0 && finals.matchups[0].winner) {
      playoffs.champion = finals.matchups[0].winner;
    }
    return null;
  }
  
  // Find next matchup needing a game
  for (const matchup of activeRound.matchups) {
    if (matchup.winner) continue;
    
    // Determine game number (1-7)
    const gameNumber = matchup.higherSeedWins + matchup.lowerSeedWins + 1;
    if (gameNumber > 7) continue;
    
    // Create and simulate the game
    const game = createPlayoffGame(matchup, gameNumber, roundIndex + 1, state);
    const simulated = simulateGame(game, state);
    
    // Update matchup
    matchup.games.push(simulated.id);
    if (simulated.homeScore! > simulated.awayScore!) {
      if (simulated.homeTeamId === matchup.higherSeed) {
        matchup.higherSeedWins++;
      } else {
        matchup.lowerSeedWins++;
      }
    } else {
      if (simulated.awayTeamId === matchup.higherSeed) {
        matchup.higherSeedWins++;
      } else {
        matchup.lowerSeedWins++;
      }
    }
    
    // Check for series winner (first to 4)
    if (matchup.higherSeedWins >= 4) {
      matchup.winner = matchup.higherSeed;
    } else if (matchup.lowerSeedWins >= 4) {
      matchup.winner = matchup.lowerSeed;
    }
    
    // Add game to schedule
    state.currentSeason.schedule.push(simulated);
    
    return simulated;
  }
  
  return null;
}

function createPlayoffGame(
  matchup: PlayoffMatchup, 
  gameNumber: number, 
  round: number,
  state: LeagueState
): Game {
  // Home court: 2-2-1-1-1 format
  const isHigherSeedHome = [1, 2, 5, 7].includes(gameNumber);
  const homeTeamId = isHigherSeedHome ? matchup.higherSeed : matchup.lowerSeed;
  const awayTeamId = isHigherSeedHome ? matchup.lowerSeed : matchup.higherSeed;
  
  const year = state.currentSeason.year;
  const month = 4 + Math.floor((round - 1) / 2); // April-June
  const day = 15 + (round - 1) * 7 + gameNumber;
  
  return {
    id: `playoff-${year}-r${round}-${matchup.higherSeed}-${matchup.lowerSeed}-g${gameNumber}`,
    homeTeamId,
    awayTeamId,
    date: { year, month, day: day % 28 + 1 },
    played: false,
    isPlayoff: true,
    playoffRound: round,
    playoffGameNumber: gameNumber
  };
}

function advanceToNextRound(playoffs: PlayoffBracket, completedRoundIndex: number, year: number): void {
  const completedRound = playoffs.rounds[completedRoundIndex];
  const nextRound = playoffs.rounds[completedRoundIndex + 1];
  
  if (!nextRound) return;
  
  // Get winners, maintaining conference separation for rounds 1-2
  const winners = completedRound.matchups
    .filter(m => m.winner)
    .map(m => ({ 
      teamId: m.winner!, 
      conference: (m as any).conference 
    }));
  
  if (completedRoundIndex < 2) {
    // Conference rounds - keep conferences separate
    const eastWinners = winners.filter(w => w.conference === 'Eastern');
    const westWinners = winners.filter(w => w.conference === 'Western');
    
    // Pair up winners (1 seed vs lowest, etc. - reseed each round)
    for (let i = 0; i < eastWinners.length / 2; i++) {
      nextRound.matchups.push({
        higherSeed: eastWinners[i].teamId,
        lowerSeed: eastWinners[eastWinners.length - 1 - i].teamId,
        higherSeedWins: 0,
        lowerSeedWins: 0,
        games: [],
        conference: 'Eastern'
      } as PlayoffMatchup & { conference: string });
    }
    
    for (let i = 0; i < westWinners.length / 2; i++) {
      nextRound.matchups.push({
        higherSeed: westWinners[i].teamId,
        lowerSeed: westWinners[westWinners.length - 1 - i].teamId,
        higherSeedWins: 0,
        lowerSeedWins: 0,
        games: [],
        conference: 'Western'
      } as PlayoffMatchup & { conference: string });
    }
  } else if (completedRoundIndex === 2) {
    // NBA Finals - East champion vs West champion
    const eastChamp = winners.find(w => w.conference === 'Eastern')?.teamId;
    const westChamp = winners.find(w => w.conference === 'Western')?.teamId;
    
    if (eastChamp && westChamp) {
      nextRound.matchups.push({
        higherSeed: eastChamp, // Could determine by record
        lowerSeed: westChamp,
        higherSeedWins: 0,
        lowerSeedWins: 0,
        games: [],
        conference: 'Finals'
      } as PlayoffMatchup & { conference: string });
    }
  }
}

// Simulate entire playoff round
export function simulatePlayoffRound(state: LeagueState): Game[] {
  const games: Game[] = [];
  let game = simulateNextPlayoffGame(state);
  
  while (game) {
    games.push(game);
    
    // Check if current round is complete
    const playoffs = state.currentSeason.playoffs;
    if (!playoffs) break;
    
    const activeRound = playoffs.rounds.find(r => 
      r.matchups.length > 0 && r.matchups.some(m => !m.winner)
    );
    
    if (!activeRound) break;
    
    game = simulateNextPlayoffGame(state);
  }
  
  return games;
}

// Simulate entire playoffs to completion
export function simulateEntirePlayoffs(state: LeagueState): { 
  champion: string; 
  fmvp: Player | null;
  games: Game[];
} {
  const allGames: Game[] = [];
  
  while (!state.currentSeason.playoffs?.champion) {
    const game = simulateNextPlayoffGame(state);
    if (!game) break;
    allGames.push(game);
  }
  
  const champion = state.currentSeason.playoffs?.champion || '';
  const fmvp = selectFinalsMVP(state);
  
  return { champion, fmvp, games: allGames };
}

// Select Finals MVP
export function selectFinalsMVP(state: LeagueState): Player | null {
  const playoffs = state.currentSeason.playoffs;
  if (!playoffs || !playoffs.champion) return null;
  
  const finals = playoffs.rounds[3];
  if (!finals || finals.matchups.length === 0) return null;
  
  const finalsMatchup = finals.matchups[0];
  const championId = playoffs.champion;
  const team = state.teams[championId];
  if (!team) return null;
  
  // Find finals games
  const finalsGames = state.currentSeason.schedule.filter(g => 
    g.isPlayoff && 
    g.playoffRound === 4 && 
    g.played
  );
  
  // Aggregate stats for champion's players
  const playerStats: Record<string, { 
    points: number; 
    rebounds: number; 
    assists: number; 
    games: number;
    player: Player;
  }> = {};
  
  for (const game of finalsGames) {
    const isHome = game.homeTeamId === championId;
    const boxScore = isHome ? game.boxScore?.home : game.boxScore?.away;
    
    if (boxScore) {
      for (const stats of boxScore) {
        const player = state.players[stats.playerId];
        if (!player) continue;
        
        if (!playerStats[stats.playerId]) {
          playerStats[stats.playerId] = {
            points: 0,
            rebounds: 0,
            assists: 0,
            games: 0,
            player
          };
        }
        
        playerStats[stats.playerId].points += stats.points;
        playerStats[stats.playerId].rebounds += stats.rebounds;
        playerStats[stats.playerId].assists += stats.assists;
        playerStats[stats.playerId].games++;
      }
    }
  }
  
  // Find best performer (weighted score)
  let bestPlayer: Player | null = null;
  let bestScore = -1;
  
  for (const [playerId, stats] of Object.entries(playerStats)) {
    const ppg = stats.points / stats.games;
    const rpg = stats.rebounds / stats.games;
    const apg = stats.assists / stats.games;
    const score = ppg * 1.5 + rpg + apg * 1.2;
    
    if (score > bestScore) {
      bestScore = score;
      bestPlayer = stats.player;
    }
  }
  
  if (bestPlayer) {
    bestPlayer.awards.push({
      year: state.currentSeason.year,
      type: 'FMVP'
    });
  }
  
  return bestPlayer;
}

// Get playoff bracket status for UI
export function getPlayoffStatus(state: LeagueState): {
  currentRound: number;
  currentRoundName: string;
  matchups: {
    round: number;
    conference: string;
    team1: { id: string; name: string; wins: number; seed: number };
    team2: { id: string; name: string; wins: number; seed: number };
    winner?: string;
    games: number;
  }[];
  champion?: { id: string; name: string };
  fmvp?: { name: string };
} {
  const playoffs = state.currentSeason.playoffs;
  if (!playoffs) {
    return {
      currentRound: 0,
      currentRoundName: 'Not Started',
      matchups: []
    };
  }
  
  const seedings = (playoffs as any).seedings || {};
  
  // Find current round
  let currentRound = 1;
  for (let i = 0; i < playoffs.rounds.length; i++) {
    const round = playoffs.rounds[i];
    if (round.matchups.length > 0 && round.matchups.some(m => !m.winner)) {
      currentRound = i + 1;
      break;
    } else if (round.matchups.length > 0 && round.matchups.every(m => m.winner)) {
      currentRound = i + 2;
    }
  }
  
  if (playoffs.champion) {
    currentRound = 5; // Complete
  }
  
  // Build matchup display
  const matchups: any[] = [];
  
  for (const round of playoffs.rounds) {
    for (const matchup of round.matchups) {
      const team1 = state.teams[matchup.higherSeed];
      const team2 = state.teams[matchup.lowerSeed];
      
      matchups.push({
        round: round.round,
        conference: (matchup as any).conference || team1?.conference,
        team1: {
          id: matchup.higherSeed,
          name: team1 ? `${team1.city} ${team1.name}` : matchup.higherSeed,
          wins: matchup.higherSeedWins,
          seed: seedings[matchup.higherSeed] || 0
        },
        team2: {
          id: matchup.lowerSeed,
          name: team2 ? `${team2.city} ${team2.name}` : matchup.lowerSeed,
          wins: matchup.lowerSeedWins,
          seed: seedings[matchup.lowerSeed] || 0
        },
        winner: matchup.winner,
        games: matchup.higherSeedWins + matchup.lowerSeedWins
      });
    }
  }
  
  const result: any = {
    currentRound,
    currentRoundName: currentRound <= 4 ? ROUND_NAMES[currentRound - 1] : 'Complete',
    matchups
  };
  
  if (playoffs.champion) {
    const champTeam = state.teams[playoffs.champion];
    result.champion = {
      id: playoffs.champion,
      name: champTeam ? `${champTeam.city} ${champTeam.name}` : playoffs.champion
    };
  }
  
  return result;
}

// Check if playoffs are complete
export function arePlayoffsComplete(state: LeagueState): boolean {
  return !!state.currentSeason.playoffs?.champion;
}
