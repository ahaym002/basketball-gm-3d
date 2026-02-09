import { useGameStore } from '../store/gameStore'
import { formatCurrency } from '../utils/format'
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, PiggyBank } from 'lucide-react'
import clsx from 'clsx'

export default function Finances() {
  const { getUserTeam, getTeamPlayers, state } = useGameStore()
  
  const team = getUserTeam()
  const players = team ? getTeamPlayers(team.id) : []
  
  if (!state || !team) {
    return <div className="text-gray-400">Loading...</div>
  }
  
  // Calculate financial metrics
  const salaryCap = team.salaryCap
  const luxuryTax = team.taxLine
  const payroll = team.payroll
  const capSpace = salaryCap - payroll
  const isOverCap = payroll > salaryCap
  const isOverTax = payroll > luxuryTax
  
  // Simulated revenue/expenses
  const revenue = {
    tickets: 45000000 + (team.wins * 100000),
    merchandise: 12000000 + (team.wins * 50000),
    tv: 35000000,
    sponsorships: 15000000
  }
  
  const expenses = {
    payroll: team.payroll,
    staff: 8000000,
    facilities: 4000000,
    other: 3000000,
    luxuryTaxPenalty: isOverTax ? (payroll - luxuryTax) * 1.5 : 0
  }
  
  const totalRevenue = Object.values(revenue).reduce((a, b) => a + b, 0)
  const totalExpenses = Object.values(expenses).reduce((a, b) => a + b, 0)
  const netProfit = totalRevenue - totalExpenses
  
  // Contract obligations
  const sortedPlayers = [...players].sort((a, b) => b.contract.salary - a.contract.salary)
  const futureCommitments = players.reduce((total, p) => {
    return total + (p.contract.salary * Math.max(0, p.contract.years - 1))
  }, 0)
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Team Finances</h1>
        <p className="text-gray-400">{state.currentSeason.year}-{state.currentSeason.year + 1} Season</p>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={DollarSign}
          label="Payroll"
          value={formatCurrency(payroll)}
          subtext={`of ${formatCurrency(salaryCap)} cap`}
          status={isOverCap ? 'warning' : 'good'}
        />
        <MetricCard
          icon={PiggyBank}
          label="Cap Space"
          value={formatCurrency(Math.max(0, capSpace))}
          subtext={isOverCap ? 'Over cap' : 'Available'}
          status={isOverCap ? 'danger' : 'good'}
        />
        <MetricCard
          icon={isOverTax ? AlertTriangle : DollarSign}
          label="Luxury Tax"
          value={isOverTax ? formatCurrency(expenses.luxuryTaxPenalty) : 'None'}
          subtext={`Line: ${formatCurrency(luxuryTax)}`}
          status={isOverTax ? 'danger' : 'good'}
        />
        <MetricCard
          icon={netProfit >= 0 ? TrendingUp : TrendingDown}
          label="Net Profit"
          value={formatCurrency(Math.abs(netProfit))}
          subtext={netProfit >= 0 ? 'Profitable' : 'Loss'}
          status={netProfit >= 0 ? 'good' : 'danger'}
        />
      </div>
      
      {/* Cap Bar */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-4">Salary Cap Usage</h3>
        <div className="relative h-8 bg-surface-200 rounded-lg overflow-hidden">
          {/* Cap line */}
          <div 
            className="absolute top-0 bottom-0 w-px bg-primary z-10"
            style={{ left: `${(salaryCap / (luxuryTax * 1.2)) * 100}%` }}
          />
          {/* Tax line */}
          <div 
            className="absolute top-0 bottom-0 w-px bg-accent-red z-10"
            style={{ left: `${(luxuryTax / (luxuryTax * 1.2)) * 100}%` }}
          />
          {/* Payroll bar */}
          <div 
            className={clsx(
              'h-full transition-all',
              isOverTax ? 'bg-accent-red' :
              isOverCap ? 'bg-accent-gold' : 'bg-primary'
            )}
            style={{ width: `${Math.min(100, (payroll / (luxuryTax * 1.2)) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>$0</span>
          <span className="text-primary">Cap: {formatCurrency(salaryCap)}</span>
          <span className="text-accent-red">Tax: {formatCurrency(luxuryTax)}</span>
        </div>
      </div>
      
      {/* Revenue & Expenses */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">Revenue</div>
          <div className="p-4 space-y-3">
            {Object.entries(revenue).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="capitalize text-gray-400">{key.replace(/([A-Z])/g, ' $1')}</span>
                <span className="font-mono text-primary">{formatCurrency(value)}</span>
              </div>
            ))}
            <div className="pt-3 border-t border-surface-200 flex justify-between items-center font-semibold">
              <span>Total Revenue</span>
              <span className="text-primary">{formatCurrency(totalRevenue)}</span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">Expenses</div>
          <div className="p-4 space-y-3">
            {Object.entries(expenses).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="capitalize text-gray-400">{key.replace(/([A-Z])/g, ' $1')}</span>
                <span className={clsx(
                  'font-mono',
                  key === 'luxuryTaxPenalty' && value > 0 ? 'text-accent-red' : 'text-accent-red'
                )}>
                  {formatCurrency(value)}
                </span>
              </div>
            ))}
            <div className="pt-3 border-t border-surface-200 flex justify-between items-center font-semibold">
              <span>Total Expenses</span>
              <span className="text-accent-red">{formatCurrency(totalExpenses)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Contracts */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <span>Player Contracts</span>
          <span className="text-gray-500 text-xs font-normal">
            Future commitments: {formatCurrency(futureCommitments)}
          </span>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Pos</th>
                <th>Age</th>
                <th className="text-right">Salary</th>
                <th className="text-center">Years</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map(player => (
                <tr key={player.id}>
                  <td className="font-medium">{player.firstName} {player.lastName}</td>
                  <td className="text-gray-500">{player.position}</td>
                  <td>{player.age}</td>
                  <td className="text-right font-mono">{formatCurrency(player.contract.salary)}</td>
                  <td className="text-center">{player.contract.years}</td>
                  <td>
                    <span className="badge badge-info capitalize">
                      {player.contract.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-surface-100">
              <tr>
                <td colSpan={3} className="font-semibold">Total</td>
                <td className="text-right font-mono font-semibold">
                  {formatCurrency(payroll)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}

interface MetricCardProps {
  icon: typeof DollarSign
  label: string
  value: string
  subtext: string
  status: 'good' | 'warning' | 'danger'
}

function MetricCard({ icon: Icon, label, value, subtext, status }: MetricCardProps) {
  const colors = {
    good: 'text-primary',
    warning: 'text-accent-gold',
    danger: 'text-accent-red'
  }
  
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
          <p className={clsx('text-2xl font-bold mt-1', colors[status])}>{value}</p>
          <p className="text-xs text-gray-500 mt-1">{subtext}</p>
        </div>
        <div className={clsx('p-2 rounded-lg bg-surface-100', colors[status])}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}
