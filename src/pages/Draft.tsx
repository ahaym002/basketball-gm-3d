import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { formatHeight, getRatingClass } from '../utils/format'
import { GraduationCap, Star, Clock, Check } from 'lucide-react'
import clsx from 'clsx'

export default function Draft() {
  const [selectedProspect, setSelectedProspect] = useState<string | null>(null)
  const { state, getAvailableProspects, makeDraftPick, getUserTeam } = useGameStore()
  
  const team = getUserTeam()
  const prospects = getAvailableProspects()
  
  if (!state || !team) {
    return <div className="text-gray-400">Loading...</div>
  }
  
  const phase = state.currentSeason.phase
  const isDraftActive = phase === 'draft'
  
  // Get draft results from state
  const draftResults = state.currentSeason.draftResults || []
  
  const handlePick = () => {
    if (selectedProspect) {
      makeDraftPick(selectedProspect)
      setSelectedProspect(null)
    }
  }
  
  if (!isDraftActive) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Draft</h1>
          <p className="text-gray-400">The draft is not currently active</p>
        </div>
        
        <div className="card p-8 text-center">
          <GraduationCap size={48} className="text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Draft Coming Soon</h2>
          <p className="text-gray-400 mb-4">
            The {state.currentSeason.year + 1} NBA Draft will begin after the playoffs.
          </p>
          <p className="text-sm text-gray-500">
            Current phase: <span className="text-primary capitalize">{phase}</span>
          </p>
        </div>
        
        {/* Show last draft results if available */}
        {draftResults.length > 0 && (
          <div className="card">
            <div className="card-header">Previous Draft Results</div>
            <div className="divide-y divide-surface-200">
              {draftResults.slice(0, 30).map((pick, i) => {
                const player = state.players[pick.playerId]
                const pickTeam = state.teams[pick.teamId]
                
                return (
                  <div key={i} className="flex items-center px-4 py-3 gap-4">
                    <span className="w-8 text-gray-500 font-mono">#{pick.pick}</span>
                    <span 
                      className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: pickTeam?.colors.primary || '#666' }}
                    >
                      {pickTeam?.abbreviation}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">
                        {player?.firstName} {player?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {player?.position} • {player?.college || 'International'}
                      </p>
                    </div>
                    <span className={getRatingClass(player?.stats.overall || 0)}>
                      {player?.stats.overall}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{state.currentSeason.year + 1} NBA Draft</h1>
          <p className="text-gray-400">{prospects.length} prospects available</p>
        </div>
        
        <div className="flex items-center gap-2 text-primary">
          <Clock size={18} />
          <span className="font-semibold">Draft Active</span>
        </div>
      </div>
      
      {/* Draft Board */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Available Prospects */}
        <div className="lg:col-span-2 card">
          <div className="card-header">Available Prospects</div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Pos</th>
                  <th>Age</th>
                  <th>OVR</th>
                  <th>POT</th>
                  <th>College</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {prospects.map((prospect, i) => (
                  <tr 
                    key={prospect.id}
                    className={clsx(
                      'cursor-pointer',
                      selectedProspect === prospect.id && 'bg-primary/20'
                    )}
                    onClick={() => setSelectedProspect(prospect.id)}
                  >
                    <td className="font-mono text-gray-500">#{i + 1}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        {i < 3 && <Star size={14} className="text-accent-gold" />}
                        <span className="font-medium">
                          {prospect.firstName} {prospect.lastName}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info">{prospect.position}</span>
                    </td>
                    <td>{prospect.age}</td>
                    <td>
                      <span className={getRatingClass(prospect.stats.overall)}>
                        {prospect.stats.overall}
                      </span>
                    </td>
                    <td>
                      <span className={getRatingClass(prospect.potential)}>
                        {prospect.potential}
                      </span>
                    </td>
                    <td className="text-gray-400 text-sm">
                      {prospect.college || 'International'}
                    </td>
                    <td>
                      {selectedProspect === prospect.id && (
                        <Check size={16} className="text-primary" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Selection Panel */}
        <div className="space-y-4">
          {/* Your Pick */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Your Selection</h3>
            
            {selectedProspect ? (
              (() => {
                const prospect = prospects.find(p => p.id === selectedProspect)
                if (!prospect) return null
                
                return (
                  <div>
                    <div className="bg-surface-100 rounded-lg p-4 mb-4">
                      <p className="text-xl font-bold">
                        {prospect.firstName} {prospect.lastName}
                      </p>
                      <p className="text-gray-400">
                        {prospect.position} • {prospect.age} years old
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-gray-500">Overall</p>
                          <p className={clsx('text-2xl font-bold', getRatingClass(prospect.stats.overall))}>
                            {prospect.stats.overall}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Potential</p>
                          <p className={clsx('text-2xl font-bold', getRatingClass(prospect.potential))}>
                            {prospect.potential}
                          </p>
                        </div>
                      </div>
                      
                      {prospect.comparisonPlayer && (
                        <p className="text-sm text-gray-400 mt-3">
                          Comparison: <span className="text-white">{prospect.comparisonPlayer}</span>
                        </p>
                      )}
                    </div>
                    
                    <button
                      onClick={handlePick}
                      className="btn btn-primary w-full"
                    >
                      Draft {prospect.lastName}
                    </button>
                  </div>
                )
              })()
            ) : (
              <div className="text-center py-8 text-gray-500">
                <GraduationCap size={32} className="mx-auto mb-2 opacity-50" />
                <p>Select a prospect to draft</p>
              </div>
            )}
          </div>
          
          {/* Draft History */}
          {draftResults.length > 0 && (
            <div className="card">
              <div className="card-header">Draft History</div>
              <div className="divide-y divide-surface-200 max-h-60 overflow-y-auto">
                {draftResults.map((pick, i) => {
                  const player = state.players[pick.playerId]
                  const pickTeam = state.teams[pick.teamId]
                  const isUserPick = pick.teamId === team.id
                  
                  return (
                    <div 
                      key={i} 
                      className={clsx(
                        'flex items-center px-3 py-2 gap-2 text-sm',
                        isUserPick && 'bg-primary/10'
                      )}
                    >
                      <span className="w-6 text-gray-500">#{pick.pick}</span>
                      <span 
                        className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ backgroundColor: pickTeam?.colors.primary || '#666' }}
                      >
                        {pickTeam?.abbreviation}
                      </span>
                      <span className="flex-1 truncate">
                        {player?.firstName} {player?.lastName}
                      </span>
                      <span className={getRatingClass(player?.stats.overall || 0)}>
                        {player?.stats.overall}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
