import { CoachingSettings, PaceControl, OffensiveFocus, DefensiveScheme, PlayCall } from '../../engine/MatchEngine'
import clsx from 'clsx'

interface CoachingPanelProps {
  coaching: CoachingSettings
  onChange: (setting: string, value: any) => void
  disabled: boolean
  teamName: string
}

export default function CoachingPanel({ coaching, onChange, disabled, teamName }: CoachingPanelProps) {
  return (
    <div className="card">
      <div className="card-header">Coaching - {teamName}</div>
      <div className="p-4 space-y-4">
        {/* Pace Control */}
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wide block mb-2">
            Pace
          </label>
          <div className="flex gap-1">
            {(['push', 'normal', 'slow'] as PaceControl[]).map(pace => (
              <button
                key={pace}
                onClick={() => onChange('pace', pace)}
                disabled={disabled}
                className={clsx(
                  'flex-1 px-3 py-2 rounded text-xs font-medium transition-all capitalize',
                  coaching.pace === pace 
                    ? 'bg-primary text-white' 
                    : 'bg-surface-100 text-gray-400 hover:bg-surface-200'
                )}
              >
                {pace === 'push' ? '⚡ Push' : pace === 'slow' ? '🐢 Slow' : '⚖️ Normal'}
              </button>
            ))}
          </div>
        </div>
        
        {/* Offensive Focus */}
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wide block mb-2">
            Offensive Focus
          </label>
          <div className="flex gap-1">
            {(['inside', 'balanced', 'threes'] as OffensiveFocus[]).map(focus => (
              <button
                key={focus}
                onClick={() => onChange('offensiveFocus', focus)}
                disabled={disabled}
                className={clsx(
                  'flex-1 px-3 py-2 rounded text-xs font-medium transition-all capitalize',
                  coaching.offensiveFocus === focus 
                    ? 'bg-accent text-white' 
                    : 'bg-surface-100 text-gray-400 hover:bg-surface-200'
                )}
              >
                {focus === 'inside' ? '🎯 Inside' : focus === 'threes' ? '🏀 3PT' : '⚖️ Balanced'}
              </button>
            ))}
          </div>
        </div>
        
        {/* Defensive Scheme */}
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wide block mb-2">
            Defense
          </label>
          <div className="flex gap-1">
            {(['man', 'zone', 'press'] as DefensiveScheme[]).map(scheme => (
              <button
                key={scheme}
                onClick={() => onChange('defensiveScheme', scheme)}
                disabled={disabled}
                className={clsx(
                  'flex-1 px-3 py-2 rounded text-xs font-medium transition-all capitalize',
                  coaching.defensiveScheme === scheme 
                    ? 'bg-accent-red text-white' 
                    : 'bg-surface-100 text-gray-400 hover:bg-surface-200'
                )}
              >
                {scheme === 'man' ? '👤 Man' : scheme === 'zone' ? '🛡️ Zone' : '🔥 Press'}
              </button>
            ))}
          </div>
        </div>
        
        {/* Play Calls */}
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wide block mb-2">
            Play Call
          </label>
          <div className="grid grid-cols-3 gap-1">
            {(['none', 'iso', 'pickroll', 'postup', 'fastbreak', 'alleyoop'] as PlayCall[]).map(play => (
              <button
                key={play}
                onClick={() => onChange('currentPlay', play)}
                disabled={disabled}
                className={clsx(
                  'px-2 py-2 rounded text-xs font-medium transition-all capitalize',
                  coaching.currentPlay === play 
                    ? 'bg-accent-gold text-black' 
                    : 'bg-surface-100 text-gray-400 hover:bg-surface-200'
                )}
              >
                {play === 'none' ? 'Auto' : 
                 play === 'pickroll' ? 'P&R' : 
                 play === 'postup' ? 'Post' : 
                 play === 'fastbreak' ? 'Fast' : 
                 play === 'alleyoop' ? 'Oop' : 
                 play.charAt(0).toUpperCase() + play.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Quick adjustments description */}
        <div className="text-xs text-gray-500 mt-2 p-2 bg-surface-100 rounded">
          <p className="font-medium mb-1">Current Strategy:</p>
          <p>
            {coaching.pace === 'push' ? 'Pushing the pace for fast breaks.' : 
             coaching.pace === 'slow' ? 'Controlling tempo, working for good shots.' :
             'Playing at a normal pace.'}
            {' '}
            {coaching.offensiveFocus === 'inside' ? 'Looking to attack the paint.' :
             coaching.offensiveFocus === 'threes' ? 'Shooting more three-pointers.' :
             'Balanced offensive approach.'}
            {' '}
            {coaching.defensiveScheme === 'press' ? 'Full-court pressing defense.' :
             coaching.defensiveScheme === 'zone' ? 'Zone defense protecting the paint.' :
             'Man-to-man defense.'}
          </p>
        </div>
      </div>
    </div>
  )
}
