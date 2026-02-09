import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { formatCurrency, formatHeight, getRatingClass } from '../utils/format'
import { UserPlus, Search, Filter } from 'lucide-react'
import clsx from 'clsx'

export default function FreeAgents() {
  const [search, setSearch] = useState('')
  const [posFilter, setPosFilter] = useState('all')
  const [minRating, setMinRating] = useState(0)
  const { getFreeAgents, getUserTeam, signFreeAgent, state } = useGameStore()
  
  const team = getUserTeam()
  const freeAgents = getFreeAgents()
  
  if (!state || !team) {
    return <div className="text-gray-400">Loading...</div>
  }
  
  const positions = ['PG', 'SG', 'SF', 'PF', 'C']
  
  const filtered = freeAgents.filter(player => {
    const matchesSearch = search === '' || 
      `${player.firstName} ${player.lastName}`.toLowerCase().includes(search.toLowerCase())
    const matchesPos = posFilter === 'all' || player.position === posFilter
    const matchesRating = player.stats.overall >= minRating
    return matchesSearch && matchesPos && matchesRating
  })
  
  const capSpace = team.salaryCap - team.payroll
  
  const handleSign = (player: any) => {
    const years = Math.min(4, Math.max(1, Math.floor(player.stats.overall / 20)))
    const salary = Math.max(1100000, Math.floor(player.stats.overall * 100000))
    
    signFreeAgent(player.id, years, salary)
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Free Agents</h1>
          <p className="text-gray-400">{freeAgents.length} available players</p>
        </div>
        
        <div className={clsx(
          'text-sm px-4 py-2 rounded-lg',
          capSpace > 0 ? 'bg-primary/20 text-primary' : 'bg-accent-red/20 text-accent-red'
        )}>
          Cap Space: {formatCurrency(Math.max(0, capSpace))}
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        
        <select
          value={posFilter}
          onChange={e => setPosFilter(e.target.value)}
          className="input w-36"
        >
          <option value="all">All Positions</option>
          {positions.map(pos => (
            <option key={pos} value={pos}>{pos}</option>
          ))}
        </select>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Min Rating:</span>
          <input
            type="range"
            min="0"
            max="90"
            step="5"
            value={minRating}
            onChange={e => setMinRating(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-sm font-mono w-8">{minRating}</span>
        </div>
      </div>
      
      {/* Free Agent List */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Pos</th>
                <th>Age</th>
                <th>OVR</th>
                <th>POT</th>
                <th>Height</th>
                <th>Exp</th>
                <th>Est. Salary</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map(player => {
                const estSalary = Math.max(1100000, Math.floor(player.stats.overall * 100000))
                const canAfford = estSalary <= Math.max(capSpace, team.exceptions[0]?.remaining || 0)
                
                return (
                  <tr key={player.id}>
                    <td>
                      <Link 
                        to={`/player/${player.id}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {player.firstName} {player.lastName}
                      </Link>
                    </td>
                    <td>
                      <span className="badge badge-info">{player.position}</span>
                    </td>
                    <td>{player.age}</td>
                    <td>
                      <span className={getRatingClass(player.stats.overall)}>
                        {player.stats.overall}
                      </span>
                    </td>
                    <td>
                      <span className={getRatingClass(player.potential)}>
                        {player.potential}
                      </span>
                    </td>
                    <td className="text-gray-400">{formatHeight(player.height)}</td>
                    <td>{player.yearsExperience} yr</td>
                    <td className="font-mono text-gray-400">{formatCurrency(estSalary)}</td>
                    <td className="text-right">
                      <button
                        onClick={() => handleSign(player)}
                        disabled={!canAfford}
                        className={clsx(
                          'btn btn-sm',
                          canAfford ? 'btn-primary' : 'btn-secondary opacity-50'
                        )}
                      >
                        <UserPlus size={14} />
                        Sign
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {filtered.length > 50 && (
          <div className="px-4 py-3 text-sm text-gray-500 border-t border-surface-200 text-center">
            Showing 50 of {filtered.length} players
          </div>
        )}
        
        {filtered.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No players match your filters
          </div>
        )}
      </div>
    </div>
  )
}
