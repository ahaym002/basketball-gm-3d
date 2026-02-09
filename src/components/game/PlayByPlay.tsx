import { PlayEvent } from '../../engine/MatchEngine'
import { Team } from '../../gm/types'
import clsx from 'clsx'

interface PlayByPlayProps {
  events: PlayEvent[]
  homeTeam: Team
  awayTeam: Team
}

export default function PlayByPlay({ events, homeTeam, awayTeam }: PlayByPlayProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  const getEventIcon = (type: PlayEvent['type']) => {
    switch (type) {
      case 'shot': return '🏀'
      case 'miss': return '❌'
      case 'rebound': return '📥'
      case 'assist': return '🎯'
      case 'steal': return '🔥'
      case 'block': return '🚫'
      case 'turnover': return '💨'
      case 'foul': return '⚠️'
      case 'timeout': return '⏸️'
      case 'substitution': return '🔄'
      default: return '•'
    }
  }
  
  return (
    <div className="card">
      <div className="card-header">Play-by-Play</div>
      <div className="max-h-80 overflow-y-auto divide-y divide-surface-200">
        {events.length === 0 ? (
          <div className="p-4 text-gray-500 text-sm text-center">
            Game hasn't started yet
          </div>
        ) : (
          events.slice(0, 30).map(event => {
            const team = event.team === 'home' ? homeTeam : awayTeam
            const isScoring = event.type === 'shot' && event.points
            
            return (
              <div 
                key={event.id}
                className={clsx(
                  'px-4 py-2 flex items-start gap-3 text-sm',
                  isScoring && 'bg-primary/10',
                  event.isMomentum && 'border-l-2 border-accent-gold',
                  event.isClutch && 'bg-accent-red/5'
                )}
              >
                {/* Time */}
                <div className="w-12 flex-shrink-0 text-gray-500 font-mono text-xs">
                  <div>Q{event.quarter}</div>
                  <div>{formatTime(event.time)}</div>
                </div>
                
                {/* Team indicator */}
                <div 
                  className="w-1 h-8 rounded-full flex-shrink-0"
                  style={{ backgroundColor: team.colors.primary }}
                />
                
                {/* Event */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span>{getEventIcon(event.type)}</span>
                    <span className={clsx(
                      isScoring && 'font-semibold text-primary'
                    )}>
                      {event.description}
                    </span>
                    {event.isClutch && (
                      <span className="text-xs bg-accent-red/20 text-accent-red px-1.5 py-0.5 rounded">
                        CLUTCH
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Score */}
                <div className="text-right text-gray-400 font-mono text-xs w-16 flex-shrink-0">
                  {event.homeScore} - {event.awayScore}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
