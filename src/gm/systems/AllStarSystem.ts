// ============================================
// All-Star Game System
// ============================================

import { 
  Game, Player, LeagueState, BoxScoreStats, SeasonStats
} from '../types';
import { simulateGame } from './SeasonSystem';

export interface AllStarRoster {
  starters: Player[];
  reserves: Player[];
  coach: string;
  teamName: string;
}

export interface AllStarGame {
  east: AllStarRoster;
  west: AllStarRoster;
  game: Game | null;
  mvp: Player | null;
  year: number;
}

// Select All-Star rosters based on season performance
export function selectAllStars(state: LeagueState): AllStarGame {
  const year = state.currentSeason.year;
  
  // Get all qualified players (at least 20 games played)
  const qualifiedPlayers = Object.values(state.players)
    .filter(p => {
      if (!p.teamId) return false;
      const stats = p.seasonStats[year];
      return stats && stats.gamesPlayed >= 20;
    });
  
  // Separate by conference
  const eastPlayers = qualifiedPlayers.filter(p => {
    const team = state.teams[p.teamId!];
    return team?.conference === 'Eastern';
  });
  
  const westPlayers = qualifiedPlayers.filter(p => {
    const team = state.teams[p.teamId!];
    return team?.conference === 'Western';
  });
  
  // Calculate All-Star score for each player
  const scorePlayer = (player: Player): number => {
    const stats = player.seasonStats[year];
    if (!stats || stats.gamesPlayed === 0) return 0;
    
    const ppg = stats.points / stats.gamesPlayed;
    const rpg = stats.rebounds / stats.gamesPlayed;
    const apg = stats.assists / stats.gamesPlayed;
    const spg = stats.steals / stats.gamesPlayed;
    const bpg = stats.blocks / stats.gamesPlayed;
    
    // Weight offensive stats more for All-Star (it's a showcase)
    return (ppg * 2) + (rpg * 1.2) + (apg * 1.5) + (spg * 1) + (bpg * 1) + (player.stats.overall * 0.5);
  };
  
  // Sort by All-Star score
  eastPlayers.sort((a, b) => scorePlayer(b) - scorePlayer(a));
  westPlayers.sort((a, b) => scorePlayer(b) - scorePlayer(a));
  
  // Select starters (top 5 by position - 2 guards, 3 frontcourt)
  const selectStarters = (players: Player[]): Player[] => {
    const guards = players.filter(p => ['PG', 'SG'].includes(p.position));
    const frontcourt = players.filter(p => ['SF', 'PF', 'C'].includes(p.position));
    
    return [
      ...guards.slice(0, 2),
      ...frontcourt.slice(0, 3)
    ];
  };
  
  // Select reserves (next 7 best players)
  const selectReserves = (players: Player[], starters: Player[]): Player[] => {
    const starterIds = new Set(starters.map(p => p.id));
    return players.filter(p => !starterIds.has(p.id)).slice(0, 7);
  };
  
  const eastStarters = selectStarters(eastPlayers);
  const westStarters = selectStarters(westPlayers);
  
  const eastReserves = selectReserves(eastPlayers, eastStarters);
  const westReserves = selectReserves(westPlayers, westStarters);
  
  // Find coach (team with best record in each conference)
  const findCoach = (conference: 'Eastern' | 'Western'): string => {
    const teams = Object.values(state.teams)
      .filter(t => t.conference === conference)
      .sort((a, b) => {
        const aWinPct = a.wins / Math.max(1, a.wins + a.losses);
        const bWinPct = b.wins / Math.max(1, b.wins + b.losses);
        return bWinPct - aWinPct;
      });
    return teams[0]?.coach.name || 'Unknown';
  };
  
  // Mark all selected players as All-Stars
  [...eastStarters, ...eastReserves, ...westStarters, ...westReserves].forEach(player => {
    player.allStarSelections++;
    player.awards.push({ year, type: 'All-Star' });
  });
  
  return {
    east: {
      starters: eastStarters,
      reserves: eastReserves,
      coach: findCoach('Eastern'),
      teamName: 'Eastern Conference'
    },
    west: {
      starters: westStarters,
      reserves: westReserves,
      coach: findCoach('Western'),
      teamName: 'Western Conference'
    },
    game: null,
    mvp: null,
    year
  };
}

// Simulate the All-Star Game
export function simulateAllStarGame(allStarData: AllStarGame, state: LeagueState): AllStarGame {
  // Create a special high-scoring game
  const baseGame: Game = {
    id: `allstar-${allStarData.year}`,
    homeTeamId: 'EAST-ALLSTARS',
    awayTeamId: 'WEST-ALLSTARS',
    date: { 
      year: allStarData.year, 
      month: 2, 
      day: 15 
    },
    played: false,
    isPlayoff: false
  };
  
  // All-Star games are high scoring affairs
  const eastStrength = [...allStarData.east.starters, ...allStarData.east.reserves]
    .reduce((sum, p) => sum + p.stats.overall, 0) / 12;
  const westStrength = [...allStarData.west.starters, ...allStarData.west.reserves]
    .reduce((sum, p) => sum + p.stats.overall, 0) / 12;
  
  // Simulate high-scoring game
  const diff = (eastStrength - westStrength) + (Math.random() - 0.5) * 10;
  const baseScore = 150 + Math.floor(Math.random() * 30);
  
  let eastScore = Math.round(baseScore + diff);
  let westScore = Math.round(baseScore - diff);
  
  // Ensure no ties
  if (eastScore === westScore) {
    eastScore += Math.random() > 0.5 ? 1 : 0;
    westScore += eastScore === westScore ? 1 : 0;
  }
  
  // Generate box scores
  const generateAllStarBoxScore = (roster: AllStarRoster, teamScore: number): BoxScoreStats[] => {
    const allPlayers = [...roster.starters, ...roster.reserves];
    const boxScores: BoxScoreStats[] = [];
    let remainingPoints = teamScore;
    
    // Starters get more minutes but everyone plays
    const minutesDist = [24, 22, 22, 20, 20, 16, 16, 14, 14, 12, 10, 10];
    
    for (let i = 0; i < allPlayers.length; i++) {
      const player = allPlayers[i];
      const minutes = minutesDist[i] || 10;
      
      // More even distribution in All-Star game
      const pointShare = (minutes / 200) + (Math.random() * 0.1);
      const points = Math.min(remainingPoints, Math.round(teamScore * pointShare));
      remainingPoints -= points;
      
      boxScores.push({
        playerId: player.id,
        minutes,
        points,
        rebounds: Math.floor(Math.random() * 10) + 2,
        assists: Math.floor(Math.random() * 8) + 1,
        steals: Math.floor(Math.random() * 3),
        blocks: Math.floor(Math.random() * 2),
        turnovers: Math.floor(Math.random() * 3),
        fgm: Math.floor(points * 0.45),
        fga: Math.floor(points * 0.8),
        tpm: Math.floor(points * 0.15),
        tpa: Math.floor(points * 0.3),
        ftm: Math.floor(points * 0.15),
        fta: Math.floor(points * 0.2),
        fouls: Math.floor(Math.random() * 2),
        plusMinus: eastScore > westScore ? 5 : -5
      });
    }
    
    return boxScores;
  };
  
  const game: Game = {
    ...baseGame,
    played: true,
    homeScore: eastScore,
    awayScore: westScore,
    boxScore: {
      home: generateAllStarBoxScore(allStarData.east, eastScore),
      away: generateAllStarBoxScore(allStarData.west, westScore)
    }
  };
  
  // Select MVP (best performer from winning team)
  const winningRoster = eastScore > westScore ? allStarData.east : allStarData.west;
  const winningBoxScore = eastScore > westScore ? game.boxScore!.home : game.boxScore!.away;
  
  let mvp: Player | null = null;
  let bestScore = 0;
  
  for (const stats of winningBoxScore) {
    const score = stats.points + stats.assists * 1.5 + stats.rebounds * 1.2;
    if (score > bestScore) {
      bestScore = score;
      mvp = [...winningRoster.starters, ...winningRoster.reserves].find(p => p.id === stats.playerId) || null;
    }
  }
  
  return {
    ...allStarData,
    game,
    mvp
  };
}

// Get All-Star display data for UI
export function getAllStarDisplay(allStarData: AllStarGame, state: LeagueState) {
  const formatPlayer = (player: Player) => {
    const stats = player.seasonStats[allStarData.year];
    const team = state.teams[player.teamId!];
    return {
      id: player.id,
      name: `${player.firstName} ${player.lastName}`,
      position: player.position,
      team: team?.abbreviation || '???',
      teamName: team ? `${team.city} ${team.name}` : 'Unknown',
      overall: player.stats.overall,
      ppg: stats ? (stats.points / stats.gamesPlayed).toFixed(1) : '0.0',
      rpg: stats ? (stats.rebounds / stats.gamesPlayed).toFixed(1) : '0.0',
      apg: stats ? (stats.assists / stats.gamesPlayed).toFixed(1) : '0.0'
    };
  };
  
  return {
    year: allStarData.year,
    east: {
      teamName: allStarData.east.teamName,
      coach: allStarData.east.coach,
      starters: allStarData.east.starters.map(formatPlayer),
      reserves: allStarData.east.reserves.map(formatPlayer),
      score: allStarData.game?.homeScore
    },
    west: {
      teamName: allStarData.west.teamName,
      coach: allStarData.west.coach,
      starters: allStarData.west.starters.map(formatPlayer),
      reserves: allStarData.west.reserves.map(formatPlayer),
      score: allStarData.game?.awayScore
    },
    mvp: allStarData.mvp ? formatPlayer(allStarData.mvp) : null,
    gameComplete: !!allStarData.game?.played
  };
}
