import { useMemo } from 'react'
import { PlayerPosition, BallPosition } from '../../engine/MatchEngine'
import { Player, Team } from '../../gm/types'
import clsx from 'clsx'

interface Court2DProps {
  playerPositions: PlayerPosition[]
  ball: BallPosition
  homePlayers: Player[]
  awayPlayers: Player[]
  homeTeam: Team
  awayTeam: Team
  homeLineup: string[]
  awayLineup: string[]
}

export default function Court2D({
  playerPositions,
  ball,
  homePlayers,
  awayPlayers,
  homeTeam,
  awayTeam,
  homeLineup,
  awayLineup
}: Court2DProps) {
  const getPlayerInfo = (playerId: string) => {
    const isHome = homeLineup.includes(playerId)
    const players = isHome ? homePlayers : awayPlayers
    const player = players.find(p => p.id === playerId)
    const team = isHome ? homeTeam : awayTeam
    return { player, team, isHome }
  }
  
  return (
    <div className="card overflow-hidden">
      <div className="relative w-full aspect-[2/1] bg-gradient-to-b from-amber-900/30 to-amber-800/30">
        {/* Court markings */}
        <svg 
          viewBox="0 0 100 50" 
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Court outline */}
          <rect x="2" y="2" width="96" height="46" fill="none" stroke="#c9a227" strokeWidth="0.3" />
          
          {/* Center line */}
          <line x1="50" y1="2" x2="50" y2="48" stroke="#c9a227" strokeWidth="0.3" />
          
          {/* Center circle */}
          <circle cx="50" cy="25" r="6" fill="none" stroke="#c9a227" strokeWidth="0.3" />
          
          {/* Left three-point arc */}
          <path 
            d="M 2 11 L 14 11 A 23.75 23.75 0 0 1 14 39 L 2 39" 
            fill="none" 
            stroke="#c9a227" 
            strokeWidth="0.3"
          />
          
          {/* Left paint */}
          <rect x="2" y="17" width="19" height="16" fill="none" stroke="#c9a227" strokeWidth="0.3" />
          
          {/* Left free throw circle */}
          <circle cx="21" cy="25" r="6" fill="none" stroke="#c9a227" strokeWidth="0.3" strokeDasharray="1,1" />
          
          {/* Left restricted area */}
          <path 
            d="M 2 21 A 4 4 0 0 0 2 29" 
            fill="none" 
            stroke="#c9a227" 
            strokeWidth="0.3"
          />
          
          {/* Left basket */}
          <circle cx="5.25" cy="25" r="0.75" fill="none" stroke="#ff6b35" strokeWidth="0.4" />
          <rect x="2" y="24" width="3" height="2" fill="none" stroke="#ff6b35" strokeWidth="0.3" />
          
          {/* Right three-point arc */}
          <path 
            d="M 98 11 L 86 11 A 23.75 23.75 0 0 0 86 39 L 98 39" 
            fill="none" 
            stroke="#c9a227" 
            strokeWidth="0.3"
          />
          
          {/* Right paint */}
          <rect x="79" y="17" width="19" height="16" fill="none" stroke="#c9a227" strokeWidth="0.3" />
          
          {/* Right free throw circle */}
          <circle cx="79" cy="25" r="6" fill="none" stroke="#c9a227" strokeWidth="0.3" strokeDasharray="1,1" />
          
          {/* Right restricted area */}
          <path 
            d="M 98 21 A 4 4 0 0 1 98 29" 
            fill="none" 
            stroke="#c9a227" 
            strokeWidth="0.3"
          />
          
          {/* Right basket */}
          <circle cx="94.75" cy="25" r="0.75" fill="none" stroke="#ff6b35" strokeWidth="0.4" />
          <rect x="95" y="24" width="3" height="2" fill="none" stroke="#ff6b35" strokeWidth="0.3" />
        </svg>
        
        {/* Players */}
        {playerPositions.map(pos => {
          const { player, team, isHome } = getPlayerInfo(pos.playerId)
          if (!player) return null
          
          const hasBall = ball.holder === pos.playerId
          
          return (
            <div
              key={pos.playerId}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
              }}
            >
              {/* Player circle */}
              <div
                className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg transition-all',
                  hasBall && 'ring-2 ring-accent-gold ring-offset-2 ring-offset-surface'
                )}
                style={{ backgroundColor: team.colors.primary }}
                title={`${player.firstName} ${player.lastName}`}
              >
                {player.lastName.slice(0, 3).toUpperCase()}
              </div>
              
              {/* Position label */}
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-400 whitespace-nowrap">
                {player.position}
              </div>
            </div>
          )
        })}
        
        {/* Ball (when not held) */}
        {!ball.holder && (
          <div
            className="absolute w-4 h-4 bg-orange-500 rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200"
            style={{
              left: `${ball.x}%`,
              top: `${ball.y}%`,
            }}
          />
        )}
        
        {/* Team labels */}
        <div className="absolute top-2 left-4 flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded"
            style={{ backgroundColor: homeTeam.colors.primary }}
          />
          <span className="text-xs text-white/70">{homeTeam.abbreviation}</span>
        </div>
        <div className="absolute top-2 right-4 flex items-center gap-2">
          <span className="text-xs text-white/70">{awayTeam.abbreviation}</span>
          <div 
            className="w-4 h-4 rounded"
            style={{ backgroundColor: awayTeam.colors.primary }}
          />
        </div>
      </div>
    </div>
  )
}
