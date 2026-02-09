// ============================================
// League Engine - Ties All Systems Together
// ============================================

import { LeagueState, Season, Team, Player, DraftPick, LeagueSettings, Game, TeamStrategyData } from './types';
import { NBA_TEAMS, initializeAllTeams, generateCoach } from './data/teams';
import { generateRoster, generateFreeAgents, generatePlayer, emptySeasonStats } from './data/players';
import { generateRegularSeasonSchedule, simulateGame, updateStandings, selectAwards, getSeasonLeaders } from './systems/SeasonSystem';
import { generatePlayoffBracket, simulateNextPlayoffGame, simulateEntirePlayoffs, getPlayoffStatus, arePlayoffsComplete, selectFinalsMVP } from './systems/PlayoffSystem';
import { initializeDraft, runLottery, makePickSelection, simulateAIPick, DraftState } from './systems/DraftSystem';
import { processOffseasonDevelopment, processTrainingCamp, rollForInjury, processInjuryRecovery } from './systems/PlayerDevelopment';
import { CAP_VALUES, processEndOfSeason } from './systems/ContractSystem';
import { generateCoachingStaff, ExtendedCoach, generateCoach as generateExtendedCoach } from './systems/CoachingSystem';
import { createDefaultPhilosophy, createDefaultPlaybook, createDefaultRotation, createDefaultIdentity, TeamPhilosophy, RotationSettings } from './systems/TeamStrategy';
import { selectAllStars, simulateAllStarGame, AllStarGame, getAllStarDisplay } from './systems/AllStarSystem';
import { loadRealNBAData, isRealDataAvailable } from './data/realDataLoader';

export interface LeagueEngineOptions {
  useRealData?: boolean;
}

export class LeagueEngine {
  private state: LeagueState;
  private draftState: DraftState | null = null;
  private allStarData: AllStarGame | null = null;
  private onStateChange?: (state: LeagueState) => void;
  private useRealData: boolean;
  
  constructor(userTeamId: string = 'LAL', options: LeagueEngineOptions = {}) {
    this.useRealData = options.useRealData ?? false;
    this.state = this.initializeLeague(userTeamId);
  }

  /**
   * Check if real NBA data mode is available
   */
  static isRealDataModeAvailable(): boolean {
    return false; // Real data not yet implemented
  }
  
  private initializeLeague(userTeamId: string): LeagueState {
    const year = new Date().getFullYear();
    
    // Initialize settings
    const settings: LeagueSettings = {
      salaryCap: CAP_VALUES.salaryCap,
      luxuryTax: CAP_VALUES.luxuryTax,
      apron: CAP_VALUES.firstApron,
      minimumSalary: CAP_VALUES.minimumSalary,
      maximumSalary: CAP_VALUES.maximumSalary,
      midLevelException: CAP_VALUES.midLevelException,
      biAnnualException: CAP_VALUES.biAnnualException,
      rookieScale: {},
      numPlayoffTeams: 16,
      playoffFormat: '7-game',
      draftRounds: 2,
      draftLotteryTeams: 14
    };
    
    let teams: Record<string, Team>;
    let players: Record<string, Player>;
    let freeAgents: string[];
    
    // Load real NBA data if enabled and available
    if (this.useRealData && isRealDataAvailable()) {
      console.log('🏀 Loading Real NBA 2024-25 data...');
      const realData = loadRealNBAData();
      teams = realData.teams;
      players = realData.players;
      freeAgents = realData.freeAgents;
      
      // Initialize coaching staff and strategy for real teams
      for (const team of Object.values(teams)) {
        const coachingStaff = generateCoachingStaff();
        team.coach = coachingStaff.headCoach;
        
        const rosterPlayers = team.roster
          .map(id => players[id])
          .filter(Boolean) as Player[];
        
        team.strategy = {
          philosophy: createDefaultPhilosophy(),
          rotation: createDefaultRotation(rosterPlayers),
          playbook: createDefaultPlaybook(),
          identity: createDefaultIdentity(),
          coachingStaff
        };
        
        // Align philosophy with coach preferences
        if (team.strategy.philosophy && coachingStaff.headCoach.preferredOffense) {
          team.strategy.philosophy.offensiveSystem = coachingStaff.headCoach.preferredOffense;
          team.strategy.philosophy.defensiveScheme = coachingStaff.headCoach.preferredDefense;
          team.strategy.philosophy.pace = coachingStaff.headCoach.preferredPace;
          team.strategy.philosophy.developmentFocus = coachingStaff.headCoach.developmentFocus;
        }
        
        // Generate draft picks for next 7 years
        for (let y = 0; y < 7; y++) {
          if (!team.draftPicks.some(p => p.year === year + 1 + y && p.round === 1)) {
            team.draftPicks.push({
              year: year + 1 + y,
              round: 1,
              originalTeamId: team.id,
              currentTeamId: team.id,
              isSwap: false
            });
          }
          if (!team.draftPicks.some(p => p.year === year + 1 + y && p.round === 2)) {
            team.draftPicks.push({
              year: year + 1 + y,
              round: 2,
              originalTeamId: team.id,
              currentTeamId: team.id,
              isSwap: false
            });
          }
        }
      }
    } else {
      // Use generated data (default behavior)
      teams = initializeAllTeams();
      players = {};
      freeAgents = [];
      
      for (const team of Object.values(teams)) {
        const roster = generateRoster(team.id, 15);
        
        for (const player of roster) {
          players[player.id] = player;
          team.roster.push(player.id);
          team.payroll += player.contract.salary;
        }
        
        // Generate draft picks for next 7 years
        for (let y = 0; y < 7; y++) {
          team.draftPicks.push({
            year: year + 1 + y,
            round: 1,
            originalTeamId: team.id,
            currentTeamId: team.id,
            isSwap: false
          });
          team.draftPicks.push({
            year: year + 1 + y,
            round: 2,
            originalTeamId: team.id,
            currentTeamId: team.id,
            isSwap: false
          });
        }
        
        // Initialize coaching staff and team strategy
        const coachingStaff = generateCoachingStaff();
        team.coach = coachingStaff.headCoach;
        
        const rosterPlayers = roster.map(id => typeof id === 'string' ? players[id] : id).filter(Boolean) as Player[];
        
        team.strategy = {
          philosophy: createDefaultPhilosophy(),
          rotation: createDefaultRotation(rosterPlayers),
          playbook: createDefaultPlaybook(),
          identity: createDefaultIdentity(),
          coachingStaff
        };
        
        // Align philosophy with coach preferences
        if (team.strategy.philosophy && coachingStaff.headCoach.preferredOffense) {
          team.strategy.philosophy.offensiveSystem = coachingStaff.headCoach.preferredOffense;
          team.strategy.philosophy.defensiveScheme = coachingStaff.headCoach.preferredDefense;
          team.strategy.philosophy.pace = coachingStaff.headCoach.preferredPace;
          team.strategy.philosophy.developmentFocus = coachingStaff.headCoach.developmentFocus;
        }
      }
      
      // Generate free agents for non-real data mode
      const freeAgentsList = generateFreeAgents(100);
      for (const fa of freeAgentsList) {
        players[fa.id] = fa;
        freeAgents.push(fa.id);
      }
    }
    
    // Initialize season
    const schedule = generateRegularSeasonSchedule(teams, year);
    
    const season: Season = {
      year,
      phase: 'regular',
      week: 1,
      day: 1,
      schedule
    };
    
    return {
      settings,
      teams,
      players,
      freeAgents,
      currentSeason: season,
      seasonHistory: [],
      tradeHistory: [],
      userTeamId,
      records: {
        singleGamePoints: { value: 100, player: 'Wilt Chamberlain', year: 1962 },
        seasonPoints: { value: 4029, player: 'Wilt Chamberlain', year: 1962 },
        careerPoints: { value: 38390, player: 'LeBron James' },
        longestWinStreak: { value: 33, team: 'Lakers', year: 1972 },
        bestRecord: { wins: 73, losses: 9, team: 'Warriors', year: 2016 }
      }
    };
  }
  
  // Getters
  getState(): LeagueState { return this.state; }
  getUserTeam(): Team { return this.state.teams[this.state.userTeamId]; }
  getTeam(teamId: string): Team | undefined { return this.state.teams[teamId]; }
  getPlayer(playerId: string): Player | undefined { return this.state.players[playerId]; }
  getDraftState(): DraftState | null { return this.draftState; }
  getAllStarData(): AllStarGame | null { return this.allStarData; }
  
  // State change listener
  setOnStateChange(callback: (state: LeagueState) => void) {
    this.onStateChange = callback;
  }
  
  private notifyChange() {
    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
  }
  
  // Get standings sorted by conference
  getStandings(conference?: 'Eastern' | 'Western'): Team[] {
    let teams = Object.values(this.state.teams);
    
    if (conference) {
      teams = teams.filter(t => t.conference === conference);
    }
    
    return teams.sort((a, b) => {
      const aWinPct = a.wins / (a.wins + a.losses || 1);
      const bWinPct = b.wins / (b.wins + b.losses || 1);
      return bWinPct - aWinPct;
    });
  }
  
  // Get upcoming games for a team
  getUpcomingGames(teamId: string, limit: number = 10): Game[] {
    return this.state.currentSeason.schedule
      .filter(g => !g.played && (g.homeTeamId === teamId || g.awayTeamId === teamId))
      .slice(0, limit);
  }
  
  // Get recent games for a team
  getRecentGames(teamId: string, limit: number = 10): Game[] {
    return this.state.currentSeason.schedule
      .filter(g => g.played && (g.homeTeamId === teamId || g.awayTeamId === teamId))
      .slice(-limit)
      .reverse();
  }
  
  // Get playoff bracket status
  getPlayoffStatus() {
    return getPlayoffStatus(this.state);
  }
  
  // Get All-Star display data
  getAllStarDisplay() {
    if (!this.allStarData) return null;
    return getAllStarDisplay(this.allStarData, this.state);
  }
  
  // Get games played progress
  getSeasonProgress(): { played: number; total: number; percent: number } {
    const schedule = this.state.currentSeason.schedule.filter(g => !g.isPlayoff);
    const played = schedule.filter(g => g.played).length;
    const total = schedule.length;
    return {
      played,
      total,
      percent: total > 0 ? Math.round((played / total) * 100) : 0
    };
  }
  
  // Check if it's All-Star break
  private isAllStarBreak(): boolean {
    const progress = this.getSeasonProgress();
    return progress.percent >= 45 && progress.percent <= 55 && !this.allStarData?.game?.played;
  }
  
  // Simulate one day (play scheduled games)
  simulateDay(): Game[] {
    const season = this.state.currentSeason;
    
    // Handle different phases
    if (season.phase === 'playoffs') {
      return this.simulatePlayoffDay();
    }
    
    if (season.phase !== 'regular') {
      return [];
    }
    
    // Check for All-Star break
    if (this.isAllStarBreak() && !this.allStarData) {
      this.triggerAllStarGame();
      return [];
    }
    
    // Find next unplayed games (instead of matching exact day)
    // Sort by date and take the next batch
    const unplayedGames = season.schedule
      .filter(g => !g.played && !g.isPlayoff)
      .sort((a, b) => {
        if (a.date.year !== b.date.year) return a.date.year - b.date.year;
        if (a.date.month !== b.date.month) return a.date.month - b.date.month;
        return a.date.day - b.date.day;
      });
    
    if (unplayedGames.length === 0) {
      // No more regular season games - start playoffs
      this.startPlayoffs();
      this.notifyChange();
      return [];
    }
    
    // Get the date of the next game and find all games on that day
    const nextGameDate = unplayedGames[0].date;
    const todayGames = unplayedGames.filter(g => 
      g.date.year === nextGameDate.year &&
      g.date.month === nextGameDate.month &&
      g.date.day === nextGameDate.day
    );
    
    const playedGames: Game[] = [];
    
    for (const game of todayGames.slice(0, 15)) { // Max 15 games per day
      const simulated = simulateGame(game, this.state);
      
      // Update the game in schedule
      const index = season.schedule.findIndex(g => g.id === game.id);
      if (index >= 0) {
        season.schedule[index] = simulated;
      }
      
      // Update standings
      updateStandings(simulated, this.state);
      
      // Check for injuries
      if (simulated.boxScore) {
        for (const stats of [...simulated.boxScore.home, ...simulated.boxScore.away]) {
          const player = this.state.players[stats.playerId];
          if (player && !player.injury) {
            const injury = rollForInjury(player, stats.minutes);
            if (injury) {
              player.injury = injury;
            }
          }
        }
      }
      
      playedGames.push(simulated);
    }
    
    // Process injury recovery
    for (const player of Object.values(this.state.players)) {
      if (player.injury) {
        processInjuryRecovery(player);
      }
    }
    
    // Advance day counter
    season.day++;
    season.week = Math.ceil(season.day / 7);
    
    // Check for end of regular season
    const regularSeasonGames = season.schedule.filter(g => !g.isPlayoff);
    const gamesRemaining = regularSeasonGames.filter(g => !g.played).length;
    if (gamesRemaining === 0 && season.phase === 'regular') {
      this.startPlayoffs();
    }
    
    this.notifyChange();
    return playedGames;
  }
  
  // Simulate a playoff day
  private simulatePlayoffDay(): Game[] {
    const games: Game[] = [];
    
    // Simulate up to 4 playoff games per day
    for (let i = 0; i < 4; i++) {
      const game = simulateNextPlayoffGame(this.state);
      if (game) {
        games.push(game);
      } else {
        break;
      }
    }
    
    // Check if playoffs complete
    if (arePlayoffsComplete(this.state)) {
      // Award Finals MVP
      selectFinalsMVP(this.state);
      
      // Record championship
      const champion = this.state.currentSeason.playoffs?.champion;
      if (champion) {
        const team = this.state.teams[champion];
        if (team) {
          team.championships.push(this.state.currentSeason.year);
        }
      }
    }
    
    this.state.currentSeason.day++;
    this.notifyChange();
    return games;
  }
  
  // Trigger All-Star game
  private triggerAllStarGame(): void {
    this.allStarData = selectAllStars(this.state);
    this.allStarData = simulateAllStarGame(this.allStarData, this.state);
    this.notifyChange();
  }
  
  // Simulate a full week
  simulateWeek(): Game[] {
    const allGames: Game[] = [];
    for (let i = 0; i < 7; i++) {
      const games = this.simulateDay();
      allGames.push(...games);
    }
    this.state.currentSeason.week++;
    this.notifyChange();
    return allGames;
  }
  
  // Simulate to end of regular season
  simulateToPlayoffs(): void {
    while (this.state.currentSeason.phase === 'regular') {
      this.simulateDay();
    }
  }
  
  // Simulate entire playoffs
  simulatePlayoffs(): { champion: string; fmvp: Player | null } {
    const result = simulateEntirePlayoffs(this.state);
    
    // Record championship
    if (result.champion) {
      const team = this.state.teams[result.champion];
      if (team) {
        team.championships.push(this.state.currentSeason.year);
      }
    }
    
    this.notifyChange();
    return result;
  }
  
  // Start playoffs
  startPlayoffs(): void {
    this.state.currentSeason.phase = 'playoffs';
    this.state.currentSeason.playoffs = generatePlayoffBracket(
      this.state.teams, 
      this.state.currentSeason.year
    );
    this.notifyChange();
  }
  
  // End season and start offseason
  endSeason(): void {
    // Select awards
    selectAwards(this.state);
    
    // Archive season
    this.state.seasonHistory.push({ ...this.state.currentSeason });
    
    // Process contracts (expirations, etc.)
    for (const team of Object.values(this.state.teams)) {
      processEndOfSeason(team, this.state);
    }
    
    // Set phase to offseason
    this.state.currentSeason.phase = 'offseason';
    
    this.notifyChange();
  }
  
  // Start draft
  startDraft(): void {
    this.draftState = initializeDraft(
      this.state.currentSeason.year + 1,
      this.state.teams
    );
    this.state.currentSeason.phase = 'draft';
    
    // Run lottery
    this.draftState = runLottery(this.draftState, this.state.teams);
    
    this.notifyChange();
  }
  
  // Make a draft pick (user or AI)
  makeDraftPick(prospectId?: string): void {
    if (!this.draftState || this.draftState.phase === 'complete') return;
    
    const pickIndex = this.draftState.currentPick - 1;
    const teamId = this.draftState.draftOrder[pickIndex];
    
    if (teamId === this.state.userTeamId && prospectId) {
      // User pick
      const { draftState } = makePickSelection(this.draftState, prospectId, this.state);
      this.draftState = draftState;
    } else if (teamId !== this.state.userTeamId) {
      // AI pick
      const prospect = simulateAIPick(this.draftState, teamId, this.state);
      const { draftState } = makePickSelection(this.draftState, prospect.id, this.state);
      this.draftState = draftState;
    }
    
    this.notifyChange();
  }
  
  // Auto-pick for user (best available)
  autoPickDraft(): void {
    if (!this.draftState) return;
    
    const bestProspect = this.draftState.availableProspects[0];
    if (bestProspect) {
      this.makeDraftPick(bestProspect.id);
    }
  }
  
  // Simulate rest of draft
  simulateDraft(): void {
    while (this.draftState && this.draftState.phase !== 'complete') {
      const teamId = this.draftState.draftOrder[this.draftState.currentPick - 1];
      
      if (teamId === this.state.userTeamId) {
        this.autoPickDraft();
      } else {
        this.makeDraftPick();
      }
    }
    
    this.state.currentSeason.phase = 'free-agency';
    this.notifyChange();
  }
  
  // Complete offseason and start new season
  startNewSeason(): void {
    const newYear = this.state.currentSeason.year + 1;
    
    // Process offseason player development
    processOffseasonDevelopment(this.state);
    
    // Process training camp
    processTrainingCamp(this.state);
    
    // Age all players
    for (const player of Object.values(this.state.players)) {
      player.age++;
      player.yearsExperience++;
    }
    
    // Reset team records
    for (const team of Object.values(this.state.teams)) {
      team.wins = 0;
      team.losses = 0;
      team.streak = 0;
      team.lastTenGames = [];
    }
    
    // Generate new schedule
    const schedule = generateRegularSeasonSchedule(this.state.teams, newYear);
    
    // Create new season
    this.state.currentSeason = {
      year: newYear,
      phase: 'regular',
      week: 1,
      day: 1,
      schedule
    };
    
    // Initialize season stats for all players
    for (const player of Object.values(this.state.players)) {
      player.seasonStats[newYear] = emptySeasonStats();
    }
    
    // Reset draft and all-star data
    this.draftState = null;
    this.allStarData = null;
    
    this.notifyChange();
  }
  
  // Advance to next phase
  advancePhase(): void {
    const phase = this.state.currentSeason.phase;
    
    switch (phase) {
      case 'regular':
        this.simulateToPlayoffs();
        break;
      case 'playoffs':
        if (!arePlayoffsComplete(this.state)) {
          this.simulatePlayoffs();
        }
        this.endSeason();
        break;
      case 'offseason':
        this.startDraft();
        break;
      case 'draft':
        this.simulateDraft();
        break;
      case 'free-agency':
        this.startNewSeason();
        break;
    }
  }
  
  private getCurrentMonth(): number {
    const week = this.state.currentSeason.week;
    // Season starts in October (month 10)
    if (week <= 4) return 10;
    if (week <= 8) return 11;
    if (week <= 12) return 12;
    if (week <= 16) return 1;
    if (week <= 20) return 2;
    if (week <= 24) return 3;
    return 4;
  }
  
  // Get season leaders
  getLeaders() {
    return getSeasonLeaders(this.state);
  }
  
  // Get award winners for current/past seasons
  getAwardWinners(year?: number): Record<string, { player: Player; votes?: number }[]> {
    const targetYear = year || this.state.currentSeason.year;
    const winners: Record<string, { player: Player; votes?: number }[]> = {
      'MVP': [],
      'DPOY': [],
      'ROY': [],
      'SMOY': [],
      'MIP': [],
      'FMVP': [],
      'All-NBA-1st': [],
      'All-NBA-2nd': [],
      'All-NBA-3rd': [],
      'All-Defensive-1st': [],
      'All-Defensive-2nd': [],
      'All-Star': []
    };
    
    for (const player of Object.values(this.state.players)) {
      for (const award of player.awards) {
        if (award.year === targetYear && winners[award.type]) {
          winners[award.type].push({ player });
        }
      }
    }
    
    return winners;
  }
  
  // Get championship history
  getChampionshipHistory(): { year: number; team: Team; fmvp?: Player }[] {
    const history: { year: number; team: Team; fmvp?: Player }[] = [];
    
    for (const team of Object.values(this.state.teams)) {
      for (const year of team.championships) {
        const fmvp = Object.values(this.state.players).find(p =>
          p.awards.some(a => a.year === year && a.type === 'FMVP')
        );
        history.push({ year, team, fmvp });
      }
    }
    
    return history.sort((a, b) => b.year - a.year);
  }
  
  // Save/Load
  save(): string {
    return JSON.stringify({
      state: this.state,
      draftState: this.draftState,
      allStarData: this.allStarData
    });
  }
  
  load(saveData: string): void {
    const data = JSON.parse(saveData);
    this.state = data.state;
    this.draftState = data.draftState;
    this.allStarData = data.allStarData || null;
    this.notifyChange();
  }
  
  // Export for debugging
  exportState(): LeagueState {
    return this.state;
  }
}

// Singleton instance
let leagueEngine: LeagueEngine | null = null;

export function getLeagueEngine(): LeagueEngine {
  if (!leagueEngine) {
    leagueEngine = new LeagueEngine();
  }
  return leagueEngine;
}

export function createNewLeague(userTeamId: string): LeagueEngine {
  leagueEngine = new LeagueEngine(userTeamId);
  return leagueEngine;
}
