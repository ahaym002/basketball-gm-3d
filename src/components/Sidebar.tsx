import { Link, useLocation } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { 
  LayoutDashboard, 
  Users, 
  Trophy, 
  Calendar,
  UserPlus,
  ArrowLeftRight,
  GraduationCap,
  Wallet,
  History,
  Medal
} from 'lucide-react'
import clsx from 'clsx'

const sidebarSections = [
  {
    title: 'Team',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/roster', label: 'Roster', icon: Users },
      { path: '/schedule', label: 'Schedule', icon: Calendar },
      { path: '/finances', label: 'Finances', icon: Wallet },
    ]
  },
  {
    title: 'League',
    items: [
      { path: '/standings', label: 'Standings', icon: Trophy },
    ]
  },
  {
    title: 'Transactions',
    items: [
      { path: '/free-agents', label: 'Free Agents', icon: UserPlus },
      { path: '/trade', label: 'Trade Center', icon: ArrowLeftRight },
      { path: '/draft', label: 'Draft', icon: GraduationCap },
    ]
  },
]

export default function Sidebar() {
  const location = useLocation()
  const { state } = useGameStore()
  
  const phase = state?.currentSeason.phase
  
  return (
    <aside className="w-56 bg-surface-50 border-r border-surface-200 hidden md:flex flex-col overflow-y-auto">
      <div className="flex-1 py-4">
        {sidebarSections.map(section => (
          <div key={section.title} className="mb-6">
            <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {section.title}
            </h3>
            <nav className="space-y-0.5">
              {section.items.map(item => {
                const isActive = location.pathname === item.path
                const isDraftActive = item.path === '/draft' && phase === 'draft'
                const isFAActive = item.path === '/free-agents' && phase === 'free-agency'
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-2 mx-2 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-primary/20 text-primary'
                        : isDraftActive || isFAActive
                        ? 'bg-accent-gold/20 text-accent-gold'
                        : 'text-gray-400 hover:text-white hover:bg-surface-100'
                    )}
                  >
                    <item.icon size={18} />
                    <span>{item.label}</span>
                    {(isDraftActive || isFAActive) && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-accent-gold animate-pulse" />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        ))}
      </div>
      
      {/* Quick Stats */}
      <div className="border-t border-surface-200 p-4">
        <QuickStats />
      </div>
    </aside>
  )
}

function QuickStats() {
  const { getUserTeam, getSeasonProgress } = useGameStore()
  const team = getUserTeam()
  const progress = getSeasonProgress()
  
  if (!team) return null
  
  const capUsage = (team.payroll / team.salaryCap) * 100
  
  return (
    <div className="space-y-3 text-sm">
      <div>
        <div className="flex justify-between text-gray-400 mb-1">
          <span>Season</span>
          <span>{progress.percent}%</span>
        </div>
        <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>
      
      <div>
        <div className="flex justify-between text-gray-400 mb-1">
          <span>Cap</span>
          <span className={clsx(
            capUsage > 100 && 'text-accent-red',
            capUsage > 90 && capUsage <= 100 && 'text-accent-gold'
          )}>
            {capUsage.toFixed(0)}%
          </span>
        </div>
        <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
          <div 
            className={clsx(
              'h-full rounded-full transition-all',
              capUsage > 100 ? 'bg-accent-red' : 
              capUsage > 90 ? 'bg-accent-gold' : 'bg-accent'
            )}
            style={{ width: `${Math.min(100, capUsage)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
