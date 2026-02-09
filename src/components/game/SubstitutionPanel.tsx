import { useState } from 'react'
import { Player } from '../../gm/types'
import { PlayerGameStats } from '../../engine/MatchEngine'
import { X, ArrowRight } from 'lucide-react'
import clsx from 'clsx'

interface SubstitutionPanelProps {
  lineup: string[]
  players: Player[]
  stats: Record<string, PlayerGameStats>
  onSubstitute: (outId: string, inId: string) => void
  onClose: () => void
}

export default function SubstitutionPanel({ 
  lineup, 
  players, 
  stats, 
  onSubstitute, 
  onClose 
}: SubstitutionPanelProps) {
  const [selectedOut, setSelectedOut] = useState<string | null>(null)
  
  const onCourt = players.filter(p => lineup.includes(p.id))
  const bench = players.filter(p => !lineup.includes(p.id))
  
  const handleSubConfirm = (inId: string) => {
    if (selectedOut) {
      onSubstitute(selectedOut, inId)
      setSelectedOut(null)
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="card-header flex items-center justify-between">
          <span>Substitutions</span>
          <button onClick={onClose} className="p-1 hover:bg-surface-200 rounded">
            <X size={18} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 divide-x divide-surface-200">
            {/* On Court */}
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">
                On Court (Select to sub out)
              </h3>
              <div className="space-y-2">
                {onCourt.map(player => {
                  const s = stats[player.id]
                  const isSelected = selectedOut === player.id
                  
                  return (
                    <button
                      key={player.id}
                      onClick={() => setSelectedOut(isSelected ? null : player.id)}
                      className={clsx(
                        'w-full p-3 rounded-lg border-2 text-left transition-all',
                        isSelected 
                          ? 'border-primary bg-primary/20' 
                          : 'border-surface-200 hover:border-surface-300'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-gray-500 mr-2">{player.position}</span>
                          <span className="font-medium">{player.firstName} {player.lastName}</span>
                        </div>
                        {isSelected && <ArrowRight size={16} className="text-primary" />}
                      </div>
                      <div className="flex gap-4 mt-1 text-xs text-gray-400">
                        <span>{s?.points || 0} pts</span>
                        <span>{s?.rebounds || 0} reb</span>
                        <span>{s?.assists || 0} ast</span>
                        <span className={clsx(
                          (s?.fouls || 0) >= 4 && 'text-accent-gold',
                          (s?.fouls || 0) >= 5 && 'text-accent-red'
                        )}>
                          {s?.fouls || 0} fouls
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
            
            {/* Bench */}
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">
                Bench {selectedOut ? '(Click to sub in)' : ''}
              </h3>
              <div className="space-y-2">
                {bench.map(player => {
                  const s = stats[player.id]
                  
                  return (
                    <button
                      key={player.id}
                      onClick={() => selectedOut && handleSubConfirm(player.id)}
                      disabled={!selectedOut}
                      className={clsx(
                        'w-full p-3 rounded-lg border-2 text-left transition-all',
                        selectedOut 
                          ? 'border-surface-200 hover:border-accent hover:bg-accent/10 cursor-pointer' 
                          : 'border-surface-200 opacity-50 cursor-not-allowed'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-gray-500 mr-2">{player.position}</span>
                          <span className="font-medium">{player.firstName} {player.lastName}</span>
                        </div>
                        <span className="text-sm text-gray-400">
                          OVR {player.stats.overall}
                        </span>
                      </div>
                      {(s?.minutes || 0) > 0 && (
                        <div className="flex gap-4 mt-1 text-xs text-gray-400">
                          <span>{s?.points || 0} pts</span>
                          <span>{s?.rebounds || 0} reb</span>
                          <span>{s?.assists || 0} ast</span>
                          <span>{s?.fouls || 0} fouls</span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-surface-200 px-4 py-3 flex justify-end gap-3">
          <button onClick={onClose} className="btn btn-secondary">
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
