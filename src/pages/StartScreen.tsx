import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { NBA_TEAMS } from '../gm/data/teams'
import { Trophy, Users, Calendar, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

export default function StartScreen() {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [conference, setConference] = useState<'Eastern' | 'Western'>('Western')
  const { initializeGame } = useGameStore()
  
  const teams = NBA_TEAMS.filter(t => t.conference === conference)
  
  const handleStart = () => {
    if (selectedTeam) {
      initializeGame(selectedTeam)
    }
  }
  
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Hero */}
      <div className="relative py-16 px-4 bg-gradient-to-b from-surface-50 to-surface">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Basketball GM
            </h1>
            <p className="text-xl text-gray-400">
              Build your dynasty. Manage your roster. Win championships.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center gap-8 text-sm text-gray-500"
          >
            <div className="flex items-center gap-2">
              <Trophy className="text-primary" size={18} />
              <span>Full Season Sim</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="text-accent" size={18} />
              <span>30 NBA Teams</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="text-accent-gold" size={18} />
              <span>Multi-Year Dynasties</span>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Team Selection */}
      <div className="flex-1 px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-center mb-6">Select Your Team</h2>
            
            {/* Conference Toggle */}
            <div className="flex justify-center mb-8">
              <div className="bg-surface-50 p-1 rounded-lg inline-flex">
                {(['Eastern', 'Western'] as const).map(conf => (
                  <button
                    key={conf}
                    onClick={() => setConference(conf)}
                    className={clsx(
                      'px-6 py-2 rounded-md text-sm font-medium transition-all',
                      conference === conf
                        ? 'bg-primary text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    )}
                  >
                    {conf} Conference
                  </button>
                ))}
              </div>
            </div>
            
            {/* Team Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
              {teams.map(team => (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeam(team.id)}
                  className={clsx(
                    'group relative p-4 rounded-xl border-2 transition-all',
                    selectedTeam === team.id
                      ? 'border-primary bg-primary/10 scale-105'
                      : 'border-surface-200 bg-surface-50 hover:border-surface-300 hover:bg-surface-100'
                  )}
                >
                  <div 
                    className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: team.colors.primary }}
                  >
                    {team.abbreviation}
                  </div>
                  <p className="text-sm font-semibold text-center truncate">{team.city}</p>
                  <p className="text-xs text-gray-500 text-center">{team.name}</p>
                  
                  {team.championships.length > 0 && (
                    <div className="absolute -top-2 -right-2 flex items-center gap-1 bg-accent-gold/20 text-accent-gold px-2 py-0.5 rounded-full text-xs font-medium">
                      <Star size={10} fill="currentColor" />
                      {team.championships.length}
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            {/* Selected Team Info */}
            {selectedTeam && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface-50 rounded-xl p-6 mb-8 border border-surface-200"
              >
                {(() => {
                  const team = NBA_TEAMS.find(t => t.id === selectedTeam)
                  if (!team) return null
                  
                  return (
                    <div className="flex items-center gap-6">
                      <div 
                        className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg"
                        style={{ 
                          backgroundColor: team.colors.primary,
                          boxShadow: `0 10px 40px ${team.colors.primary}40`
                        }}
                      >
                        {team.abbreviation}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold">{team.city} {team.name}</h3>
                        <p className="text-gray-400">{team.arena}</p>
                        <div className="flex gap-4 mt-2 text-sm">
                          <span className="text-gray-500">
                            {team.conference} • {team.division}
                          </span>
                          {team.championships.length > 0 && (
                            <span className="text-accent-gold flex items-center gap-1">
                              <Trophy size={14} />
                              {team.championships.length} Championship{team.championships.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={handleStart}
                        className="btn btn-primary px-8 py-3 text-lg"
                      >
                        Start Dynasty
                      </button>
                    </div>
                  )
                })()}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-6 text-center text-sm text-gray-600">
        <p>Pure management simulation • No 3D gameplay • Just GM decisions</p>
      </footer>
    </div>
  )
}
