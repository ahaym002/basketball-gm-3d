// ============================================
// Live Match Simulation Engine
// ============================================

import { Player, Team, BoxScoreStats } from '../gm/types'

export type GamePhase = 'pregame' | 'playing' | 'timeout' | 'halftime' | 'endquarter' | 'postgame'
export type PaceControl = 'push' | 'normal' | 'slow'
export type OffensiveFocus = 'inside' | 'balanced' | 'threes'
export type DefensiveScheme = 'man' | 'zone' | 'press'
export type PlayCall = 'none' | 'iso' | 'pickroll' | 'postup' | 'fastbreak' | 'alleyoop'

export interface PlayerPosition {
  playerId: string
  x: number  // 0-100 (court percentage)
  y: number  // 0-100
  hasBall: boolean
  isActive: boolean // on court
}

export interface BallPosition {
  x: number
  y: number
  holder?: string // playerId or undefined if in air
  isShot: boolean
  shotTarget?: { x: number; y: number }
}

export interface PlayEvent {
  id: string
  time: number // seconds remaining in quarter
  quarter: number
  type: 'shot' | 'miss' | 'rebound' | 'assist' | 'turnover' | 'steal' | 'block' | 'foul' | 'freethrow' | 'timeout' | 'substitution' | 'jumpball' | 'violation'
  team: 'home' | 'away'
  playerId?: string
  playerName?: string
  secondaryPlayerId?: string
  secondaryPlayerName?: string
  description: string
  points?: number
  homeScore: number
  awayScore: number
  isMomentum?: boolean
  isClutch?: boolean
}

export interface PlayerGameStats extends BoxScoreStats {
  isOnCourt: boolean
  fouls: number
  isHot: boolean
  isCold: boolean
  grade: string
}

export interface CoachingSettings {
  pace: PaceControl
  offensiveFocus: OffensiveFocus
  defensiveScheme: DefensiveScheme
  currentPlay: PlayCall
  timeoutsRemaining: number
}

export interface MatchState {
  gameId: string
  phase: GamePhase
  quarter: number
  timeRemaining: number // seconds in quarter
  shotClock: number
  homeTeam: Team
  awayTeam: Team
  homeScore: number
  awayScore: number
  possession: 'home' | 'away'
  
  // Positions
  playerPositions: PlayerPosition[]
  ball: BallPosition
  
  // Stats
  homeStats: Record<string, PlayerGameStats>
  awayStats: Record<string, PlayerGameStats>
  
  // Rosters on court (5 each)
  homeLineup: string[]
  awayLineup: string[]
  
  // Full rosters
  homePlayers: Player[]
  awayPlayers: Player[]
  
  // Events
  playByPlay: PlayEvent[]
  
  // Coaching
  homeCoaching: CoachingSettings
  awayCoaching: CoachingSettings
  
  // Momentum & streaks
  momentum: number // -100 to 100 (negative = away, positive = home)
  homeStreak: number
  awayStreak: number
  
  // Simulation
  simSpeed: number // 0 = paused, 1 = real-time, 2/4/8 = accelerated
  isUserHome: boolean
}

const QUARTER_LENGTH = 720 // 12 minutes in seconds
const SHOT_CLOCK = 24

export class MatchEngine {
  private state: MatchState
  private onUpdate: (state: MatchState) => void
  private intervalId: NodeJS.Timeout | null = null
  private tickRate = 100 // ms between updates at 1x speed
  
  constructor(
    homeTeam: Team,
    awayTeam: Team,
    homePlayers: Player[],
    awayPlayers: Player[],
    isUserHome: boolean,
    onUpdate: (state: MatchState) => void
  ) {
    this.onUpdate = onUpdate
    this.state = this.initializeMatch(homeTeam, awayTeam, homePlayers, awayPlayers, isUserHome)
  }
  
  private initializeMatch(
    homeTeam: Team,
    awayTeam: Team,
    homePlayers: Player[],
    awayPlayers: Player[],
    isUserHome: boolean
  ): MatchState {
    // Sort players by overall and pick starting 5
    const sortedHome = [...homePlayers].sort((a, b) => b.stats.overall - a.stats.overall)
    const sortedAway = [...awayPlayers].sort((a, b) => b.stats.overall - a.stats.overall)
    
    const homeLineup = sortedHome.slice(0, 5).map(p => p.id)
    const awayLineup = sortedAway.slice(0, 5).map(p => p.id)
    
    // Initialize stats for all players
    const homeStats: Record<string, PlayerGameStats> = {}
    const awayStats: Record<string, PlayerGameStats> = {}
    
    homePlayers.forEach(p => {
      homeStats[p.id] = this.createEmptyStats(homeLineup.includes(p.id))
    })
    awayPlayers.forEach(p => {
      awayStats[p.id] = this.createEmptyStats(awayLineup.includes(p.id))
    })
    
    // Initialize positions
    const playerPositions = this.initializePositions(homeLineup, awayLineup)
    
    return {
      gameId: `game-${Date.now()}`,
      phase: 'pregame',
      quarter: 1,
      timeRemaining: QUARTER_LENGTH,
      shotClock: SHOT_CLOCK,
      homeTeam,
      awayTeam,
      homeScore: 0,
      awayScore: 0,
      possession: Math.random() > 0.5 ? 'home' : 'away',
      playerPositions,
      ball: { x: 50, y: 50, isShot: false },
      homeStats,
      awayStats,
      homeLineup,
      awayLineup,
      homePlayers,
      awayPlayers,
      playByPlay: [],
      homeCoaching: {
        pace: 'normal',
        offensiveFocus: 'balanced',
        defensiveScheme: 'man',
        currentPlay: 'none',
        timeoutsRemaining: 7
      },
      awayCoaching: {
        pace: 'normal',
        offensiveFocus: 'balanced',
        defensiveScheme: 'man',
        currentPlay: 'none',
        timeoutsRemaining: 7
      },
      momentum: 0,
      homeStreak: 0,
      awayStreak: 0,
      simSpeed: 0,
      isUserHome
    }
  }
  
  private createEmptyStats(isOnCourt: boolean): PlayerGameStats {
    return {
      playerId: '',
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
      isOnCourt,
      isHot: false,
      isCold: false,
      grade: 'C'
    }
  }
  
  private initializePositions(homeLineup: string[], awayLineup: string[]): PlayerPosition[] {
    const positions: PlayerPosition[] = []
    
    // Home team positions (left side)
    const homeFormation = [
      { x: 20, y: 50 },  // PG
      { x: 15, y: 30 },  // SG
      { x: 15, y: 70 },  // SF
      { x: 8, y: 35 },   // PF
      { x: 8, y: 65 },   // C
    ]
    
    // Away team positions (right side)
    const awayFormation = [
      { x: 80, y: 50 },  // PG
      { x: 85, y: 30 },  // SG
      { x: 85, y: 70 },  // SF
      { x: 92, y: 35 },  // PF
      { x: 92, y: 65 },  // C
    ]
    
    homeLineup.forEach((id, i) => {
      positions.push({
        playerId: id,
        x: homeFormation[i].x,
        y: homeFormation[i].y,
        hasBall: false,
        isActive: true
      })
    })
    
    awayLineup.forEach((id, i) => {
      positions.push({
        playerId: id,
        x: awayFormation[i].x,
        y: awayFormation[i].y,
        hasBall: false,
        isActive: true
      })
    })
    
    return positions
  }
  
  getState(): MatchState {
    return this.state
  }
  
  // Control methods
  start() {
    this.state.phase = 'playing'
    this.setSpeed(1)
    this.addEvent('jumpball', this.state.possession, undefined, 'Jump ball!')
  }
  
  pause() {
    this.setSpeed(0)
  }
  
  setSpeed(speed: number) {
    this.state.simSpeed = speed
    
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    
    if (speed > 0 && this.state.phase === 'playing') {
      const interval = this.tickRate / speed
      this.intervalId = setInterval(() => this.tick(), interval)
    }
    
    this.notifyUpdate()
  }
  
  simToEnd() {
    this.state.simSpeed = 100
    while (this.state.phase !== 'postgame') {
      this.tick()
    }
    this.state.simSpeed = 0
    this.notifyUpdate()
  }
  
  callTimeout() {
    const coaching = this.state.isUserHome ? this.state.homeCoaching : this.state.awayCoaching
    if (coaching.timeoutsRemaining > 0 && this.state.phase === 'playing') {
      coaching.timeoutsRemaining--
      this.state.phase = 'timeout'
      this.pause()
      
      // Reset momentum slightly
      this.state.momentum *= 0.5
      
      this.addEvent('timeout', this.state.isUserHome ? 'home' : 'away', undefined, 
        `Timeout called by ${this.state.isUserHome ? this.state.homeTeam.name : this.state.awayTeam.name}`)
      
      // Auto-resume after 3 seconds at current speed
      setTimeout(() => {
        if (this.state.phase === 'timeout') {
          this.state.phase = 'playing'
          this.setSpeed(this.state.simSpeed || 1)
        }
      }, 3000)
    }
  }
  
  makeSubstitution(playerOutId: string, playerInId: string) {
    const isHome = this.state.homeLineup.includes(playerOutId)
    const lineup = isHome ? this.state.homeLineup : this.state.awayLineup
    const stats = isHome ? this.state.homeStats : this.state.awayStats
    const players = isHome ? this.state.homePlayers : this.state.awayPlayers
    
    const outIndex = lineup.indexOf(playerOutId)
    if (outIndex === -1) return
    
    // Check player is on bench
    if (lineup.includes(playerInId)) return
    
    lineup[outIndex] = playerInId
    stats[playerOutId].isOnCourt = false
    stats[playerInId].isOnCourt = true
    
    // Update positions
    const outPlayer = this.state.playerPositions.find(p => p.playerId === playerOutId)
    if (outPlayer) {
      outPlayer.playerId = playerInId
      outPlayer.hasBall = false
    }
    
    const playerOut = players.find(p => p.id === playerOutId)
    const playerIn = players.find(p => p.id === playerInId)
    
    this.addEvent('substitution', isHome ? 'home' : 'away', playerInId,
      `${playerIn?.lastName || 'Player'} checks in for ${playerOut?.lastName || 'Player'}`)
    
    this.notifyUpdate()
  }
  
  setCoaching(setting: keyof CoachingSettings, value: any) {
    const coaching = this.state.isUserHome ? this.state.homeCoaching : this.state.awayCoaching
    ;(coaching as any)[setting] = value
    this.notifyUpdate()
  }
  
  resumeFromTimeout() {
    if (this.state.phase === 'timeout' || this.state.phase === 'halftime' || this.state.phase === 'endquarter') {
      this.state.phase = 'playing'
      this.setSpeed(this.state.simSpeed || 1)
    }
  }
  
  // Simulation
  private tick() {
    if (this.state.phase !== 'playing') return
    
    // Advance time
    this.state.timeRemaining -= 0.5
    this.state.shotClock -= 0.5
    
    // Update minutes played
    const allOnCourt = [...this.state.homeLineup, ...this.state.awayLineup]
    allOnCourt.forEach(id => {
      const stats = this.state.homeStats[id] || this.state.awayStats[id]
      if (stats) stats.minutes += 0.5 / 60
    })
    
    // Shot clock violation
    if (this.state.shotClock <= 0) {
      this.turnover('shotclock')
      return
    }
    
    // End of quarter
    if (this.state.timeRemaining <= 0) {
      this.endQuarter()
      return
    }
    
    // Simulate possession (every ~3-5 seconds of game time)
    if (Math.random() < 0.15) {
      this.simulatePossession()
    }
    
    // Update player positions for visual effect
    this.updatePositions()
    
    this.notifyUpdate()
  }
  
  private simulatePossession() {
    const isHome = this.state.possession === 'home'
    const offTeam = isHome ? this.state.homeLineup : this.state.awayLineup
    const defTeam = isHome ? this.state.awayLineup : this.state.homeLineup
    const offPlayers = isHome ? this.state.homePlayers : this.state.awayPlayers
    const defPlayers = isHome ? this.state.awayPlayers : this.state.homePlayers
    const coaching = isHome ? this.state.homeCoaching : this.state.awayCoaching
    const defCoaching = isHome ? this.state.awayCoaching : this.state.homeCoaching
    
    // Select shooter based on ratings and coaching
    const onCourtPlayers = offPlayers.filter(p => offTeam.includes(p.id))
    const shooter = this.selectShooter(onCourtPlayers, coaching)
    
    // Calculate shot quality based on matchups and coaching
    const shotQuality = this.calculateShotQuality(shooter, coaching, defCoaching)
    
    // Determine shot type
    const shotType = this.determineShotType(shooter, coaching, shotQuality)
    
    // Attempt shot
    const made = this.attemptShot(shooter, shotType, shotQuality)
    
    if (made) {
      const points = shotType === 'three' ? 3 : 2
      if (isHome) {
        this.state.homeScore += points
        this.state.homeStreak++
        this.state.awayStreak = 0
      } else {
        this.state.awayScore += points
        this.state.awayStreak++
        this.state.homeStreak = 0
      }
      
      // Update stats
      const stats = isHome ? this.state.homeStats[shooter.id] : this.state.awayStats[shooter.id]
      stats.points += points
      stats.fgm++
      stats.fga++
      if (shotType === 'three') {
        stats.tpm++
        stats.tpa++
      }
      
      // Check for assist
      if (Math.random() < 0.6) {
        const assister = onCourtPlayers.find(p => p.id !== shooter.id && Math.random() < 0.3)
        if (assister) {
          const assistStats = isHome ? this.state.homeStats[assister.id] : this.state.awayStats[assister.id]
          assistStats.assists++
          
          this.addEvent('shot', isHome ? 'home' : 'away', shooter.id,
            `${shooter.lastName} ${shotType === 'three' ? 'three-pointer' : 'jumper'}! Assisted by ${assister.lastName}`,
            points, assister.id)
        } else {
          this.addEvent('shot', isHome ? 'home' : 'away', shooter.id,
            `${shooter.lastName} ${shotType === 'three' ? 'drains a three' : 'scores'}!`, points)
        }
      } else {
        this.addEvent('shot', isHome ? 'home' : 'away', shooter.id,
          `${shooter.lastName} ${shotType === 'three' ? 'drains a three' : 'scores'}!`, points)
      }
      
      // Update momentum
      this.state.momentum += isHome ? 5 : -5
      this.state.momentum = Math.max(-100, Math.min(100, this.state.momentum))
      
      // Check for hot streak
      const streak = isHome ? this.state.homeStreak : this.state.awayStreak
      if (streak >= 3) {
        stats.isHot = true
      }
      
      // Switch possession
      this.switchPossession()
      
    } else {
      // Miss
      const stats = isHome ? this.state.homeStats[shooter.id] : this.state.awayStats[shooter.id]
      stats.fga++
      if (shotType === 'three') stats.tpa++
      
      // Check for block
      const blockedChance = 0.08
      const defOnCourt = defPlayers.filter(p => defTeam.includes(p.id))
      const blocker = defOnCourt.find(p => Math.random() < blockedChance * (p.stats.blocking / 100))
      
      if (blocker) {
        const blockStats = isHome ? this.state.awayStats[blocker.id] : this.state.homeStats[blocker.id]
        blockStats.blocks++
        this.addEvent('block', isHome ? 'away' : 'home', blocker.id,
          `${blocker.lastName} blocks ${shooter.lastName}!`)
      } else {
        this.addEvent('miss', isHome ? 'home' : 'away', shooter.id,
          `${shooter.lastName} misses the ${shotType === 'three' ? 'three' : 'shot'}`)
      }
      
      // Rebound
      this.simulateRebound(isHome)
    }
    
    // Reset shot clock
    this.state.shotClock = SHOT_CLOCK
  }
  
  private selectShooter(players: Player[], coaching: CoachingSettings): Player {
    // Weight by overall and coaching focus
    const weights = players.map(p => {
      let weight = p.stats.overall
      
      if (coaching.offensiveFocus === 'threes') {
        weight += p.stats.threePoint * 0.5
      } else if (coaching.offensiveFocus === 'inside') {
        weight += p.stats.insideScoring * 0.5
      }
      
      // Hot players get boost
      const stats = this.state.homeStats[p.id] || this.state.awayStats[p.id]
      if (stats?.isHot) weight *= 1.3
      
      return weight
    })
    
    const total = weights.reduce((a, b) => a + b, 0)
    let rand = Math.random() * total
    
    for (let i = 0; i < players.length; i++) {
      rand -= weights[i]
      if (rand <= 0) return players[i]
    }
    
    return players[0]
  }
  
  private calculateShotQuality(shooter: Player, coaching: CoachingSettings, defCoaching: CoachingSettings): number {
    let quality = 50
    
    // Pace affects shot quality
    if (coaching.pace === 'push') quality -= 5
    if (coaching.pace === 'slow') quality += 5
    
    // Play calls
    if (coaching.currentPlay !== 'none') quality += 10
    
    // Defense affects quality
    if (defCoaching.defensiveScheme === 'press') quality -= 8
    if (defCoaching.defensiveScheme === 'zone') quality -= 3
    
    // Momentum
    const momentumBonus = this.state.momentum * 0.1
    quality += this.state.possession === 'home' ? momentumBonus : -momentumBonus
    
    return Math.max(20, Math.min(80, quality))
  }
  
  private determineShotType(shooter: Player, coaching: CoachingSettings, quality: number): 'two' | 'three' {
    let threeChance = 0.35
    
    if (coaching.offensiveFocus === 'threes') threeChance = 0.55
    if (coaching.offensiveFocus === 'inside') threeChance = 0.2
    
    // Player tendency
    if (shooter.stats.threePoint > 75) threeChance += 0.1
    if (shooter.stats.threePoint < 60) threeChance -= 0.15
    
    return Math.random() < threeChance ? 'three' : 'two'
  }
  
  private attemptShot(shooter: Player, type: 'two' | 'three', quality: number): boolean {
    let baseChance = type === 'three' 
      ? (shooter.stats.threePoint / 100) * 0.4 
      : (shooter.stats.insideScoring / 100) * 0.55
    
    // Adjust for quality
    baseChance *= (quality / 50)
    
    // Hot/cold streaks
    const stats = this.state.homeStats[shooter.id] || this.state.awayStats[shooter.id]
    if (stats?.isHot) baseChance *= 1.15
    if (stats?.isCold) baseChance *= 0.85
    
    // Clutch moments
    if (this.isClutchTime()) {
      baseChance *= (shooter.stats.clutch / 100) * 0.3 + 0.85
    }
    
    return Math.random() < baseChance
  }
  
  private simulateRebound(offenseWasHome: boolean) {
    const offRebChance = 0.25 // Offensive rebound chance
    const gotOffensiveRebound = Math.random() < offRebChance
    
    const reboundingTeam = gotOffensiveRebound 
      ? (offenseWasHome ? 'home' : 'away')
      : (offenseWasHome ? 'away' : 'home')
    
    const teamPlayers = reboundingTeam === 'home' ? this.state.homePlayers : this.state.awayPlayers
    const lineup = reboundingTeam === 'home' ? this.state.homeLineup : this.state.awayLineup
    const onCourt = teamPlayers.filter(p => lineup.includes(p.id))
    
    // Select rebounder weighted by rebounding stats
    const weights = onCourt.map(p => gotOffensiveRebound ? p.stats.offensiveRebounding : p.stats.defensiveRebounding)
    const total = weights.reduce((a, b) => a + b, 0)
    let rand = Math.random() * total
    
    let rebounder = onCourt[0]
    for (let i = 0; i < onCourt.length; i++) {
      rand -= weights[i]
      if (rand <= 0) {
        rebounder = onCourt[i]
        break
      }
    }
    
    const stats = reboundingTeam === 'home' ? this.state.homeStats[rebounder.id] : this.state.awayStats[rebounder.id]
    stats.rebounds++
    
    this.addEvent('rebound', reboundingTeam, rebounder.id,
      `${rebounder.lastName} grabs the ${gotOffensiveRebound ? 'offensive' : 'defensive'} rebound`)
    
    if (!gotOffensiveRebound) {
      this.switchPossession()
    }
    
    this.state.shotClock = SHOT_CLOCK
  }
  
  private turnover(type: 'shotclock' | 'steal' | 'outofbounds') {
    const isHome = this.state.possession === 'home'
    const players = isHome ? this.state.homePlayers : this.state.awayPlayers
    const lineup = isHome ? this.state.homeLineup : this.state.awayLineup
    const onCourt = players.filter(p => lineup.includes(p.id))
    
    const handler = onCourt[Math.floor(Math.random() * onCourt.length)]
    const stats = isHome ? this.state.homeStats[handler.id] : this.state.awayStats[handler.id]
    stats.turnovers++
    
    if (type === 'steal') {
      const defPlayers = isHome ? this.state.awayPlayers : this.state.homePlayers
      const defLineup = isHome ? this.state.awayLineup : this.state.homeLineup
      const defOnCourt = defPlayers.filter(p => defLineup.includes(p.id))
      const stealer = defOnCourt[Math.floor(Math.random() * defOnCourt.length)]
      
      const stealStats = isHome ? this.state.awayStats[stealer.id] : this.state.homeStats[stealer.id]
      stealStats.steals++
      
      this.addEvent('steal', isHome ? 'away' : 'home', stealer.id,
        `${stealer.lastName} steals the ball from ${handler.lastName}!`)
    } else {
      this.addEvent('turnover', isHome ? 'home' : 'away', handler.id,
        type === 'shotclock' ? 'Shot clock violation!' : `${handler.lastName} turnover`)
    }
    
    this.switchPossession()
    this.state.shotClock = SHOT_CLOCK
  }
  
  private switchPossession() {
    this.state.possession = this.state.possession === 'home' ? 'away' : 'home'
    this.updatePositions()
  }
  
  private updatePositions() {
    // Move players around for visual effect
    this.state.playerPositions.forEach(pos => {
      const isHome = this.state.homeLineup.includes(pos.playerId)
      const hasPos = this.state.possession === (isHome ? 'home' : 'away')
      
      // Offensive positions
      if (hasPos) {
        pos.x += (Math.random() - 0.3) * 3
        pos.x = Math.max(isHome ? 35 : 5, Math.min(isHome ? 95 : 65, pos.x))
      } else {
        // Defensive positions
        pos.x += (Math.random() - 0.7) * 3
        pos.x = Math.max(isHome ? 5 : 35, Math.min(isHome ? 65 : 95, pos.x))
      }
      
      pos.y += (Math.random() - 0.5) * 4
      pos.y = Math.max(10, Math.min(90, pos.y))
    })
    
    // Update ball position
    const posTeamLineup = this.state.possession === 'home' ? this.state.homeLineup : this.state.awayLineup
    const ballHandlerPos = this.state.playerPositions.find(p => 
      posTeamLineup.includes(p.playerId) && Math.random() < 0.3
    ) || this.state.playerPositions.find(p => posTeamLineup.includes(p.playerId))
    
    if (ballHandlerPos) {
      this.state.ball.x = ballHandlerPos.x
      this.state.ball.y = ballHandlerPos.y
      this.state.ball.holder = ballHandlerPos.playerId
    }
  }
  
  private endQuarter() {
    this.pause()
    
    if (this.state.quarter < 4) {
      this.state.phase = this.state.quarter === 2 ? 'halftime' : 'endquarter'
      this.state.quarter++
      this.state.timeRemaining = QUARTER_LENGTH
      this.state.shotClock = SHOT_CLOCK
      
      this.addEvent('timeout', 'home', undefined, 
        this.state.quarter === 3 ? 'Halftime!' : `End of Q${this.state.quarter - 1}`)
        
      // Auto-resume after delay
      setTimeout(() => {
        if (this.state.phase === 'halftime' || this.state.phase === 'endquarter') {
          this.resumeFromTimeout()
        }
      }, 2000)
    } else {
      // Check for overtime
      if (this.state.homeScore === this.state.awayScore) {
        this.state.quarter++
        this.state.timeRemaining = 300 // 5 min OT
        this.state.shotClock = SHOT_CLOCK
        this.state.phase = 'endquarter'
        this.addEvent('timeout', 'home', undefined, 'Overtime!')
        
        setTimeout(() => this.resumeFromTimeout(), 2000)
      } else {
        // Game over
        this.state.phase = 'postgame'
        this.calculateGrades()
        
        const winner = this.state.homeScore > this.state.awayScore 
          ? this.state.homeTeam.name 
          : this.state.awayTeam.name
        this.addEvent('timeout', 'home', undefined, `Final! ${winner} wins!`)
      }
    }
    
    this.notifyUpdate()
  }
  
  private calculateGrades() {
    const calculateGrade = (stats: PlayerGameStats, minutes: number): string => {
      if (minutes < 5) return 'N/A'
      
      let score = 0
      const perMin = (val: number) => (val / minutes) * 36
      
      score += perMin(stats.points) * 2
      score += perMin(stats.rebounds) * 3
      score += perMin(stats.assists) * 4
      score += perMin(stats.steals) * 5
      score += perMin(stats.blocks) * 5
      score -= perMin(stats.turnovers) * 4
      
      // Efficiency
      if (stats.fga > 0) {
        score += (stats.fgm / stats.fga) * 20
      }
      
      if (score >= 40) return 'A+'
      if (score >= 35) return 'A'
      if (score >= 30) return 'A-'
      if (score >= 25) return 'B+'
      if (score >= 20) return 'B'
      if (score >= 15) return 'B-'
      if (score >= 10) return 'C+'
      if (score >= 5) return 'C'
      if (score >= 0) return 'C-'
      return 'D'
    }
    
    Object.values(this.state.homeStats).forEach(s => {
      s.grade = calculateGrade(s, s.minutes)
    })
    Object.values(this.state.awayStats).forEach(s => {
      s.grade = calculateGrade(s, s.minutes)
    })
  }
  
  private isClutchTime(): boolean {
    return this.state.quarter >= 4 && 
           this.state.timeRemaining <= 300 && 
           Math.abs(this.state.homeScore - this.state.awayScore) <= 10
  }
  
  private addEvent(
    type: PlayEvent['type'],
    team: 'home' | 'away',
    playerId: string | undefined,
    description: string,
    points?: number,
    secondaryPlayerId?: string
  ) {
    const player = playerId 
      ? [...this.state.homePlayers, ...this.state.awayPlayers].find(p => p.id === playerId)
      : undefined
    const secondaryPlayer = secondaryPlayerId
      ? [...this.state.homePlayers, ...this.state.awayPlayers].find(p => p.id === secondaryPlayerId)
      : undefined
    
    const event: PlayEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      time: this.state.timeRemaining,
      quarter: this.state.quarter,
      type,
      team,
      playerId,
      playerName: player ? `${player.firstName} ${player.lastName}` : undefined,
      secondaryPlayerId,
      secondaryPlayerName: secondaryPlayer ? `${secondaryPlayer.firstName} ${secondaryPlayer.lastName}` : undefined,
      description,
      points,
      homeScore: this.state.homeScore,
      awayScore: this.state.awayScore,
      isMomentum: Math.abs(this.state.momentum) > 50,
      isClutch: this.isClutchTime()
    }
    
    this.state.playByPlay.unshift(event) // Add to front
    
    // Keep last 100 events
    if (this.state.playByPlay.length > 100) {
      this.state.playByPlay.pop()
    }
  }
  
  private notifyUpdate() {
    this.onUpdate({ ...this.state })
  }
  
  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }
  }
}
