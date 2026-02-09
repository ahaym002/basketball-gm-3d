import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { LeagueEngine, LeagueEngineOptions } from '../gm/LeagueEngine'
import { LeagueState, Team, Player, Game, DraftProspect } from '../gm/types'

interface GameInitOptions {
  useRealData?: boolean;
}

interface GameStore {
  // Core state
  isInitialized: boolean
  isRealDataMode: boolean
  engine: LeagueEngine | null
  state: LeagueState | null
  
  // UI state
  isSimulating: boolean
  lastSimulatedGames: Game[]
  notifications: Notification[]
  
  // Actions
  initializeGame: (teamId: string, options?: GameInitOptions) => void
  resetGame: () => void
  
  // Simulation
  simulateDay: () => void
  simulateWeek: () => void
  simulateToEvent: () => void
  advancePhase: () => void
  
  // Team actions
  getUserTeam: () => Team | null
  getTeam: (id: string) => Team | null
  getTeamPlayers: (teamId: string) => Player[]
  
  // Player actions
  getPlayer: (id: string) => Player | null
  signFreeAgent: (playerId: string, years: number, salary: number) => boolean
  releasePlayer: (playerId: string) => void
  
  // Trade actions
  proposeTrade: (offer: TradeOffer) => boolean
  
  // Draft actions
  makeDraftPick: (prospectId: string) => void
  getAvailableProspects: () => DraftProspect[]
  
  // Match integration
  recordGameResult: (gameId: string, homeScore: number, awayScore: number, boxScore?: any) => void
  
  // Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  dismissNotification: (id: string) => void
  clearNotifications: () => void
  
  // Helpers
  getStandings: (conference?: 'Eastern' | 'Western') => Team[]
  getUpcomingGames: (teamId: string, limit?: number) => Game[]
  getRecentGames: (teamId: string, limit?: number) => Game[]
  getFreeAgents: () => Player[]
  getSeasonProgress: () => { played: number; total: number; percent: number }
}

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: number
}

interface TradeOffer {
  targetTeamId: string
  sendPlayerIds: string[]
  receivePlayerIds: string[]
  sendPickIds?: string[]
  receivePickIds?: string[]
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isInitialized: false,
      isRealDataMode: false,
      engine: null,
      state: null,
      isSimulating: false,
      lastSimulatedGames: [],
      notifications: [],

      // Initialize game with selected team and options
      initializeGame: (teamId: string, options: GameInitOptions = {}) => {
        const engine = new LeagueEngine(teamId, {
          useRealData: options.useRealData ?? false
        })
        
        engine.setOnStateChange((newState) => {
          set({ state: newState })
        })
        
        set({
          isInitialized: true,
          isRealDataMode: options.useRealData ?? false,
          engine,
          state: engine.getState(),
        })
      },

      // Reset and start fresh
      resetGame: () => {
        set({
          isInitialized: false,
          engine: null,
          state: null,
          lastSimulatedGames: [],
          notifications: [],
        })
      },

      // Simulate one day
      simulateDay: () => {
        const { engine } = get()
        if (!engine) return
        
        set({ isSimulating: true })
        
        try {
          const games = engine.simulateDay()
          set({ 
            lastSimulatedGames: games,
            state: engine.getState(),
            isSimulating: false 
          })
          
          // Add notifications for user team games
          const userTeamId = engine.getState().userTeamId
          const userGames = games.filter(g => 
            g.homeTeamId === userTeamId || g.awayTeamId === userTeamId
          )
          
          userGames.forEach(game => {
            const isHome = game.homeTeamId === userTeamId
            const won = isHome 
              ? (game.homeScore || 0) > (game.awayScore || 0)
              : (game.awayScore || 0) > (game.homeScore || 0)
            
            get().addNotification({
              type: won ? 'success' : 'warning',
              title: won ? 'Victory!' : 'Defeat',
              message: `${game.homeScore} - ${game.awayScore} ${isHome ? 'vs' : '@'} ${
                isHome ? game.awayTeamId : game.homeTeamId
              }`
            })
          })
        } catch (e) {
          set({ isSimulating: false })
          console.error('Simulation error:', e)
        }
      },

      // Simulate full week
      simulateWeek: () => {
        const { engine } = get()
        if (!engine) return
        
        set({ isSimulating: true })
        
        try {
          const games = engine.simulateWeek()
          set({ 
            lastSimulatedGames: games,
            state: engine.getState(),
            isSimulating: false 
          })
        } catch (e) {
          set({ isSimulating: false })
        }
      },

      // Simulate to next major event
      simulateToEvent: () => {
        const { engine, state } = get()
        if (!engine || !state) return
        
        set({ isSimulating: true })
        
        try {
          if (state.currentSeason.phase === 'regular') {
            engine.simulateToPlayoffs()
          } else if (state.currentSeason.phase === 'playoffs') {
            engine.simulatePlayoffs()
            engine.endSeason()
          }
          
          set({ 
            state: engine.getState(),
            isSimulating: false 
          })
        } catch (e) {
          set({ isSimulating: false })
        }
      },

      // Advance to next phase
      advancePhase: () => {
        const { engine } = get()
        if (!engine) return
        
        engine.advancePhase()
        set({ state: engine.getState() })
      },

      // Get user's team
      getUserTeam: () => {
        const { engine } = get()
        return engine?.getUserTeam() || null
      },

      // Get any team
      getTeam: (id: string) => {
        const { state } = get()
        return state?.teams[id] || null
      },

      // Get players on a team
      getTeamPlayers: (teamId: string) => {
        const { state } = get()
        if (!state) return []
        
        const team = state.teams[teamId]
        if (!team) return []
        
        return team.roster.map(id => state.players[id]).filter(Boolean)
      },

      // Get a player
      getPlayer: (id: string) => {
        const { state } = get()
        return state?.players[id] || null
      },

      // Sign a free agent
      signFreeAgent: (playerId: string, years: number, salary: number) => {
        const { state, engine } = get()
        if (!state || !engine) return false
        
        const player = state.players[playerId]
        const team = state.teams[state.userTeamId]
        
        if (!player || !team) return false
        if (!state.freeAgents.includes(playerId)) return false
        
        // Check cap space
        const newPayroll = team.payroll + salary
        if (newPayroll > team.salaryCap && !team.exceptions.some(e => e.remaining >= salary)) {
          get().addNotification({
            type: 'error',
            title: 'Over Cap',
            message: 'Not enough cap space or exceptions available'
          })
          return false
        }
        
        // Sign the player
        player.teamId = team.id
        player.contract = {
          salary,
          years,
          type: 'standard',
          noTradeClause: false,
          signedYear: state.currentSeason.year
        }
        
        team.roster.push(playerId)
        team.payroll += salary
        
        // Remove from free agents
        const faIndex = state.freeAgents.indexOf(playerId)
        if (faIndex >= 0) {
          state.freeAgents.splice(faIndex, 1)
        }
        
        set({ state: { ...state } })
        
        get().addNotification({
          type: 'success',
          title: 'Player Signed',
          message: `${player.firstName} ${player.lastName} signed for ${years} years, $${(salary / 1000000).toFixed(1)}M/yr`
        })
        
        return true
      },

      // Release a player
      releasePlayer: (playerId: string) => {
        const { state } = get()
        if (!state) return
        
        const player = state.players[playerId]
        const team = state.teams[state.userTeamId]
        
        if (!player || !team) return
        if (player.teamId !== team.id) return
        
        // Remove from roster
        const index = team.roster.indexOf(playerId)
        if (index >= 0) {
          team.roster.splice(index, 1)
        }
        
        team.payroll -= player.contract.salary
        player.teamId = null
        
        // Add to free agents
        state.freeAgents.push(playerId)
        
        set({ state: { ...state } })
        
        get().addNotification({
          type: 'info',
          title: 'Player Released',
          message: `${player.firstName} ${player.lastName} has been released`
        })
      },

      // Propose a trade
      proposeTrade: (offer: TradeOffer) => {
        const { state } = get()
        if (!state) return false
        
        // TODO: Implement trade logic with AI evaluation
        // For now, accept trades that are relatively fair
        
        const sendValue = offer.sendPlayerIds.reduce((sum, id) => {
          const p = state.players[id]
          return sum + (p?.stats.overall || 0)
        }, 0)
        
        const receiveValue = offer.receivePlayerIds.reduce((sum, id) => {
          const p = state.players[id]
          return sum + (p?.stats.overall || 0)
        }, 0)
        
        // Simple acceptance logic - accept if within 10% value
        const ratio = sendValue / (receiveValue || 1)
        const accepted = ratio >= 0.9 && ratio <= 1.1
        
        if (accepted) {
          // Execute the trade
          const userTeam = state.teams[state.userTeamId]
          const targetTeam = state.teams[offer.targetTeamId]
          
          // Move players
          offer.sendPlayerIds.forEach(id => {
            const player = state.players[id]
            if (player) {
              player.teamId = offer.targetTeamId
              const idx = userTeam.roster.indexOf(id)
              if (idx >= 0) userTeam.roster.splice(idx, 1)
              targetTeam.roster.push(id)
              userTeam.payroll -= player.contract.salary
              targetTeam.payroll += player.contract.salary
            }
          })
          
          offer.receivePlayerIds.forEach(id => {
            const player = state.players[id]
            if (player) {
              player.teamId = state.userTeamId
              const idx = targetTeam.roster.indexOf(id)
              if (idx >= 0) targetTeam.roster.splice(idx, 1)
              userTeam.roster.push(id)
              targetTeam.payroll -= player.contract.salary
              userTeam.payroll += player.contract.salary
            }
          })
          
          set({ state: { ...state } })
          
          get().addNotification({
            type: 'success',
            title: 'Trade Accepted!',
            message: `Trade with ${targetTeam.city} ${targetTeam.name} completed`
          })
        } else {
          get().addNotification({
            type: 'error',
            title: 'Trade Rejected',
            message: 'The other team declined your offer'
          })
        }
        
        return accepted
      },

      // Make a draft pick
      makeDraftPick: (prospectId: string) => {
        const { engine } = get()
        if (!engine) return
        
        engine.makeDraftPick(prospectId)
        set({ state: engine.getState() })
      },

      // Get available draft prospects
      getAvailableProspects: () => {
        const { engine } = get()
        const draftState = engine?.getDraftState()
        return draftState?.availableProspects || []
      },
      
      // Record a manually played game result
      recordGameResult: (gameId: string, homeScore: number, awayScore: number, boxScore?: any) => {
        const { state, engine } = get()
        if (!state || !engine) return
        
        // Find the game in schedule
        const gameIndex = state.currentSeason.schedule.findIndex(g => g.id === gameId)
        if (gameIndex < 0) return
        
        const game = state.currentSeason.schedule[gameIndex]
        if (game.played) return // Already played
        
        // Update the game
        game.played = true
        game.homeScore = homeScore
        game.awayScore = awayScore
        if (boxScore) {
          game.boxScore = boxScore
        }
        
        // Update standings
        const homeTeam = state.teams[game.homeTeamId]
        const awayTeam = state.teams[game.awayTeamId]
        
        if (homeScore > awayScore) {
          homeTeam.wins++
          awayTeam.losses++
          homeTeam.streak = homeTeam.streak >= 0 ? homeTeam.streak + 1 : 1
          awayTeam.streak = awayTeam.streak <= 0 ? awayTeam.streak - 1 : -1
          homeTeam.lastTenGames = ['W', ...homeTeam.lastTenGames.slice(0, 9)]
          awayTeam.lastTenGames = ['L', ...awayTeam.lastTenGames.slice(0, 9)]
        } else {
          awayTeam.wins++
          homeTeam.losses++
          awayTeam.streak = awayTeam.streak >= 0 ? awayTeam.streak + 1 : 1
          homeTeam.streak = homeTeam.streak <= 0 ? homeTeam.streak - 1 : -1
          awayTeam.lastTenGames = ['W', ...awayTeam.lastTenGames.slice(0, 9)]
          homeTeam.lastTenGames = ['L', ...homeTeam.lastTenGames.slice(0, 9)]
        }
        
        // Update player stats if box score provided
        if (boxScore) {
          const year = state.currentSeason.year
          const updateStats = (stats: any[]) => {
            for (const playerStats of stats) {
              const player = state.players[playerStats.playerId]
              if (!player) continue
              
              if (!player.seasonStats[year]) {
                player.seasonStats[year] = {
                  gamesPlayed: 0,
                  gamesStarted: 0,
                  minutesPerGame: 0,
                  points: 0,
                  rebounds: 0,
                  assists: 0,
                  steals: 0,
                  blocks: 0,
                  turnovers: 0,
                  fieldGoalsMade: 0,
                  fieldGoalsAttempted: 0,
                  threePointersMade: 0,
                  threePointersAttempted: 0,
                  freeThrowsMade: 0,
                  freeThrowsAttempted: 0,
                  personalFouls: 0,
                  plusMinus: 0
                }
              }
              
              const seasonStats = player.seasonStats[year]
              seasonStats.gamesPlayed++
              if (playerStats.minutes >= 20) seasonStats.gamesStarted++
              seasonStats.points += playerStats.points || 0
              seasonStats.rebounds += playerStats.rebounds || 0
              seasonStats.assists += playerStats.assists || 0
              seasonStats.steals += playerStats.steals || 0
              seasonStats.blocks += playerStats.blocks || 0
              seasonStats.turnovers += playerStats.turnovers || 0
              seasonStats.fieldGoalsMade += playerStats.fgm || 0
              seasonStats.fieldGoalsAttempted += playerStats.fga || 0
              seasonStats.threePointersMade += playerStats.tpm || 0
              seasonStats.threePointersAttempted += playerStats.tpa || 0
              seasonStats.freeThrowsMade += playerStats.ftm || 0
              seasonStats.freeThrowsAttempted += playerStats.fta || 0
              seasonStats.personalFouls += playerStats.fouls || 0
              seasonStats.plusMinus += playerStats.plusMinus || 0
              seasonStats.minutesPerGame = (seasonStats.minutesPerGame * (seasonStats.gamesPlayed - 1) + playerStats.minutes) / seasonStats.gamesPlayed
            }
          }
          
          if (boxScore.home) updateStats(boxScore.home)
          if (boxScore.away) updateStats(boxScore.away)
        }
        
        // Show notification
        const userTeamId = state.userTeamId
        const isUserGame = game.homeTeamId === userTeamId || game.awayTeamId === userTeamId
        
        if (isUserGame) {
          const isHome = game.homeTeamId === userTeamId
          const userScore = isHome ? homeScore : awayScore
          const oppScore = isHome ? awayScore : homeScore
          const won = userScore > oppScore
          const opponent = state.teams[isHome ? game.awayTeamId : game.homeTeamId]
          
          get().addNotification({
            type: won ? 'success' : 'warning',
            title: won ? 'Victory!' : 'Defeat',
            message: `Final: ${userScore}-${oppScore} ${isHome ? 'vs' : '@'} ${opponent?.city} ${opponent?.name}`
          })
        }
        
        set({ state: { ...state } })
      },

      // Add a notification
      addNotification: (notification) => {
        const id = Math.random().toString(36).substr(2, 9)
        set(state => ({
          notifications: [
            ...state.notifications,
            { ...notification, id, timestamp: Date.now() }
          ].slice(-10) // Keep last 10
        }))
      },

      // Dismiss a notification
      dismissNotification: (id: string) => {
        set(state => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }))
      },

      // Clear all notifications
      clearNotifications: () => {
        set({ notifications: [] })
      },

      // Get standings
      getStandings: (conference?: 'Eastern' | 'Western') => {
        const { engine } = get()
        return engine?.getStandings(conference) || []
      },

      // Get upcoming games
      getUpcomingGames: (teamId: string, limit = 10) => {
        const { engine } = get()
        return engine?.getUpcomingGames(teamId, limit) || []
      },

      // Get recent games
      getRecentGames: (teamId: string, limit = 10) => {
        const { engine } = get()
        return engine?.getRecentGames(teamId, limit) || []
      },

      // Get free agents
      getFreeAgents: () => {
        const { state } = get()
        if (!state) return []
        
        return state.freeAgents
          .map(id => state.players[id])
          .filter(Boolean)
          .sort((a, b) => b.stats.overall - a.stats.overall)
      },

      // Get season progress
      getSeasonProgress: () => {
        const { engine } = get()
        return engine?.getSeasonProgress() || { played: 0, total: 0, percent: 0 }
      },
    }),
    {
      name: 'basketball-gm-storage',
      partialize: (state) => ({
        // Only persist minimal data for save/load
        // Engine state is persisted separately
      }),
    }
  )
)
