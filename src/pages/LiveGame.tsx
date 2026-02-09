import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { MatchEngine, MatchState, PlayEvent, PaceControl, OffensiveFocus, DefensiveScheme, PlayCall } from '../engine/MatchEngine'
import Court2D from '../components/game/Court2D'
import PlayByPlay from '../components/game/PlayByPlay'
import BoxScore from '../components/game/BoxScore'
import CoachingPanel from '../components/game/CoachingPanel'
import SubstitutionPanel from '../components/game/SubstitutionPanel'
import { Play, Pause, FastForward, SkipForward, Clock, Zap, X } from 'lucide-react'
import clsx from 'clsx'

export default function LiveGame() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { state, getTeamPlayers, getUserTeam } = useGameStore()
  
  const [matchState, setMatchState] = useState<MatchState | null>(null)
  const [activeTab, setActiveTab] = useState<'live' | 'boxscore'>('live')
  const [showSubs, setShowSubs] = useState(false)
  const engineRef = useRef<MatchEngine | null>(null)
  
  const userTeam = getUserTeam()
  
  // Initialize match engine
  useEffect(() => {
    if (!state || !gameId || !userTeam) return
    
    // Find the game
    const game = state.currentSeason.schedule.find(g => g.id === gameId)
    if (!game) {
      navigate('/schedule')
      return
    }
    
    const homeTeam = state.teams[game.homeTeamId]
    const awayTeam = state.teams[game.awayTeamId]
    
    if (!homeTeam || !awayTeam) return
    
    const homePlayers = getTeamPlayers(game.homeTeamId)
    const awayPlayers = getTeamPlayers(game.awayTeamId)
    
    const isUserHome = game.homeTeamId === userTeam.id
    
    const engine = new MatchEngine(
      homeTeam,
      awayTeam,
      homePlayers,
      awayPlayers,
      isUserHome,
      (newState) => setMatchState(newState)
    )
    
    engineRef.current = engine
    setMatchState(engine.getState())
    
    return () => {
      engine.destroy()
    }
  }, [state, gameId, userTeam])
  
  // Control handlers
  const handleStart = useCallback(() => {
    engineRef.current?.start()
  }, [])
  
  const handlePause = useCallback(() => {
    engineRef.current?.pause()
  }, [])
  
  const handleSetSpeed = useCallback((speed: number) => {
    engineRef.current?.setSpeed(speed)
  }, [])
  
  const handleSimToEnd = useCallback(() => {
    engineRef.current?.simToEnd()
  }, [])
  
  const handleTimeout = useCallback(() => {
    engineRef.current?.callTimeout()
  }, [])
  
  const handleSubstitution = useCallback((outId: string, inId: string) => {
    engineRef.current?.makeSubstitution(outId, inId)
    setShowSubs(false)
  }, [])
  
  const handleCoachingChange = useCallback((setting: string, value: any) => {
    engineRef.current?.setCoaching(setting as any, value)
  }, [])
  
  const handleResume = useCallback(() => {
    engineRef.current?.resumeFromTimeout()
  }, [])
  
  if (!matchState) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-400">Loading game...</div>
      </div>
    )
  }
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  const isUserTeam = matchState.isUserHome
  const userCoaching = isUserTeam ? matchState.homeCoaching : matchState.awayCoaching
  const userLineup = isUserTeam ? matchState.homeLineup : matchState.awayLineup
  const userPlayers = isUserTeam ? matchState.homePlayers : matchState.awayPlayers
  const userStats = isUserTeam ? matchState.homeStats : matchState.awayStats
  
  const isPlaying = matchState.phase === 'playing' && matchState.simSpeed > 0
  const isPaused = matchState.simSpeed === 0
  const isGameOver = matchState.phase === 'postgame'
  
  return (
    <div className="space-y-4">
      {/* Game Header */}
      <div className="card">
        <div className="p-4">
          <div className="flex items-center justify-between">
            {/* Home Team */}
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: matchState.homeTeam.colors.primary }}
              >
                {matchState.homeTeam.abbreviation}
              </div>
              <div>
                <p className="text-sm text-gray-400">Home</p>
                <p className="text-xl font-bold">{matchState.homeTeam.name}</p>
              </div>
              <div className="text-5xl font-bold tabular-nums">
                {matchState.homeScore}
              </div>
            </div>
            
            {/* Game Info */}
            <div className="text-center">
              <div className="flex items-center gap-4 justify-center mb-2">
                <span className={clsx(
                  'px-3 py-1 rounded-full text-sm font-medium',
                  matchState.phase === 'playing' ? 'bg-primary/20 text-primary animate-pulse' :
                  matchState.phase === 'postgame' ? 'bg-gray-500/20 text-gray-400' :
                  'bg-accent-gold/20 text-accent-gold'
                )}>
                  {matchState.phase === 'playing' ? 'LIVE' : 
                   matchState.phase === 'postgame' ? 'FINAL' :
                   matchState.phase === 'halftime' ? 'HALFTIME' :
                   matchState.phase === 'timeout' ? 'TIMEOUT' :
                   matchState.phase === 'pregame' ? 'PREGAME' : `Q${matchState.quarter} END`}
                </span>
              </div>
              
              <div className="text-4xl font-mono font-bold mb-1">
                {formatTime(matchState.timeRemaining)}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>Q{matchState.quarter}</span>
                <span>•</span>
                <Clock size={14} />
                <span>{matchState.shotClock.toFixed(0)}</span>
              </div>
              
              {/* Possession indicator */}
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className={clsx(
                  'w-2 h-2 rounded-full',
                  matchState.possession === 'home' ? 'bg-primary' : 'bg-surface-300'
                )} />
                <span className="text-xs text-gray-500">Possession</span>
                <span className={clsx(
                  'w-2 h-2 rounded-full',
                  matchState.possession === 'away' ? 'bg-primary' : 'bg-surface-300'
                )} />
              </div>
            </div>
            
            {/* Away Team */}
            <div className="flex items-center gap-4">
              <div className="text-5xl font-bold tabular-nums">
                {matchState.awayScore}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Away</p>
                <p className="text-xl font-bold">{matchState.awayTeam.name}</p>
              </div>
              <div 
                className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: matchState.awayTeam.colors.primary }}
              >
                {matchState.awayTeam.abbreviation}
              </div>
            </div>
          </div>
          
          {/* Momentum Bar */}
          <div className="mt-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <span>{matchState.homeTeam.abbreviation}</span>
              <div className="flex-1" />
              <Zap size={12} className={clsx(
                Math.abs(matchState.momentum) > 50 && 'text-accent-gold animate-pulse'
              )} />
              <span>Momentum</span>
              <Zap size={12} className={clsx(
                Math.abs(matchState.momentum) > 50 && 'text-accent-gold animate-pulse'
              )} />
              <div className="flex-1" />
              <span>{matchState.awayTeam.abbreviation}</span>
            </div>
            <div className="h-2 bg-surface-200 rounded-full overflow-hidden flex">
              <div 
                className="bg-gradient-to-r from-primary to-accent transition-all duration-300"
                style={{ width: `${50 + matchState.momentum / 2}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Sim Controls */}
        <div className="border-t border-surface-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {matchState.phase === 'pregame' ? (
              <button onClick={handleStart} className="btn btn-primary">
                <Play size={16} fill="currentColor" />
                Start Game
              </button>
            ) : isGameOver ? (
              <button onClick={() => navigate('/schedule')} className="btn btn-secondary">
                Back to Schedule
              </button>
            ) : (
              <>
                <button 
                  onClick={isPaused ? () => handleSetSpeed(matchState.simSpeed || 1) : handlePause}
                  className="btn btn-secondary"
                >
                  {isPaused ? <Play size={16} /> : <Pause size={16} />}
                </button>
                
                {[1, 2, 4, 8].map(speed => (
                  <button
                    key={speed}
                    onClick={() => handleSetSpeed(speed)}
                    className={clsx(
                      'btn',
                      matchState.simSpeed === speed ? 'btn-primary' : 'btn-secondary'
                    )}
                  >
                    {speed}x
                  </button>
                ))}
                
                <button onClick={handleSimToEnd} className="btn btn-secondary">
                  <SkipForward size={16} />
                  Sim to End
                </button>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {!isGameOver && matchState.phase !== 'pregame' && (
              <>
                <button 
                  onClick={handleTimeout}
                  disabled={userCoaching.timeoutsRemaining === 0 || matchState.phase !== 'playing'}
                  className="btn btn-secondary"
                >
                  Timeout ({userCoaching.timeoutsRemaining})
                </button>
                <button 
                  onClick={() => setShowSubs(true)}
                  className="btn btn-secondary"
                >
                  Substitutions
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Tab Switcher */}
      <div className="flex bg-surface-50 p-1 rounded-lg w-fit">
        {(['live', 'boxscore'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'px-6 py-2 rounded-md text-sm font-medium transition-all capitalize',
              activeTab === tab ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
            )}
          >
            {tab === 'live' ? 'Live View' : 'Box Score'}
          </button>
        ))}
      </div>
      
      {activeTab === 'live' ? (
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Court & Play by Play */}
          <div className="lg:col-span-2 space-y-4">
            <Court2D 
              playerPositions={matchState.playerPositions}
              ball={matchState.ball}
              homePlayers={matchState.homePlayers}
              awayPlayers={matchState.awayPlayers}
              homeTeam={matchState.homeTeam}
              awayTeam={matchState.awayTeam}
              homeLineup={matchState.homeLineup}
              awayLineup={matchState.awayLineup}
            />
            
            <PlayByPlay 
              events={matchState.playByPlay}
              homeTeam={matchState.homeTeam}
              awayTeam={matchState.awayTeam}
            />
          </div>
          
          {/* Coaching Panel */}
          <div className="space-y-4">
            <CoachingPanel
              coaching={userCoaching}
              onChange={handleCoachingChange}
              disabled={isGameOver}
              teamName={isUserTeam ? matchState.homeTeam.name : matchState.awayTeam.name}
            />
            
            {/* On Court */}
            <div className="card">
              <div className="card-header">On Court</div>
              <div className="divide-y divide-surface-200">
                {userLineup.map(id => {
                  const player = userPlayers.find(p => p.id === id)
                  const stats = userStats[id]
                  if (!player) return null
                  
                  return (
                    <div key={id} className="px-4 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-6">{player.position}</span>
                        <span className="font-medium">{player.lastName}</span>
                        {stats?.isHot && <span className="text-xs text-accent-gold">🔥</span>}
                        {stats?.isCold && <span className="text-xs text-accent">❄️</span>}
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-400">{stats?.points || 0} pts</span>
                        <span className={clsx(
                          'w-5 text-center',
                          (stats?.fouls || 0) >= 5 && 'text-accent-red font-bold'
                        )}>
                          {stats?.fouls || 0}f
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <BoxScore 
          matchState={matchState}
        />
      )}
      
      {/* Substitution Modal */}
      {showSubs && (
        <SubstitutionPanel
          lineup={userLineup}
          players={userPlayers}
          stats={userStats}
          onSubstitute={handleSubstitution}
          onClose={() => setShowSubs(false)}
        />
      )}
      
      {/* Resume from timeout/halftime overlay */}
      {(matchState.phase === 'timeout' || matchState.phase === 'halftime' || matchState.phase === 'endquarter') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-8 text-center max-w-md">
            <h2 className="text-2xl font-bold mb-2">
              {matchState.phase === 'halftime' ? 'Halftime' : 
               matchState.phase === 'timeout' ? 'Timeout' : `End of Q${matchState.quarter - 1}`}
            </h2>
            <p className="text-gray-400 mb-4">
              {matchState.homeTeam.abbreviation} {matchState.homeScore} - {matchState.awayScore} {matchState.awayTeam.abbreviation}
            </p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setShowSubs(true)} className="btn btn-secondary">
                Make Substitutions
              </button>
              <button onClick={handleResume} className="btn btn-primary">
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
