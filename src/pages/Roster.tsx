import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { formatCurrency, formatHeight, getRatingClass } from '../utils/format'
import { UserMinus, ArrowUpDown, Filter } from 'lucide-react'
import clsx from 'clsx'

type SortKey = 'overall' | 'position' | 'age' | 'salary' | 'name'
type SortDir = 'asc' | 'desc'

export default function Roster() {
  const { getUserTeam, getTeamPlayers, releasePlayer, state } = useGameStore()
  const [sortKey, setSortKey] = useState<SortKey>('overall')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [posFilter, setPosFilter] = useState<string>('all')
  
  const team = getUserTeam()
  const players = team ? getTeamPlayers(team.id) : []
  
  if (!team || !state) {
    return <div className="text-gray-400">Loading...</div>
  }
  
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'name' ? 'asc' : 'desc')
    }
  }
  
  const filteredPlayers = players.filter(p => 
    posFilter === 'all' || p.position === posFilter
  )
  
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    let comparison = 0
    switch (sortKey) {
      case 'overall':
        comparison = a.stats.overall - b.stats.overall
        break
      case 'position':
        comparison = a.position.localeCompare(b.position)
        break
      case 'age':
        comparison = a.age - b.age
        break
      case 'salary':
        comparison = a.contract.salary - b.contract.salary
        break
      case 'name':
        comparison = `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
        break
    }
    return sortDir === 'asc' ? comparison : -comparison
  })
  
  const capStatus = team.payroll > team.taxLine ? 'Over Tax' :
                    team.payroll > team.salaryCap ? 'Over Cap' : 'Under Cap'
  
  const positions = ['PG', 'SG', 'SF', 'PF', 'C']
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Roster</h1>
          <p className="text-gray-400">{players.length} players</p>
        </div>
        
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-gray-500">Payroll:</span>{' '}
            <span className="font-semibold">{formatCurrency(team.payroll)}</span>
          </div>
          <div>
            <span className="text-gray-500">Cap:</span>{' '}
            <span className="font-semibold">{formatCurrency(team.salaryCap)}</span>
          </div>
          <div className={clsx(
            'badge',
            capStatus === 'Over Tax' ? 'badge-danger' :
            capStatus === 'Over Cap' ? 'badge-warning' : 'badge-success'
          )}>
            {capStatus}
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-500" />
          <select
            value={posFilter}
            onChange={e => setPosFilter(e.target.value)}
            className="input w-32"
          >
            <option value="all">All Positions</option>
            {positions.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Roster Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <SortHeader 
                  label="Player" 
                  sortKey="name" 
                  currentKey={sortKey}
                  sortDir={sortDir}
                  onClick={() => handleSort('name')}
                />
                <SortHeader 
                  label="Pos" 
                  sortKey="position" 
                  currentKey={sortKey}
                  sortDir={sortDir}
                  onClick={() => handleSort('position')}
                />
                <SortHeader 
                  label="Age" 
                  sortKey="age" 
                  currentKey={sortKey}
                  sortDir={sortDir}
                  onClick={() => handleSort('age')}
                />
                <SortHeader 
                  label="OVR" 
                  sortKey="overall" 
                  currentKey={sortKey}
                  sortDir={sortDir}
                  onClick={() => handleSort('overall')}
                />
                <th>POT</th>
                <th>Height</th>
                <SortHeader 
                  label="Salary" 
                  sortKey="salary" 
                  currentKey={sortKey}
                  sortDir={sortDir}
                  onClick={() => handleSort('salary')}
                />
                <th>Years</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map(player => (
                <tr key={player.id}>
                  <td>
                    <Link 
                      to={`/player/${player.id}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {player.firstName} {player.lastName}
                    </Link>
                    {player.injury && (
                      <span className="ml-2 text-xs text-accent-red">INJ</span>
                    )}
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
                  <td className="font-mono">{formatCurrency(player.contract.salary)}</td>
                  <td>{player.contract.years}yr</td>
                  <td className="text-right">
                    <button
                      onClick={() => {
                        if (confirm(`Release ${player.firstName} ${player.lastName}?`)) {
                          releasePlayer(player.id)
                        }
                      }}
                      className="p-1.5 rounded hover:bg-accent-red/20 text-gray-400 hover:text-accent-red transition-colors"
                      title="Release Player"
                    >
                      <UserMinus size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Depth Chart */}
      <div className="card">
        <div className="card-header">Depth Chart</div>
        <div className="p-4 grid grid-cols-5 gap-4">
          {positions.map(pos => {
            const posPlayers = players
              .filter(p => p.position === pos)
              .sort((a, b) => b.stats.overall - a.stats.overall)
            
            return (
              <div key={pos}>
                <h4 className="text-sm font-semibold text-gray-400 mb-2">{pos}</h4>
                <div className="space-y-1">
                  {posPlayers.map((player, i) => (
                    <Link
                      key={player.id}
                      to={`/player/${player.id}`}
                      className={clsx(
                        'block text-sm p-2 rounded hover:bg-surface-100 transition-colors',
                        i === 0 && 'bg-surface-100 font-medium'
                      )}
                    >
                      <span className={getRatingClass(player.stats.overall)}>
                        {player.stats.overall}
                      </span>
                      {' '}
                      <span className="text-gray-300">{player.lastName}</span>
                    </Link>
                  ))}
                  {posPlayers.length === 0 && (
                    <p className="text-xs text-gray-600">No players</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface SortHeaderProps {
  label: string
  sortKey: SortKey
  currentKey: SortKey
  sortDir: SortDir
  onClick: () => void
}

function SortHeader({ label, sortKey, currentKey, sortDir, onClick }: SortHeaderProps) {
  const isActive = sortKey === currentKey
  
  return (
    <th 
      onClick={onClick}
      className="cursor-pointer select-none hover:text-white transition-colors"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown size={12} className={clsx(
          'transition-opacity',
          isActive ? 'opacity-100' : 'opacity-0'
        )} />
      </span>
    </th>
  )
}
