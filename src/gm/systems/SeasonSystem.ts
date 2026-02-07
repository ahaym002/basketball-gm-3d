// ============================================
// Season Simulation System
// ============================================

import { 
  Game, Team, Player, BoxScoreStats, Season, 
  PlayoffBracket, PlayoffRound, PlayoffMatchup, 
  LeagueState, GameDate, PlayerAward, SeasonStats 
} from '../types';
import { emptySeasonStats } from '../data/players';

// Generate full 82-game regular season schedule
export function generateRegularSeasonSchedule(
  teams: Record<string, Team>,
  year: number
): Game[] {
  const games: Game[] = [];
  const teamIds = Object.keys(teams);
  
  // Each team plays 82 games:
  // - 4 games vs each of 4 division opponents (16 games)
  // - 4 games vs 6 conference opponents (24 games)
  // - 3 games vs 4 conference opponents (12 games)
  // - 2 games vs each of 15 other conference teams (30 games)
  
  // Simplified: Round-robin with home/away balance
  let gameId = 1;
  const startMonth = 10; // October
  let currentDay = 20;
  let currentMonth = startMonth;
  
  // Generate matchups
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      const teamA = teamIds[i];
      const teamB = teamIds[j];
      const teamAData = teams[teamA];
      const teamBData = teams[teamB];
      
      // Determine number of games based on conference/division
      let numGames = 2;
      if (teamAData.conference === teamBData.conference) {
        if (teamAData.division === teamBData.division) {
          numGames = 4;
        } else {
          numGames = Math.random() > 0.4 ? 4 : 3;
        }
      }
      
      for (let g = 0; g < numGames; g++) {
        const isHomeA = g % 2 === 0;
        
        games.push({
          id: `game-${year}-${gameId++}`,
          homeTeamId: isHomeA ? teamA : teamB,
          awayTeamId: isHomeA ? teamB : teamA,
          date: { year, month: currentMonth, day: currentDay },
          played: false
        });
        
        // Advance date
        currentDay += Math.floor(Math.random() * 2) + 1;
        if (currentDay > 28) {
          currentDay = 1;
          currentMonth++;
          if (currentMonth > 12) currentMonth = 1;
        }
      }
    }
  }
  
  // Shuffle and assign dates properly
  games.sort(() => Math.random() - 0.5);
  
  // Distribute evenly across season (October to April)
  const gamesPerDay = Math.ceil(games.length / 180); // ~180 days in season
  currentMonth = 10;
  currentDay = 22;
  
  for (let i = 0; i < games.length; i++) {
    games[i].date = { year: currentMonth >= 10 ? year : year + 1, month: currentMonth, day: currentDay };
    
    if (i % gamesPerDay === gamesPerDay - 1) {
      currentDay++;
      if (currentDay > 28) {
        currentDay = 1;
        currentMonth++;
        if (currentMonth > 12) currentMonth = 1;
      }
    }
  }
  
  return games;
}

export function simulateGame(
  game: Game,
  state: LeagueState
): Game {
  const homeTeam = state.teams[game.homeTeamId];
  const awayTeam = state.teams[game.awayTeamId];
  
  // Calculate team strengths
  const homeStrength = calculateTeamStrength(homeTeam, state);
  const awayStrength = calculateTeamStrength(awayTeam, state);
  
  // Home court advantage
  const homeAdvantage = 3;
  const strengthDiff = homeStrength + homeAdvantage - awayStrength;
  
  // Simulate pace and scoring
  const basePace = 100; // possessions per game
  const homeOffRating = 100 + strengthDiff / 2 + (Math.random() - 0.5) * 20;
  const awayOffRating = 100 - strengthDiff / 2 + (Math.random() - 0.5) * 20;
  
  let homeScore = Math.round(basePace * homeOffRating / 100);
  let awayScore = Math.round(basePace * awayOffRating / 100);
  
  // Ensure no ties (overtime if needed)
  let overtime = 0;
  while (homeScore === awayScore) {
    overtime++;
    const otHome = Math.floor(Math.random() * 15) + 5;
    const otAway = Math.floor(Math.random() * 15) + 5;
    homeScore += otHome;
    awayScore += otAway;
  }
  
  // Generate box scores
  const homeBoxScore = generateTeamBoxScore(homeTeam, state, homeScore, true);
  const awayBoxScore = generateTeamBoxScore(awayTeam, state, awayScore, false);
  
  // Update player season stats
  updatePlayerSeasonStats(homeBoxScore, state);
  updatePlayerSeasonStats(awayBoxScore, state);
  
  return {
    ...game,
    played: true,
    homeScore,
    awayScore,
    overtime: overtime > 0 ? overtime : undefined,
    boxScore: {
      home: homeBoxScore,
      away: awayBoxScore
    }
  };
}

function calculateTeamStrength(team: Team, state: LeagueState): number {
  let totalRating = 0;
  let playerCount = 0;
  
  for (const playerId of team.roster.slice(0, 10)) { // Top 10 rotation players
    const player = state.players[playerId];
    if (player && !player.injury) {
      totalRating += player.stats.overall;
      playerCount++;
    }
  }
  
  return playerCount > 0 ? totalRating / playerCount : 60;
}

function generateTeamBoxScore(
  team: Team,
  state: LeagueState,
  teamScore: number,
  isHome: boolean
): BoxScoreStats[] {
  const boxScore: BoxScoreStats[] = [];
  const availablePlayers = team.roster
    .map(id => state.players[id])
    .filter(p => p && !p.injury)
    .sort((a, b) => b.stats.overall - a.stats.overall)
    .slice(0, 10);
  
  // Distribute minutes (240 total, 5 starters play more)
  const minuteDistribution = [32, 30, 28, 26, 24, 18, 14, 10, 8, 0];
  let remainingPoints = teamScore;
  let remainingRebounds = Math.floor(40 + Math.random() * 10);
  let remainingAssists = Math.floor(20 + Math.random() * 10);
  
  for (let i = 0; i < availablePlayers.length; i++) {
    const player = availablePlayers[i];
    const minutes = minuteDistribution[i] || 0;
    
    // Generate stats based on player ratings and minutes
    const pointShare = (player.stats.overall / 100) * (minutes / 30) * (0.8 + Math.random() * 0.4);
    const points = Math.min(remainingPoints, Math.round(remainingPoints * pointShare));
    remainingPoints -= points;
    
    const rebounds = Math.min(remainingRebounds, Math.round(
      (player.stats.defensiveRebounding + player.stats.offensiveRebounding) / 200 * 
      minutes * (0.5 + Math.random())
    ));
    remainingRebounds -= rebounds;
    
    const assists = Math.min(remainingAssists, Math.round(
      player.stats.passing / 100 * minutes * 0.3 * (0.5 + Math.random())
    ));
    remainingAssists -= assists;
    
    // Field goals
    const fga = Math.round(points / 2 * (0.8 + Math.random() * 0.4));
    const fgPct = 0.35 + (player.stats.insideScoring + player.stats.midRange) / 400;
    const fgm = Math.round(fga * fgPct);
    
    // Three pointers
    const tpa = Math.round(fga * 0.3 * player.stats.threePoint / 100);
    const tpm = Math.round(tpa * (0.25 + player.stats.threePoint / 300));
    
    // Free throws
    const fta = Math.round(points * 0.2);
    const ftm = Math.round(fta * (0.6 + player.stats.freeThrow / 250));
    
    boxScore.push({
      playerId: player.id,
      minutes,
      points,
      rebounds,
      assists,
      steals: Math.round(player.stats.stealing / 100 * minutes * 0.1 * (Math.random() + 0.5)),
      blocks: Math.round(player.stats.blocking / 100 * minutes * 0.05 * (Math.random() + 0.5)),
      turnovers: Math.round(minutes * 0.1 * (1 - player.stats.ballHandling / 200) * (Math.random() + 0.5)),
      fgm,
      fga,
      tpm,
      tpa,
      ftm,
      fta,
      fouls: Math.floor(Math.random() * 4),
      plusMinus: isHome ? Math.floor((Math.random() - 0.3) * 20) : Math.floor((Math.random() - 0.7) * 20)
    });
  }
  
  return boxScore;
}

function updatePlayerSeasonStats(boxScore: BoxScoreStats[], state: LeagueState): void {
  const year = state.currentSeason.year;
  
  for (const stats of boxScore) {
    const player = state.players[stats.playerId];
    if (!player) continue;
    
    // Initialize season stats if needed
    if (!player.seasonStats[year]) {
      player.seasonStats[year] = emptySeasonStats();
    }
    
    const seasonStats = player.seasonStats[year];
    seasonStats.gamesPlayed++;
    if (stats.minutes >= 20) seasonStats.gamesStarted++;
    
    // Update totals (we'll calculate per-game later)
    seasonStats.points += stats.points;
    seasonStats.rebounds += stats.rebounds;
    seasonStats.assists += stats.assists;
    seasonStats.steals += stats.steals;
    seasonStats.blocks += stats.blocks;
    seasonStats.turnovers += stats.turnovers;
    seasonStats.fieldGoalsMade += stats.fgm;
    seasonStats.fieldGoalsAttempted += stats.fga;
    seasonStats.threePointersMade += stats.tpm;
    seasonStats.threePointersAttempted += stats.tpa;
    seasonStats.freeThrowsMade += stats.ftm;
    seasonStats.freeThrowsAttempted += stats.fta;
    seasonStats.personalFouls += stats.fouls;
    seasonStats.plusMinus += stats.plusMinus;
    seasonStats.minutesPerGame = (seasonStats.minutesPerGame * (seasonStats.gamesPlayed - 1) + stats.minutes) / seasonStats.gamesPlayed;
  }
}

export function updateStandings(game: Game, state: LeagueState): void {
  if (!game.played || game.homeScore === undefined || game.awayScore === undefined) return;
  
  const homeTeam = state.teams[game.homeTeamId];
  const awayTeam = state.teams[game.awayTeamId];
  
  if (game.homeScore > game.awayScore) {
    homeTeam.wins++;
    awayTeam.losses++;
    homeTeam.streak = homeTeam.streak >= 0 ? homeTeam.streak + 1 : 1;
    awayTeam.streak = awayTeam.streak <= 0 ? awayTeam.streak - 1 : -1;
    homeTeam.lastTenGames = ['W', ...homeTeam.lastTenGames.slice(0, 9)];
    awayTeam.lastTenGames = ['L', ...awayTeam.lastTenGames.slice(0, 9)];
  } else {
    awayTeam.wins++;
    homeTeam.losses++;
    awayTeam.streak = awayTeam.streak >= 0 ? awayTeam.streak + 1 : 1;
    homeTeam.streak = homeTeam.streak <= 0 ? homeTeam.streak - 1 : -1;
    awayTeam.lastTenGames = ['W', ...awayTeam.lastTenGames.slice(0, 9)];
    homeTeam.lastTenGames = ['L', ...homeTeam.lastTenGames.slice(0, 9)];
  }
}

// Playoff system
export function generatePlayoffBracket(teams: Record<string, Team>): PlayoffBracket {
  // Get top 8 from each conference
  const eastern = Object.values(teams)
    .filter(t => t.conference === 'Eastern')
    .sort((a, b) => (b.wins / (b.wins + b.losses || 1)) - (a.wins / (a.wins + a.losses || 1)))
    .slice(0, 8);
  
  const western = Object.values(teams)
    .filter(t => t.conference === 'Western')
    .sort((a, b) => (b.wins / (b.wins + b.losses || 1)) - (a.wins / (a.wins + a.losses || 1)))
    .slice(0, 8);
  
  const rounds: PlayoffRound[] = [];
  
  // First Round
  const firstRound: PlayoffMatchup[] = [
    // Eastern Conference
    { higherSeed: eastern[0].id, lowerSeed: eastern[7].id, higherSeedWins: 0, lowerSeedWins: 0, games: [] },
    { higherSeed: eastern[3].id, lowerSeed: eastern[4].id, higherSeedWins: 0, lowerSeedWins: 0, games: [] },
    { higherSeed: eastern[2].id, lowerSeed: eastern[5].id, higherSeedWins: 0, lowerSeedWins: 0, games: [] },
    { higherSeed: eastern[1].id, lowerSeed: eastern[6].id, higherSeedWins: 0, lowerSeedWins: 0, games: [] },
    // Western Conference
    { higherSeed: western[0].id, lowerSeed: western[7].id, higherSeedWins: 0, lowerSeedWins: 0, games: [] },
    { higherSeed: western[3].id, lowerSeed: western[4].id, higherSeedWins: 0, lowerSeedWins: 0, games: [] },
    { higherSeed: western[2].id, lowerSeed: western[5].id, higherSeedWins: 0, lowerSeedWins: 0, games: [] },
    { higherSeed: western[1].id, lowerSeed: western[6].id, higherSeedWins: 0, lowerSeedWins: 0, games: [] },
  ];
  
  rounds.push({ round: 1, name: 'First Round', matchups: firstRound });
  
  // Conference Semis (to be filled)
  rounds.push({ round: 2, name: 'Conference Semifinals', matchups: [] });
  
  // Conference Finals
  rounds.push({ round: 3, name: 'Conference Finals', matchups: [] });
  
  // NBA Finals
  rounds.push({ round: 4, name: 'NBA Finals', matchups: [] });
  
  return { rounds };
}

export function simulatePlayoffGame(
  matchup: PlayoffMatchup,
  gameNumber: number,
  state: LeagueState
): Game {
  const isHigherSeedHome = [1, 2, 5, 7].includes(gameNumber);
  const homeTeamId = isHigherSeedHome ? matchup.higherSeed : matchup.lowerSeed;
  const awayTeamId = isHigherSeedHome ? matchup.lowerSeed : matchup.higherSeed;
  
  const game: Game = {
    id: `playoff-${matchup.higherSeed}-${matchup.lowerSeed}-g${gameNumber}`,
    homeTeamId,
    awayTeamId,
    date: { year: state.currentSeason.year, month: 4, day: 15 + gameNumber },
    played: false,
    isPlayoff: true,
    playoffRound: 1,
    playoffGameNumber: gameNumber
  };
  
  return simulateGame(game, state);
}

export function advancePlayoffRound(bracket: PlayoffBracket, roundIndex: number): void {
  const currentRound = bracket.rounds[roundIndex];
  const nextRound = bracket.rounds[roundIndex + 1];
  
  if (!nextRound) return;
  
  const winners = currentRound.matchups
    .filter(m => m.winner)
    .map(m => m.winner!);
  
  // Create next round matchups
  for (let i = 0; i < winners.length; i += 2) {
    if (winners[i + 1]) {
      nextRound.matchups.push({
        higherSeed: winners[i],
        lowerSeed: winners[i + 1],
        higherSeedWins: 0,
        lowerSeedWins: 0,
        games: []
      });
    }
  }
}

// Awards voting
export function calculateMVPVotes(state: LeagueState): { playerId: string; votes: number; stats: SeasonStats }[] {
  const year = state.currentSeason.year;
  const candidates: { playerId: string; score: number; stats: SeasonStats }[] = [];
  
  for (const [playerId, player] of Object.entries(state.players)) {
    if (!player.teamId) continue;
    
    const stats = player.seasonStats[year];
    if (!stats || stats.gamesPlayed < 50) continue;
    
    const team = state.teams[player.teamId];
    const winPct = team.wins / (team.wins + team.losses || 1);
    
    // MVP score based on stats and team success
    const ppg = stats.points / stats.gamesPlayed;
    const rpg = stats.rebounds / stats.gamesPlayed;
    const apg = stats.assists / stats.gamesPlayed;
    
    const score = (ppg * 2) + (rpg * 1.2) + (apg * 1.5) + (winPct * 100) + (player.stats.overall * 0.5);
    
    candidates.push({ playerId, score, stats });
  }
  
  // Sort and assign votes
  candidates.sort((a, b) => b.score - a.score);
  
  return candidates.slice(0, 10).map((c, i) => ({
    playerId: c.playerId,
    votes: 100 - i * 10,
    stats: c.stats
  }));
}

export function selectAwards(state: LeagueState): void {
  const year = state.currentSeason.year;
  
  // MVP
  const mvpVotes = calculateMVPVotes(state);
  if (mvpVotes.length > 0) {
    const mvp = state.players[mvpVotes[0].playerId];
    if (mvp) {
      mvp.awards.push({ year, type: 'MVP' });
    }
  }
  
  // DPOY - based on defensive stats
  const defensiveCandidates = Object.values(state.players)
    .filter(p => p.teamId && p.seasonStats[year]?.gamesPlayed >= 50)
    .sort((a, b) => {
      const aStats = a.seasonStats[year];
      const bStats = b.seasonStats[year];
      const aDefScore = (aStats.steals + aStats.blocks * 2) / aStats.gamesPlayed + a.stats.perimeterDefense / 10;
      const bDefScore = (bStats.steals + bStats.blocks * 2) / bStats.gamesPlayed + b.stats.perimeterDefense / 10;
      return bDefScore - aDefScore;
    });
  
  if (defensiveCandidates.length > 0) {
    defensiveCandidates[0].awards.push({ year, type: 'DPOY' });
  }
  
  // ROY - best rookie
  const rookies = Object.values(state.players)
    .filter(p => p.yearsExperience === 0 && p.teamId && p.seasonStats[year]?.gamesPlayed >= 40)
    .sort((a, b) => {
      const aStats = a.seasonStats[year];
      const bStats = b.seasonStats[year];
      const aPPG = aStats.points / aStats.gamesPlayed;
      const bPPG = bStats.points / bStats.gamesPlayed;
      return bPPG - aPPG;
    });
  
  if (rookies.length > 0) {
    rookies[0].awards.push({ year, type: 'ROY' });
  }
  
  // MIP - Most Improved Player
  // Would need previous year stats to compare
  
  // 6MOY - Best bench player
  const sixthMen = Object.values(state.players)
    .filter(p => p.teamId && p.seasonStats[year]?.gamesPlayed >= 50)
    .filter(p => {
      const stats = p.seasonStats[year];
      return stats.gamesStarted < stats.gamesPlayed * 0.3; // Started less than 30% of games
    })
    .sort((a, b) => {
      const aStats = a.seasonStats[year];
      const bStats = b.seasonStats[year];
      const aPPG = aStats.points / aStats.gamesPlayed;
      const bPPG = bStats.points / bStats.gamesPlayed;
      return bPPG - aPPG;
    });
  
  if (sixthMen.length > 0) {
    sixthMen[0].awards.push({ year, type: 'SMOY' });
  }
  
  // All-NBA Teams
  selectAllNBATeams(state, year);
}

function selectAllNBATeams(state: LeagueState, year: number): void {
  const positions: Record<string, string[]> = {
    guard: ['PG', 'SG'],
    forward: ['SF', 'PF'],
    center: ['C']
  };
  
  const playersByPosition: Record<string, Player[]> = {
    guard: [],
    forward: [],
    center: []
  };
  
  for (const player of Object.values(state.players)) {
    if (!player.teamId || !player.seasonStats[year] || player.seasonStats[year].gamesPlayed < 50) continue;
    
    for (const [posGroup, posList] of Object.entries(positions)) {
      if (posList.includes(player.position)) {
        playersByPosition[posGroup].push(player);
        break;
      }
    }
  }
  
  // Sort each position group by performance
  for (const posGroup of Object.keys(playersByPosition)) {
    playersByPosition[posGroup].sort((a, b) => {
      const aStats = a.seasonStats[year];
      const bStats = b.seasonStats[year];
      const aScore = (aStats.points + aStats.assists * 1.5 + aStats.rebounds) / aStats.gamesPlayed;
      const bScore = (bStats.points + bStats.assists * 1.5 + bStats.rebounds) / bStats.gamesPlayed;
      return bScore - aScore;
    });
  }
  
  // Select All-NBA teams (2 guards, 2 forwards, 1 center per team)
  const teams: ('All-NBA-1st' | 'All-NBA-2nd' | 'All-NBA-3rd')[] = ['All-NBA-1st', 'All-NBA-2nd', 'All-NBA-3rd'];
  
  for (let i = 0; i < 3; i++) {
    const team = teams[i];
    
    // 2 guards
    for (let j = 0; j < 2 && playersByPosition.guard[i * 2 + j]; j++) {
      playersByPosition.guard[i * 2 + j].awards.push({ year, type: team });
    }
    
    // 2 forwards
    for (let j = 0; j < 2 && playersByPosition.forward[i * 2 + j]; j++) {
      playersByPosition.forward[i * 2 + j].awards.push({ year, type: team });
    }
    
    // 1 center
    if (playersByPosition.center[i]) {
      playersByPosition.center[i].awards.push({ year, type: team });
    }
  }
}

export function getSeasonLeaders(state: LeagueState): {
  points: { player: Player; value: number }[];
  rebounds: { player: Player; value: number }[];
  assists: { player: Player; value: number }[];
  steals: { player: Player; value: number }[];
  blocks: { player: Player; value: number }[];
} {
  const year = state.currentSeason.year;
  const qualifiedPlayers = Object.values(state.players)
    .filter(p => p.teamId && p.seasonStats[year]?.gamesPlayed >= 30);
  
  const getLeaders = (stat: keyof SeasonStats) => {
    return qualifiedPlayers
      .map(p => ({
        player: p,
        value: p.seasonStats[year][stat] as number / p.seasonStats[year].gamesPlayed
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  };
  
  return {
    points: getLeaders('points'),
    rebounds: getLeaders('rebounds'),
    assists: getLeaders('assists'),
    steals: getLeaders('steals'),
    blocks: getLeaders('blocks')
  };
}
