import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { Calendar, ChevronLeft, ChevronRight, Play } from 'lucide-react'
import clsx from 'clsx'

type Filter = 'all' | 'upcoming' | 'played'

export default function Schedule() {
  const [filter, setFilter] = useState<Filter>('all')
  const { state, getUserTeam } = useGameStore()
  
  const team = getUserTeam()
  
  if (!state || !team) {
    return <div className="text-gray-400">Loading...</div>
  }
  
  const allGames = state.currentSeason.schedule.filter(g => 
    !g.isPlayoff && (g.homeTeamId === team.id || g.awayTeamId === team.id)
  )
  
  const filteredGames = allGames.filter(g => {
    if (filter === 'upcoming') return !g.played
    if (filter === 'played') return g.played
    return true
  })
  
  // Group by month
  const gamesByMonth: Record<string, typeof filteredGames> = {}
  filteredGames.forEach(game => {
    const monthKey = `${game.date.year}-${game.date.month.toString().padStart(2, '0')}`
    if (!gamesByMonth[monthKey]) gamesByMonth[monthKey] = []
    gamesByMonth[monthKey].push(game)
  })
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  const stats = {
    total: allGames.length,
    played: allGames.filter(g => g.played).length,
    wins: allGames.filter(g => {
      if (!g.played) return false
      const isHome = g.homeTeamId === team.id
      const userScore = isHome ? g.homeScore : g.awayScore
      const oppScore = isHome ? g.awayScore : g.homeScore
      return (userScore || 0) > (oppScore || 0)
    }).length,
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Schedule</h1>
          <p className="text-gray-400">
            {stats.played}/{stats.total} games played • {stats.wins}-{stats.played - stats.wins} record
          </p>
        </div>
        
        <div className="flex bg-surface-50 p-1 rounded-lg">
          {(['all', 'upcoming', 'played'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                'px-4 py-1.5 text-sm font-medium rounded-md transition-all capitalize',
                filter === f
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      
      {/* Schedule */}
      <div className="space-y-6">
        {Object.entries(gamesByMonth).map(([monthKey, games]) => {
          const [year, month] = monthKey.split('-').map(Number)
          
          return (
            <div key={monthKey} className="card">
              <div className="card-header flex items-center gap-2">
                <Calendar size={16} />
                <span>{monthNames[month - 1]} {year}</span>
                <span className="text-gray-500 text-xs ml-2">
                  ({games.length} games)
                </span>
              </div>
              
              <div className="divide-y divide-surface-200">
                {games.map(game => {
                  const isHome = game.homeTeamId === team.id
                  const opponent = state.teams[isHome ? game.awayTeamId : game.homeTeamId]
                  const userScore = isHome ? game.homeScore : game.awayScore
                  const oppScore = isHome ? game.awayScore : game.homeScore
                  const won = game.played && (userScore || 0) > (oppScore || 0)
                  
                  return (
                    <div 
                      key={game.id}
                      className={clsx(
                        'flex items-center px-4 py-3 gap-4',
                        game.played && 'bg-surface-100/30'
                      )}
                    >
                      {/* Date */}
                      <div className="w-12 text-center">
                        <p className="text-xs text-gray-500">{monthNames[month - 1]}</p>
                        <p className="text-lg font-bold">{game.date.day}</p>
                      </div>
                      
                      {/* Opponent */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-gray-500 text-sm w-6">
                          {isHome ? 'vs' : '@'}
                        </span>
                        <span 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: opponent?.colors.primary || '#666' }}
                        >
                          {opponent?.abbreviation}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {opponent?.city} {opponent?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {opponent?.wins}-{opponent?.losses}
                          </p>
                        </div>
                      </div>
                      
                      {/* Result / Play Button */}
                      <div className="w-32 text-right">
                        {game.played ? (
                          <div>
                            <span className={clsx(
                              'text-sm font-bold mr-2',
                              won ? 'text-primary' : 'text-accent-red'
                            )}>
                              {won ? 'W' : 'L'}
                            </span>
                            <span className="font-mono">
                              {userScore}-{oppScore}
                            </span>
                          </div>
                        ) : (
                          <Link 
                            to={`/game/${game.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            <Play size={14} fill="currentColor" />
                            Play
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        
        {filteredGames.length === 0 && (
          <div className="card p-8 text-center text-gray-500">
            No games to display
          </div>
        )}
      </div>
    </div>
  )
}
