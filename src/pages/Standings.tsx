import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { formatRecord, getWinPct } from '../utils/format'
import clsx from 'clsx'

type View = 'conference' | 'division' | 'league'

export default function Standings() {
  const [view, setView] = useState<View>('conference')
  const { state, getStandings } = useGameStore()
  
  if (!state) {
    return <div className="text-gray-400">Loading...</div>
  }
  
  const userTeamId = state.userTeamId
  const eastTeams = getStandings('Eastern')
  const westTeams = getStandings('Western')
  
  const divisions: Record<string, typeof eastTeams> = {}
  Object.values(state.teams).forEach(team => {
    if (!divisions[team.division]) divisions[team.division] = []
    divisions[team.division].push(team)
  })
  
  // Sort each division
  Object.keys(divisions).forEach(div => {
    divisions[div].sort((a, b) => {
      const aWinPct = a.wins / (a.wins + a.losses || 1)
      const bWinPct = b.wins / (b.wins + b.losses || 1)
      return bWinPct - aWinPct
    })
  })
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">League Standings</h1>
        
        <div className="flex bg-surface-50 p-1 rounded-lg">
          {(['conference', 'division', 'league'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={clsx(
                'px-4 py-1.5 text-sm font-medium rounded-md transition-all capitalize',
                view === v
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      
      {view === 'conference' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <StandingsTable 
            title="Eastern Conference" 
            teams={eastTeams} 
            userTeamId={userTeamId}
          />
          <StandingsTable 
            title="Western Conference" 
            teams={westTeams} 
            userTeamId={userTeamId}
          />
        </div>
      )}
      
      {view === 'division' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(divisions).map(([division, teams]) => (
            <StandingsTable
              key={division}
              title={division}
              teams={teams}
              userTeamId={userTeamId}
              compact
            />
          ))}
        </div>
      )}
      
      {view === 'league' && (
        <StandingsTable
          title="League Standings"
          teams={[...eastTeams, ...westTeams].sort((a, b) => {
            const aWinPct = a.wins / (a.wins + a.losses || 1)
            const bWinPct = b.wins / (b.wins + b.losses || 1)
            return bWinPct - aWinPct
          })}
          userTeamId={userTeamId}
          showConference
        />
      )}
    </div>
  )
}

interface StandingsTableProps {
  title: string
  teams: any[]
  userTeamId: string
  compact?: boolean
  showConference?: boolean
}

function StandingsTable({ title, teams, userTeamId, compact, showConference }: StandingsTableProps) {
  return (
    <div className="card">
      <div className="card-header">{title}</div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-8">#</th>
              <th>Team</th>
              {showConference && <th>Conf</th>}
              <th className="text-center">W</th>
              <th className="text-center">L</th>
              <th className="text-center">PCT</th>
              {!compact && <th className="text-center">GB</th>}
              {!compact && <th className="text-center">Strk</th>}
              {!compact && <th className="text-center">L10</th>}
            </tr>
          </thead>
          <tbody>
            {teams.map((team, i) => {
              const isUser = team.id === userTeamId
              const winPct = team.wins + team.losses > 0 
                ? team.wins / (team.wins + team.losses)
                : 0
              
              // Calculate games behind leader
              const leader = teams[0]
              const leaderWinPct = leader.wins + leader.losses > 0
                ? leader.wins / (leader.wins + leader.losses)
                : 0
              const gb = ((leaderWinPct - winPct) * (team.wins + team.losses)) / 2
              
              // Calculate L10
              const l10 = team.lastTenGames || []
              const l10Wins = l10.filter((g: string) => g === 'W').length
              const l10Losses = l10.filter((g: string) => g === 'L').length
              
              // Is playoff spot?
              const isPlayoff = i < 10 // Top 10 make play-in/playoffs
              const isPlayIn = i >= 6 && i < 10
              
              return (
                <tr 
                  key={team.id}
                  className={clsx(
                    isUser && 'bg-primary/10',
                    i === 5 && 'border-b-2 border-surface-300',
                    i === 9 && 'border-b-2 border-surface-300'
                  )}
                >
                  <td className="font-medium text-gray-500">{i + 1}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: team.colors.primary }}
                      >
                        {team.abbreviation}
                      </span>
                      <span className={clsx(
                        'truncate',
                        isUser && 'font-semibold'
                      )}>
                        {team.city} {team.name}
                      </span>
                    </div>
                  </td>
                  {showConference && (
                    <td className="text-gray-500 text-xs">{team.conference[0]}</td>
                  )}
                  <td className="text-center text-primary font-medium">{team.wins}</td>
                  <td className="text-center text-accent-red font-medium">{team.losses}</td>
                  <td className="text-center font-mono">{getWinPct(team.wins, team.losses)}</td>
                  {!compact && (
                    <>
                      <td className="text-center text-gray-500">
                        {i === 0 ? '-' : gb.toFixed(1)}
                      </td>
                      <td className="text-center">
                        {team.streak !== 0 && (
                          <span className={clsx(
                            'text-xs font-medium',
                            team.streak > 0 ? 'text-primary' : 'text-accent-red'
                          )}>
                            {team.streak > 0 ? 'W' : 'L'}{Math.abs(team.streak)}
                          </span>
                        )}
                      </td>
                      <td className="text-center text-gray-400 text-xs">
                        {l10Wins}-{l10Losses}
                      </td>
                    </>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      {/* Legend */}
      {!compact && (
        <div className="px-4 py-2 text-xs text-gray-500 border-t border-surface-200 flex gap-4">
          <span>1-6: Playoffs</span>
          <span>7-10: Play-In</span>
        </div>
      )}
    </div>
  )
}
