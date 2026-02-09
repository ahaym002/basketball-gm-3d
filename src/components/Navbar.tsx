import { Link, useLocation } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { Trophy, Calendar, Users, DollarSign, Settings } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { path: '/', label: 'Dashboard', icon: Trophy },
  { path: '/roster', label: 'Roster', icon: Users },
  { path: '/standings', label: 'League', icon: Trophy },
  { path: '/schedule', label: 'Schedule', icon: Calendar },
  { path: '/finances', label: 'Finances', icon: DollarSign },
]

export default function Navbar() {
  const location = useLocation()
  const { state, getUserTeam } = useGameStore()
  const team = getUserTeam()
  
  const phase = state?.currentSeason.phase || 'regular'
  const year = state?.currentSeason.year || new Date().getFullYear()
  
  const phaseLabels: Record<string, string> = {
    'preseason': 'Preseason',
    'regular': 'Regular Season',
    'playoffs': 'Playoffs',
    'offseason': 'Offseason',
    'draft': 'Draft',
    'free-agency': 'Free Agency',
  }
  
  return (
    <nav className="bg-surface-50 border-b border-surface-200 px-4 sticky top-0 z-50">
      <div className="flex items-center justify-between h-14">
        {/* Logo & Team */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: team?.colors.primary || '#22c55e' }}
            >
              {team?.abbreviation?.slice(0, 2) || 'GM'}
            </div>
            <span className="font-bold text-lg hidden sm:block">
              {team?.city} {team?.name}
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-1 text-sm text-gray-400">
            <span className="px-2 py-1 bg-surface-100 rounded">
              {year}-{(year + 1).toString().slice(2)}
            </span>
            <span className="px-2 py-1 bg-primary/20 text-primary rounded">
              {phaseLabels[phase] || phase}
            </span>
          </div>
        </div>
        
        {/* Main Nav */}
        <div className="hidden lg:flex items-center gap-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                location.pathname === item.path
                  ? 'bg-surface-100 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-surface-100/50'
              )}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
        </div>
        
        {/* Right side */}
        <div className="flex items-center gap-3">
          {team && (
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-primary font-semibold">{team.wins}</span>
              <span className="text-gray-500">-</span>
              <span className="text-accent-red font-semibold">{team.losses}</span>
            </div>
          )}
          
          <button className="p-2 rounded-lg hover:bg-surface-100 text-gray-400 hover:text-white transition-colors">
            <Settings size={18} />
          </button>
        </div>
      </div>
    </nav>
  )
}
