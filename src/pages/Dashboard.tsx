import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Users,
  DollarSign,
  ArrowRight,
  Star,
  Clock,
  Play,
  Save,
  Check
} from 'lucide-react'
import { formatCurrency, formatRecord, getWinPct } from '../utils/format'
import clsx from 'clsx'

export default function Dashboard() {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const { 
    state, 
    getUserTeam, 
    getTeamPlayers,
    getUpcomingGames,
    getRecentGames,
    getStandings,
    getSeasonProgress,
    saveGame
  } = useGameStore()
  
  const handleSave = () => {
    setSaveStatus('saving')
    const success = saveGame(1, 'Quick Save')
    if (success) {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } else {
      setSaveStatus('idle')
    }
  }
  
  const team = getUserTeam()
  const players = team ? getTeamPlayers(team.id) : []
  const upcomingGames = team ? getUpcomingGames(team.id, 5) : []
  const recentGames = team ? getRecentGames(team.id, 5) : []
  const standings = getStandings(team?.conference)
  const progress = getSeasonProgress()
  
  if (!team || !state) {
    return <div className="text-gray-400">Loading...</div>
  }
  
  const teamRank = standings.findIndex(t => t.id === team.id) + 1
  const topPlayers = [...players].sort((a, b) => b.stats.overall - a.stats.overall).slice(0, 5)
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: team.colors.primary }}
            >
              {team.abbreviation}
            </span>
            {team.city} {team.name}
          </h1>
          <p className="text-gray-400 mt-1">
            {state.currentSeason.year}-{state.currentSeason.year + 1} Season • {state.currentSeason.phase}
          </p>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
              saveStatus === 'saved' 
                ? 'bg-green-600 text-white' 
                : 'bg-surface-100 hover:bg-surface-200 text-gray-300 hover:text-white'
            )}
          >
            {saveStatus === 'saved' ? (
              <>
                <Check size={18} />
                Saved!
              </>
            ) : (
              <>
                <Save size={18} />
                {saveStatus === 'saving' ? 'Saving...' : 'Save Game'}
              </>
            )}
          </button>
          
          <div className="text-right">
            <div className="text-3xl font-bold">
              <span className="text-primary">{team.wins}</span>
              <span className="text-gray-600 mx-1">-</span>
              <span className="text-accent-red">{team.losses}</span>
            </div>
            <p className="text-sm text-gray-400">
              #{teamRank} in {team.conference}
            </p>
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Trophy}
          label="Conference Rank"
          value={`#${teamRank}`}
          subtext={`${team.conference}ern`}
          color="text-primary"
        />
        <StatCard
          icon={team.streak >= 0 ? TrendingUp : TrendingDown}
          label="Current Streak"
          value={Math.abs(team.streak)}
          subtext={team.streak >= 0 ? 'Win Streak' : 'Loss Streak'}
          color={team.streak >= 0 ? 'text-primary' : 'text-accent-red'}
        />
        <StatCard
          icon={DollarSign}
          label="Payroll"
          value={formatCurrency(team.payroll)}
          subtext={`Cap: ${formatCurrency(team.salaryCap)}`}
          color={team.payroll > team.salaryCap ? 'text-accent-red' : 'text-accent'}
        />
        <StatCard
          icon={Clock}
          label="Season Progress"
          value={`${progress.percent}%`}
          subtext={`${progress.played}/${progress.total} games`}
          color="text-accent-gold"
        />
      </div>
      
      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming Games */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <span>Upcoming Games</span>
            <Link to="/schedule" className="text-primary hover:text-primary-400 text-xs">
              View All
            </Link>
          </div>
          <div className="divide-y divide-surface-200">
            {upcomingGames.length === 0 ? (
              <div className="p-4 text-gray-500 text-sm">No upcoming games</div>
            ) : (
              upcomingGames.map(game => (
                <GameRow 
                  key={game.id} 
                  game={game} 
                  userTeamId={team.id}
                  teams={state.teams}
                />
              ))
            )}
          </div>
        </div>
        
        {/* Recent Results */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <span>Recent Results</span>
            <Link to="/schedule" className="text-primary hover:text-primary-400 text-xs">
              View All
            </Link>
          </div>
          <div className="divide-y divide-surface-200">
            {recentGames.length === 0 ? (
              <div className="p-4 text-gray-500 text-sm">No games played yet</div>
            ) : (
              recentGames.map(game => (
                <ResultRow 
                  key={game.id} 
                  game={game} 
                  userTeamId={team.id}
                  teams={state.teams}
                />
              ))
            )}
          </div>
        </div>
        
        {/* Standings */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <span>{team.conference}ern Conference</span>
            <Link to="/standings" className="text-primary hover:text-primary-400 text-xs">
              View All
            </Link>
          </div>
          <div className="divide-y divide-surface-200">
            {standings.slice(0, 8).map((t, i) => (
              <div 
                key={t.id}
                className={clsx(
                  'flex items-center justify-between px-4 py-2 text-sm',
                  t.id === team.id && 'bg-primary/10'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 text-gray-500 font-medium">{i + 1}</span>
                  <span 
                    className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: t.colors.primary }}
                  >
                    {t.abbreviation}
                  </span>
                  <span className={clsx(t.id === team.id && 'font-semibold')}>
                    {t.city}
                  </span>
                </div>
                <div className="text-gray-400">
                  {formatRecord(t.wins, t.losses)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Top Players */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <span>Top Players</span>
          <Link to="/roster" className="text-primary hover:text-primary-400 text-xs flex items-center gap-1">
            Full Roster <ArrowRight size={12} />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 p-4">
          {topPlayers.map((player, i) => (
            <Link 
              key={player.id}
              to={`/player/${player.id}`}
              className="bg-surface-100 rounded-lg p-4 hover:bg-surface-200 transition-colors group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {i === 0 && <Star size={14} className="text-accent-gold" />}
                  <span className="text-xs text-gray-500 font-medium">{player.position}</span>
                </div>
                <span className={clsx(
                  'text-lg font-bold',
                  player.stats.overall >= 85 ? 'text-primary' :
                  player.stats.overall >= 75 ? 'text-accent' :
                  player.stats.overall >= 65 ? 'text-white' : 'text-gray-400'
                )}>
                  {player.stats.overall}
                </span>
              </div>
              <p className="font-semibold truncate group-hover:text-primary transition-colors">
                {player.firstName} {player.lastName}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(player.contract.salary)}/yr • {player.age}yo
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  icon: typeof Trophy
  label: string
  value: string | number
  subtext: string
  color: string
}

function StatCard({ icon: Icon, label, value, subtext, color }: StatCardProps) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
          <p className={clsx('text-2xl font-bold mt-1', color)}>{value}</p>
          <p className="text-xs text-gray-500 mt-1">{subtext}</p>
        </div>
        <div className={clsx('p-2 rounded-lg bg-surface-100', color)}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}

interface GameRowProps {
  game: any
  userTeamId: string
  teams: Record<string, any>
}

function GameRow({ game, userTeamId, teams }: GameRowProps) {
  const isHome = game.homeTeamId === userTeamId
  const opponent = teams[isHome ? game.awayTeamId : game.homeTeamId]
  
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm group hover:bg-surface-100/50">
      <div className="flex items-center gap-3">
        <span className="text-gray-500 text-xs w-6">{isHome ? 'vs' : '@'}</span>
        <span 
          className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: opponent?.colors.primary || '#666' }}
        >
          {opponent?.abbreviation}
        </span>
        <span>{opponent?.city} {opponent?.name}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-gray-500">
          {formatRecord(opponent?.wins || 0, opponent?.losses || 0)}
        </span>
        <Link 
          to={`/game/${game.id}`}
          className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-primary text-white text-xs rounded transition-all"
        >
          Play
        </Link>
      </div>
    </div>
  )
}

function ResultRow({ game, userTeamId, teams }: GameRowProps) {
  const isHome = game.homeTeamId === userTeamId
  const opponent = teams[isHome ? game.awayTeamId : game.homeTeamId]
  const userScore = isHome ? game.homeScore : game.awayScore
  const oppScore = isHome ? game.awayScore : game.homeScore
  const won = userScore > oppScore
  
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <div className="flex items-center gap-3">
        <span className={clsx(
          'text-xs font-bold w-4',
          won ? 'text-primary' : 'text-accent-red'
        )}>
          {won ? 'W' : 'L'}
        </span>
        <span className="text-gray-500 text-xs w-6">{isHome ? 'vs' : '@'}</span>
        <span 
          className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: opponent?.colors.primary || '#666' }}
        >
          {opponent?.abbreviation}
        </span>
        <span>{opponent?.name}</span>
      </div>
      <span className={clsx(
        'font-mono',
        won ? 'text-primary' : 'text-accent-red'
      )}>
        {userScore}-{oppScore}
      </span>
    </div>
  )
}
