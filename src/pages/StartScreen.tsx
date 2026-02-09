import { useState, useMemo } from 'react'
import { NBA_TEAMS } from '../gm/data/teams'
import { 
  Trophy, Users, ChevronRight,
  DollarSign, Target, Zap, Award
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { GameSettings } from '../types/gameSettings'

type SortOption = 'name' | 'championships' | 'difficulty'

interface StartScreenProps {
  settings: GameSettings
  onSelectTeam: (teamId: string) => void
  onBack: () => void
}

// Calculate team difficulty based on championships and history
function getTeamDifficulty(team: typeof NBA_TEAMS[0]): { level: 'easy' | 'medium' | 'hard'; label: string; description: string } {
  const recentChampionships = team.championships.filter(y => y >= 2015).length
  const totalChampionships = team.championships.length
  
  if (recentChampionships >= 2 || totalChampionships >= 10) {
    return { 
      level: 'easy', 
      label: 'Contender',
      description: 'Strong foundation, high expectations'
    }
  }
  if (totalChampionships >= 3 || recentChampionships === 1) {
    return { 
      level: 'medium', 
      label: 'Competitive',
      description: 'Solid roster, playoff potential'
    }
  }
  return { 
    level: 'hard', 
    label: 'Rebuild',
    description: 'Young team, building for future'
  }
}

// Generate mock team ratings (would come from actual roster in full game)
function getTeamRating(team: typeof NBA_TEAMS[0]): number {
  const baseRating = 65
  const champBonus = Math.min(team.championships.length * 2, 15)
  const recentBonus = team.championships.filter(y => y >= 2020).length * 5
  return Math.min(99, baseRating + champBonus + recentBonus + Math.floor(Math.random() * 10))
}

// Team strengths based on team identity
function getTeamStrengths(team: typeof NBA_TEAMS[0]): { offense: number; defense: number; threePoint: number; rebounding: number } {
  // Generate semi-random but consistent strengths
  const seed = team.id.charCodeAt(0) + team.id.charCodeAt(1)
  return {
    offense: 60 + (seed % 30),
    defense: 55 + ((seed * 7) % 35),
    threePoint: 50 + ((seed * 13) % 40),
    rebounding: 55 + ((seed * 11) % 35)
  }
}

export default function StartScreen({ settings, onSelectTeam, onBack }: StartScreenProps) {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [conference, setConference] = useState<'all' | 'Eastern' | 'Western'>('all')
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(null)
  
  const teams = useMemo(() => {
    let filtered = [...NBA_TEAMS]
    
    // Filter by conference
    if (conference !== 'all') {
      filtered = filtered.filter(t => t.conference === conference)
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'championships':
          return b.championships.length - a.championships.length
        case 'difficulty':
          const diffA = getTeamDifficulty(a).level
          const diffB = getTeamDifficulty(b).level
          const order = { easy: 0, medium: 1, hard: 2 }
          return order[diffA] - order[diffB]
        default:
          return a.city.localeCompare(b.city)
      }
    })
    
    return filtered
  }, [conference, sortBy])
  
  const handleStart = () => {
    if (selectedTeam) {
      onSelectTeam(selectedTeam)
    }
  }
  
  const selectedTeamData = NBA_TEAMS.find(t => t.id === selectedTeam)
  
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Hero */}
      <div className="relative py-8 px-4 bg-gradient-to-b from-surface-50 to-surface">
        <div className="max-w-5xl mx-auto">
          {/* Back button */}
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white mb-4 flex items-center gap-2 transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to Settings
          </button>
          
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Select Your Team
              </h1>
              <p className="text-gray-400">
                Choose a franchise to begin your dynasty
              </p>
            </motion.div>
            
            {/* Settings summary */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-4 text-sm text-gray-500 bg-surface-50 px-4 py-2 rounded-lg border border-surface-200"
            >
              <span className="capitalize">{settings.gameMode} Mode</span>
              <span className="w-px h-4 bg-surface-300" />
              <span className="capitalize">{settings.difficulty} Difficulty</span>
              <span className="w-px h-4 bg-surface-300" />
              <span className="capitalize">{settings.seasonLength} Season</span>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Team Selection */}
      <div className="flex-1 px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Header with filters */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold">Select Your Team</h2>
              
              <div className="flex items-center gap-3">
                {/* Conference Filter */}
                <div className="flex bg-surface-50 p-1 rounded-lg">
                  {(['all', 'Eastern', 'Western'] as const).map(conf => (
                    <button
                      key={conf}
                      onClick={() => setConference(conf)}
                      className={clsx(
                        'px-4 py-1.5 rounded-md text-sm font-medium transition-all',
                        conference === conf
                          ? 'bg-primary text-white shadow'
                          : 'text-gray-400 hover:text-white'
                      )}
                    >
                      {conf === 'all' ? 'All' : conf}
                    </button>
                  ))}
                </div>
                
                {/* Sort dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-surface-50 border border-surface-200 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-primary"
                >
                  <option value="name">Sort: City</option>
                  <option value="championships">Sort: Championships</option>
                  <option value="difficulty">Sort: Difficulty</option>
                </select>
              </div>
            </div>
            
            {/* Team Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
              {teams.map(team => {
                const difficulty = getTeamDifficulty(team)
                const rating = getTeamRating(team)
                const isSelected = selectedTeam === team.id
                const isHovered = hoveredTeam === team.id
                
                return (
                  <motion.button
                    key={team.id}
                    onClick={() => setSelectedTeam(team.id)}
                    onMouseEnter={() => setHoveredTeam(team.id)}
                    onMouseLeave={() => setHoveredTeam(null)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={clsx(
                      'group relative p-4 rounded-xl border-2 transition-all text-left',
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-surface-200 bg-surface-50 hover:border-surface-300'
                    )}
                  >
                    {/* Team badge */}
                    <div className="flex items-start justify-between mb-3">
                      <div 
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                        style={{ 
                          backgroundColor: team.colors.primary,
                          boxShadow: `0 4px 12px ${team.colors.primary}40`
                        }}
                      >
                        {team.abbreviation}
                      </div>
                      
                      {/* Rating badge */}
                      <div className={clsx(
                        'px-2 py-1 rounded-lg text-xs font-bold',
                        rating >= 85 ? 'bg-primary/20 text-primary' :
                        rating >= 75 ? 'bg-accent/20 text-accent' :
                        rating >= 65 ? 'bg-gray-500/20 text-gray-300' :
                        'bg-red-500/20 text-red-400'
                      )}>
                        {rating}
                      </div>
                    </div>
                    
                    {/* Team name */}
                    <p className="font-semibold truncate">{team.city}</p>
                    <p className="text-sm text-gray-500 truncate">{team.name}</p>
                    
                    {/* Quick stats */}
                    <div className="flex items-center gap-3 mt-3 text-xs">
                      {/* Championships */}
                      {team.championships.length > 0 && (
                        <div className="flex items-center gap-1 text-accent-gold">
                          <Trophy size={12} />
                          <span>{team.championships.length}</span>
                        </div>
                      )}
                      
                      {/* Difficulty */}
                      <div className={clsx(
                        'flex items-center gap-1',
                        difficulty.level === 'easy' ? 'text-green-400' :
                        difficulty.level === 'medium' ? 'text-yellow-400' :
                        'text-red-400'
                      )}>
                        <Target size={12} />
                        <span>{difficulty.label}</span>
                      </div>
                    </div>
                    
                    {/* Hover info preview */}
                    <AnimatePresence>
                      {isHovered && !isSelected && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full bg-surface-100 border border-surface-200 rounded-lg px-3 py-2 text-xs z-10 whitespace-nowrap shadow-xl"
                        >
                          <p className="text-gray-400">{team.arena}</p>
                          <p className="text-gray-500">{team.division} Division</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                )
              })}
            </div>
            
            {/* Selected Team Detail Panel */}
            <AnimatePresence>
              {selectedTeamData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-surface-50 rounded-2xl border border-surface-200 overflow-hidden"
                >
                  {/* Header with team colors */}
                  <div 
                    className="p-6 relative overflow-hidden"
                    style={{ 
                      background: `linear-gradient(135deg, ${selectedTeamData.colors.primary}20, ${selectedTeamData.colors.secondary}10)` 
                    }}
                  >
                    <div className="flex items-center gap-6">
                      {/* Large team logo */}
                      <div 
                        className="w-24 h-24 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl flex-shrink-0"
                        style={{ 
                          backgroundColor: selectedTeamData.colors.primary,
                          boxShadow: `0 10px 40px ${selectedTeamData.colors.primary}50`
                        }}
                      >
                        {selectedTeamData.abbreviation}
                      </div>
                      
                      {/* Team info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-3xl font-bold mb-1">
                          {selectedTeamData.city} {selectedTeamData.name}
                        </h3>
                        <p className="text-gray-400 mb-3">
                          {selectedTeamData.arena} • {selectedTeamData.conference}ern Conference • {selectedTeamData.division} Division
                        </p>
                        
                        {/* Badges */}
                        <div className="flex flex-wrap gap-2">
                          {selectedTeamData.championships.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent-gold/20 text-accent-gold text-sm font-medium">
                              <Trophy size={14} />
                              {selectedTeamData.championships.length} Championship{selectedTeamData.championships.length > 1 ? 's' : ''}
                            </span>
                          )}
                          
                          {(() => {
                            const diff = getTeamDifficulty(selectedTeamData)
                            return (
                              <span className={clsx(
                                'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium',
                                diff.level === 'easy' ? 'bg-green-500/20 text-green-400' :
                                diff.level === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                              )}>
                                <Target size={14} />
                                {diff.label}
                              </span>
                            )
                          })()}
                          
                          <span className={clsx(
                            'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium',
                            selectedTeamData.ownerWealth === 'luxury' ? 'bg-purple-500/20 text-purple-400' :
                            selectedTeamData.ownerWealth === 'willing' ? 'bg-blue-500/20 text-blue-400' :
                            selectedTeamData.ownerWealth === 'moderate' ? 'bg-gray-500/20 text-gray-400' :
                            'bg-red-500/20 text-red-400'
                          )}>
                            <DollarSign size={14} />
                            {selectedTeamData.ownerWealth === 'luxury' ? 'Big Spender' :
                             selectedTeamData.ownerWealth === 'willing' ? 'Willing to Spend' :
                             selectedTeamData.ownerWealth === 'moderate' ? 'Moderate' : 'Budget'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Start button */}
                      <button
                        onClick={handleStart}
                        className="btn btn-primary px-8 py-4 text-lg font-bold flex-shrink-0"
                      >
                        Start Dynasty
                      </button>
                    </div>
                  </div>
                  
                  {/* Team details grid */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-surface-200">
                    {/* Team Strengths */}
                    {(() => {
                      const strengths = getTeamStrengths(selectedTeamData)
                      return (
                        <div className="bg-surface-50 p-4">
                          <h4 className="text-xs text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <Zap size={14} />
                            Team Strengths
                          </h4>
                          <div className="space-y-2">
                            {Object.entries(strengths).map(([key, value]) => (
                              <div key={key} className="flex items-center justify-between text-sm">
                                <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-24 h-2 bg-surface-200 rounded-full overflow-hidden">
                                    <div 
                                      className={clsx(
                                        'h-full rounded-full',
                                        value >= 80 ? 'bg-primary' :
                                        value >= 70 ? 'bg-accent' :
                                        value >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                      )}
                                      style={{ width: `${value}%` }}
                                    />
                                  </div>
                                  <span className="w-8 text-right font-medium">{value}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })()}
                    
                    {/* Championship History */}
                    <div className="bg-surface-50 p-4">
                      <h4 className="text-xs text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Trophy size={14} />
                        Championship History
                      </h4>
                      {selectedTeamData.championships.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {selectedTeamData.championships.slice(-10).map(year => (
                            <span 
                              key={year} 
                              className="px-2 py-0.5 bg-accent-gold/20 text-accent-gold text-xs rounded font-medium"
                            >
                              {year}
                            </span>
                          ))}
                          {selectedTeamData.championships.length > 10 && (
                            <span className="px-2 py-0.5 text-gray-500 text-xs">
                              +{selectedTeamData.championships.length - 10} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No championships yet - be the first to bring one home!</p>
                      )}
                    </div>
                    
                    {/* Retired Numbers */}
                    <div className="bg-surface-50 p-4">
                      <h4 className="text-xs text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Award size={14} />
                        Legends
                      </h4>
                      {selectedTeamData.retiredNumbers.length > 0 ? (
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {selectedTeamData.retiredNumbers.slice(0, 4).map(({ number, playerName }) => (
                            <div key={number} className="flex items-center gap-2 text-sm">
                              <span className="w-8 h-8 rounded bg-surface-200 flex items-center justify-center font-bold text-primary">
                                {number}
                              </span>
                              <span className="text-gray-300 truncate">{playerName}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">Write your own legacy!</p>
                      )}
                    </div>
                    
                    {/* Difficulty Info */}
                    <div className="bg-surface-50 p-4">
                      <h4 className="text-xs text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Target size={14} />
                        Challenge Level
                      </h4>
                      {(() => {
                        const diff = getTeamDifficulty(selectedTeamData)
                        return (
                          <div>
                            <div className={clsx(
                              'text-2xl font-bold mb-1',
                              diff.level === 'easy' ? 'text-green-400' :
                              diff.level === 'medium' ? 'text-yellow-400' :
                              'text-red-400'
                            )}>
                              {diff.level === 'easy' ? '⭐ Easy' :
                               diff.level === 'medium' ? '⭐⭐ Medium' :
                               '⭐⭐⭐ Hard'}
                            </div>
                            <p className="text-sm text-gray-400">{diff.description}</p>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* No selection prompt */}
            {!selectedTeamData && (
              <div className="text-center py-8 text-gray-500">
                <Users size={48} className="mx-auto mb-3 opacity-50" />
                <p>Select a team above to see details</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-4 text-center text-sm text-gray-600 border-t border-surface-200">
        <p>Pure management simulation • No 3D gameplay • Just GM decisions</p>
      </footer>
    </div>
  )
}
