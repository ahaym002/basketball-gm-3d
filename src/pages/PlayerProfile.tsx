import { useParams, Link, useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { formatCurrency, formatHeight, getRatingClass } from '../utils/format'
import { ArrowLeft, ArrowLeftRight, UserMinus, Star, TrendingUp, TrendingDown } from 'lucide-react'
import clsx from 'clsx'

export default function PlayerProfile() {
  const { playerId } = useParams()
  const navigate = useNavigate()
  const { getPlayer, state, getUserTeam, releasePlayer } = useGameStore()
  
  const player = playerId ? getPlayer(playerId) : null
  const team = player?.teamId ? state?.teams[player.teamId] : null
  const userTeam = getUserTeam()
  const isUserPlayer = player?.teamId === userTeam?.id
  
  if (!player || !state) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Player not found</p>
        <Link to="/roster" className="text-primary hover:underline mt-2 inline-block">
          Back to Roster
        </Link>
      </div>
    )
  }
  
  const stats = player.stats
  const ratingCategories = [
    { name: 'Athletic', ratings: [
      { label: 'Speed', value: stats.speed },
      { label: 'Strength', value: stats.strength },
      { label: 'Jumping', value: stats.jumping },
      { label: 'Endurance', value: stats.endurance },
    ]},
    { name: 'Offensive', ratings: [
      { label: 'Inside', value: stats.insideScoring },
      { label: 'Mid-Range', value: stats.midRange },
      { label: 'Three Point', value: stats.threePoint },
      { label: 'Free Throw', value: stats.freeThrow },
      { label: 'Ball Handling', value: stats.ballHandling },
      { label: 'Passing', value: stats.passing },
    ]},
    { name: 'Defensive', ratings: [
      { label: 'Perimeter D', value: stats.perimeterDefense },
      { label: 'Interior D', value: stats.interiorDefense },
      { label: 'Stealing', value: stats.stealing },
      { label: 'Blocking', value: stats.blocking },
    ]},
    { name: 'Rebounding', ratings: [
      { label: 'Off. Reb', value: stats.offensiveRebounding },
      { label: 'Def. Reb', value: stats.defensiveRebounding },
    ]},
    { name: 'Intangibles', ratings: [
      { label: 'Basketball IQ', value: stats.basketballIQ },
      { label: 'Work Ethic', value: stats.workEthic },
      { label: 'Durability', value: stats.durability },
      { label: 'Clutch', value: stats.clutch },
    ]},
  ]
  
  const isPeaking = player.age >= player.peakAge - 1 && player.age <= player.peakAge + 2
  const isDeclining = player.age > player.peakAge + 2
  const isDeveloping = player.age < player.peakAge - 1
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-surface-100 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            {player.firstName} {player.lastName}
          </h1>
          <div className="flex items-center gap-3 mt-1 text-gray-400">
            <span className="badge badge-info">{player.position}</span>
            {player.secondaryPosition && (
              <span className="text-gray-600">/ {player.secondaryPosition}</span>
            )}
            <span>•</span>
            <span>{formatHeight(player.height)}</span>
            <span>•</span>
            <span>{player.weight} lbs</span>
            <span>•</span>
            <span>{player.age} years old</span>
            {player.college && (
              <>
                <span>•</span>
                <span>{player.college}</span>
              </>
            )}
          </div>
        </div>
        
        {team && (
          <div className="flex items-center gap-2">
            <span 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: team.colors.primary }}
            >
              {team.abbreviation}
            </span>
            <div className="text-right">
              <p className="font-medium">{team.city} {team.name}</p>
              <p className="text-sm text-gray-500">{team.wins}-{team.losses}</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500 uppercase">Overall</p>
          <p className={clsx('text-4xl font-bold', getRatingClass(stats.overall))}>
            {stats.overall}
          </p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500 uppercase">Potential</p>
          <p className={clsx('text-4xl font-bold', getRatingClass(player.potential))}>
            {player.potential}
          </p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500 uppercase">Trajectory</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            {isDeveloping && <TrendingUp size={24} className="text-primary" />}
            {isPeaking && <Star size={24} className="text-accent-gold" />}
            {isDeclining && <TrendingDown size={24} className="text-accent-red" />}
            <span className="text-lg font-medium">
              {isDeveloping ? 'Developing' : isPeaking ? 'Peak' : 'Declining'}
            </span>
          </div>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500 uppercase">Experience</p>
          <p className="text-4xl font-bold text-gray-300">
            {player.yearsExperience}
          </p>
          <p className="text-xs text-gray-500">years</p>
        </div>
      </div>
      
      {/* Contract */}
      <div className="card">
        <div className="card-header">Contract</div>
        <div className="p-4 grid md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500">Annual Salary</p>
            <p className="text-xl font-bold text-primary">
              {formatCurrency(player.contract.salary)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Years Remaining</p>
            <p className="text-xl font-bold">
              {player.contract.years}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Contract Type</p>
            <p className="text-xl font-bold capitalize">
              {player.contract.type}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Bird Rights</p>
            <p className="text-xl font-bold">
              {player.birdRights ? 'Yes' : 'No'}
            </p>
          </div>
        </div>
        
        {isUserPlayer && (
          <div className="px-4 py-3 border-t border-surface-200 flex gap-3">
            <Link to="/trade" className="btn btn-secondary">
              <ArrowLeftRight size={16} />
              Trade Player
            </Link>
            <button 
              onClick={() => {
                if (confirm(`Release ${player.firstName} ${player.lastName}?`)) {
                  releasePlayer(player.id)
                  navigate('/roster')
                }
              }}
              className="btn btn-danger"
            >
              <UserMinus size={16} />
              Release
            </button>
          </div>
        )}
      </div>
      
      {/* Ratings */}
      <div className="card">
        <div className="card-header">Player Ratings</div>
        <div className="p-4 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ratingCategories.map(category => (
            <div key={category.name}>
              <h4 className="text-sm font-semibold text-gray-400 mb-3">{category.name}</h4>
              <div className="space-y-2">
                {category.ratings.map(rating => (
                  <div key={rating.label} className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 w-28">{rating.label}</span>
                    <div className="flex-1 h-2 bg-surface-200 rounded-full overflow-hidden">
                      <div 
                        className={clsx(
                          'h-full rounded-full transition-all',
                          rating.value >= 85 ? 'bg-primary' :
                          rating.value >= 75 ? 'bg-accent' :
                          rating.value >= 65 ? 'bg-gray-400' :
                          rating.value >= 55 ? 'bg-accent-gold' : 'bg-accent-red'
                        )}
                        style={{ width: `${rating.value}%` }}
                      />
                    </div>
                    <span className={clsx('text-sm font-mono w-8', getRatingClass(rating.value))}>
                      {rating.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Injury Status */}
      {player.injury && (
        <div className="card border-accent-red/50">
          <div className="card-header text-accent-red">Injury Status</div>
          <div className="p-4">
            <p className="text-lg font-semibold text-accent-red">{player.injury.type}</p>
            <p className="text-gray-400">
              Severity: <span className="capitalize">{player.injury.severity}</span>
            </p>
            <p className="text-gray-400">
              Expected return: {player.injury.gamesRemaining} games
            </p>
          </div>
        </div>
      )}
      
      {/* Awards */}
      {player.awards.length > 0 && (
        <div className="card">
          <div className="card-header">Awards & Accolades</div>
          <div className="p-4 flex flex-wrap gap-2">
            {player.awards.map((award, i) => (
              <span 
                key={i}
                className="badge bg-accent-gold/20 text-accent-gold"
              >
                {award.year} {award.type}
              </span>
            ))}
            {player.allStarSelections > 0 && (
              <span className="badge bg-primary/20 text-primary">
                {player.allStarSelections}x All-Star
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
