import { useState } from 'react'
import { MatchState, PlayerGameStats } from '../../engine/MatchEngine'
import { Player } from '../../gm/types'
import clsx from 'clsx'

interface BoxScoreProps {
  matchState: MatchState
}

export default function BoxScore({ matchState }: BoxScoreProps) {
  const [viewTeam, setViewTeam] = useState<'home' | 'away'>('home')
  
  const team = viewTeam === 'home' ? matchState.homeTeam : matchState.awayTeam
  const players = viewTeam === 'home' ? matchState.homePlayers : matchState.awayPlayers
  const stats = viewTeam === 'home' ? matchState.homeStats : matchState.awayStats
  const lineup = viewTeam === 'home' ? matchState.homeLineup : matchState.awayLineup
  
  // Sort players: starters first, then by minutes
  const sortedPlayers = [...players].sort((a, b) => {
    const aOnCourt = lineup.includes(a.id) ? 1 : 0
    const bOnCourt = lineup.includes(b.id) ? 1 : 0
    if (aOnCourt !== bOnCourt) return bOnCourt - aOnCourt
    return (stats[b.id]?.minutes || 0) - (stats[a.id]?.minutes || 0)
  })
  
  const formatMins = (mins: number) => {
    return `${Math.floor(mins)}:${Math.floor((mins % 1) * 60).toString().padStart(2, '0')}`
  }
  
  const teamTotals = players.reduce((acc, p) => {
    const s = stats[p.id]
    if (!s) return acc
    return {
      points: acc.points + s.points,
      rebounds: acc.rebounds + s.rebounds,
      assists: acc.assists + s.assists,
      steals: acc.steals + s.steals,
      blocks: acc.blocks + s.blocks,
      turnovers: acc.turnovers + s.turnovers,
      fgm: acc.fgm + s.fgm,
      fga: acc.fga + s.fga,
      tpm: acc.tpm + s.tpm,
      tpa: acc.tpa + s.tpa,
      ftm: acc.ftm + s.ftm,
      fta: acc.fta + s.fta,
    }
  }, { points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0 })
  
  return (
    <div className="card">
      {/* Team Tabs */}
      <div className="flex border-b border-surface-200">
        {(['home', 'away'] as const).map(t => {
          const tm = t === 'home' ? matchState.homeTeam : matchState.awayTeam
          const score = t === 'home' ? matchState.homeScore : matchState.awayScore
          
          return (
            <button
              key={t}
              onClick={() => setViewTeam(t)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-3 px-4 py-3 transition-colors',
                viewTeam === t ? 'bg-surface-100' : 'hover:bg-surface-100/50'
              )}
            >
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: tm.colors.primary }}
              >
                {tm.abbreviation}
              </div>
              <span className="font-semibold">{tm.name}</span>
              <span className="text-2xl font-bold tabular-nums">{score}</span>
            </button>
          )
        })}
      </div>
      
      {/* Stats Table */}
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Player</th>
              <th className="text-center">MIN</th>
              <th className="text-center">PTS</th>
              <th className="text-center">REB</th>
              <th className="text-center">AST</th>
              <th className="text-center">STL</th>
              <th className="text-center">BLK</th>
              <th className="text-center">TO</th>
              <th className="text-center">FG</th>
              <th className="text-center">3PT</th>
              <th className="text-center">FT</th>
              <th className="text-center">+/-</th>
              <th className="text-center">GRD</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map(player => {
              const s = stats[player.id]
              if (!s || s.minutes < 0.5) return null
              
              const isOnCourt = lineup.includes(player.id)
              
              return (
                <tr 
                  key={player.id}
                  className={clsx(isOnCourt && 'bg-primary/10')}
                >
                  <td>
                    <div className="flex items-center gap-2">
                      {isOnCourt && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      <span className="text-xs text-gray-500 w-6">{player.position}</span>
                      <span className="font-medium">{player.firstName[0]}. {player.lastName}</span>
                      {s.isHot && <span title="Hot">🔥</span>}
                      {s.isCold && <span title="Cold">❄️</span>}
                    </div>
                  </td>
                  <td className="text-center font-mono text-sm">{formatMins(s.minutes)}</td>
                  <td className="text-center font-bold">{s.points}</td>
                  <td className="text-center">{s.rebounds}</td>
                  <td className="text-center">{s.assists}</td>
                  <td className="text-center">{s.steals}</td>
                  <td className="text-center">{s.blocks}</td>
                  <td className="text-center text-gray-400">{s.turnovers}</td>
                  <td className="text-center text-sm">{s.fgm}-{s.fga}</td>
                  <td className="text-center text-sm">{s.tpm}-{s.tpa}</td>
                  <td className="text-center text-sm">{s.ftm}-{s.fta}</td>
                  <td className={clsx(
                    'text-center font-mono',
                    s.plusMinus > 0 && 'text-primary',
                    s.plusMinus < 0 && 'text-accent-red'
                  )}>
                    {s.plusMinus > 0 ? '+' : ''}{s.plusMinus}
                  </td>
                  <td className="text-center">
                    <span className={clsx(
                      'px-2 py-0.5 rounded text-xs font-bold',
                      s.grade.startsWith('A') && 'bg-primary/20 text-primary',
                      s.grade.startsWith('B') && 'bg-accent/20 text-accent',
                      s.grade.startsWith('C') && 'bg-gray-500/20 text-gray-400',
                      s.grade.startsWith('D') && 'bg-accent-red/20 text-accent-red',
                    )}>
                      {s.grade}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="bg-surface-100 font-semibold">
            <tr>
              <td>TOTAL</td>
              <td className="text-center">-</td>
              <td className="text-center">{teamTotals.points}</td>
              <td className="text-center">{teamTotals.rebounds}</td>
              <td className="text-center">{teamTotals.assists}</td>
              <td className="text-center">{teamTotals.steals}</td>
              <td className="text-center">{teamTotals.blocks}</td>
              <td className="text-center">{teamTotals.turnovers}</td>
              <td className="text-center">{teamTotals.fgm}-{teamTotals.fga}</td>
              <td className="text-center">{teamTotals.tpm}-{teamTotals.tpa}</td>
              <td className="text-center">{teamTotals.ftm}-{teamTotals.fta}</td>
              <td className="text-center">-</td>
              <td className="text-center">-</td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      {/* Team Stats Comparison */}
      <div className="border-t border-surface-200 p-4">
        <h4 className="text-sm font-semibold text-gray-400 mb-3">Team Comparison</h4>
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <TeamStatBar 
            label="FG%" 
            homeValue={matchState.homeStats ? Object.values(matchState.homeStats).reduce((a, s) => a + s.fgm, 0) / Math.max(1, Object.values(matchState.homeStats).reduce((a, s) => a + s.fga, 0)) * 100 : 0}
            awayValue={matchState.awayStats ? Object.values(matchState.awayStats).reduce((a, s) => a + s.fgm, 0) / Math.max(1, Object.values(matchState.awayStats).reduce((a, s) => a + s.fga, 0)) * 100 : 0}
            homeColor={matchState.homeTeam.colors.primary}
            awayColor={matchState.awayTeam.colors.primary}
          />
          <TeamStatBar 
            label="3P%" 
            homeValue={matchState.homeStats ? Object.values(matchState.homeStats).reduce((a, s) => a + s.tpm, 0) / Math.max(1, Object.values(matchState.homeStats).reduce((a, s) => a + s.tpa, 0)) * 100 : 0}
            awayValue={matchState.awayStats ? Object.values(matchState.awayStats).reduce((a, s) => a + s.tpm, 0) / Math.max(1, Object.values(matchState.awayStats).reduce((a, s) => a + s.tpa, 0)) * 100 : 0}
            homeColor={matchState.homeTeam.colors.primary}
            awayColor={matchState.awayTeam.colors.primary}
          />
          <TeamStatBar 
            label="REB" 
            homeValue={Object.values(matchState.homeStats).reduce((a, s) => a + s.rebounds, 0)}
            awayValue={Object.values(matchState.awayStats).reduce((a, s) => a + s.rebounds, 0)}
            homeColor={matchState.homeTeam.colors.primary}
            awayColor={matchState.awayTeam.colors.primary}
            isCount
          />
        </div>
      </div>
    </div>
  )
}

function TeamStatBar({ 
  label, 
  homeValue, 
  awayValue, 
  homeColor, 
  awayColor,
  isCount = false 
}: { 
  label: string
  homeValue: number
  awayValue: number
  homeColor: string
  awayColor: string
  isCount?: boolean
}) {
  const total = homeValue + awayValue || 1
  const homePercent = (homeValue / total) * 100
  
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{isCount ? homeValue : homeValue.toFixed(1) + '%'}</span>
        <span>{label}</span>
        <span>{isCount ? awayValue : awayValue.toFixed(1) + '%'}</span>
      </div>
      <div className="h-2 bg-surface-200 rounded-full overflow-hidden flex">
        <div 
          className="h-full transition-all"
          style={{ width: `${homePercent}%`, backgroundColor: homeColor }}
        />
        <div 
          className="h-full transition-all"
          style={{ width: `${100 - homePercent}%`, backgroundColor: awayColor }}
        />
      </div>
    </div>
  )
}
