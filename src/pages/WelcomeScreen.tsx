import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, Users, Calendar, TrendingUp, Settings, Play, 
  Database, Sparkles, ChevronRight, Save, Clock, Trash2
} from 'lucide-react'
import clsx from 'clsx'
import { SaveManager, SaveSlot } from '../utils/saveManager'
import { GameMode } from '../types/gameSettings'

interface WelcomeScreenProps {
  onNewGame: (mode: GameMode) => void
  onLoadGame: (slotId: number) => void
}

export default function WelcomeScreen({ onNewGame, onLoadGame }: WelcomeScreenProps) {
  const [view, setView] = useState<'main' | 'mode' | 'load'>('main')
  const [saveSlots, setSaveSlots] = useState<SaveSlot[]>(() => SaveManager.getSaveSlots())
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const handleDeleteSave = (slotId: number) => {
    SaveManager.deleteSave(slotId)
    setSaveSlots(SaveManager.getSaveSlots())
    setDeleteConfirm(null)
  }

  const features = [
    { icon: Trophy, title: 'Full Season Sim', desc: 'Experience a complete NBA season' },
    { icon: Users, title: '30 Teams', desc: 'All NBA franchises available' },
    { icon: Calendar, title: 'Multi-Year', desc: 'Build a dynasty over many seasons' },
    { icon: TrendingUp, title: 'Player Development', desc: 'Watch your players grow' },
  ]

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {view === 'main' && (
          <motion.div
            key="main"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl w-full"
          >
            {/* Logo & Title */}
            <div className="text-center mb-10">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-accent mb-6 shadow-2xl shadow-primary/30"
              >
                <Trophy className="w-12 h-12 text-white" />
              </motion.div>
              
              <h1 className="text-5xl font-extrabold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Basketball GM
              </h1>
              <p className="text-lg text-gray-400 max-w-md mx-auto">
                Take control of an NBA franchise. Manage rosters, make trades, and build a championship dynasty.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
              {features.map((feat, i) => (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="bg-surface-50 rounded-xl p-4 text-center border border-surface-200"
                >
                  <feat.icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium text-sm">{feat.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{feat.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onClick={() => setView('mode')}
                className="w-full btn btn-primary py-4 text-lg font-bold flex items-center justify-center gap-3"
              >
                <Play className="w-6 h-6" />
                New Game
                <ChevronRight className="w-5 h-5" />
              </motion.button>

              {saveSlots.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  onClick={() => setView('load')}
                  className="w-full bg-surface-50 hover:bg-surface-100 border border-surface-200 rounded-xl py-4 text-lg font-medium flex items-center justify-center gap-3 transition-colors"
                >
                  <Save className="w-6 h-6" />
                  Continue ({saveSlots.length} save{saveSlots.length !== 1 ? 's' : ''})
                </motion.button>
              )}
            </div>

            {/* Footer */}
            <p className="text-center text-sm text-gray-600 mt-8">
              Pure management simulation • Make GM decisions, shape your team's destiny
            </p>
          </motion.div>
        )}

        {view === 'mode' && (
          <motion.div
            key="mode"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="max-w-xl w-full"
          >
            <button
              onClick={() => setView('main')}
              className="text-gray-400 hover:text-white mb-6 flex items-center gap-2 transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back
            </button>

            <h2 className="text-3xl font-bold mb-2">Choose Game Mode</h2>
            <p className="text-gray-400 mb-8">Select how you want to play</p>

            <div className="space-y-4">
              {/* Fiction Mode */}
              <button
                onClick={() => onNewGame('fiction')}
                className="w-full bg-surface-50 hover:bg-surface-100 border-2 border-surface-200 hover:border-primary rounded-2xl p-6 text-left transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:from-primary/30 group-hover:to-accent/30 transition-all">
                    <Sparkles className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">
                      Fiction Mode
                    </h3>
                    <p className="text-gray-400 text-sm mb-3">
                      Generated rosters with fictional players. Perfect for a fresh start with randomized talent.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium">
                        Recommended
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-surface-200 text-gray-400 text-xs">
                        Full Features
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-500 group-hover:text-primary transition-colors" />
                </div>
              </button>

              {/* Real NBA Mode */}
              <button
                onClick={() => onNewGame('real')}
                disabled
                className="w-full bg-surface-50 border-2 border-surface-200 rounded-2xl p-6 text-left opacity-60 cursor-not-allowed"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-surface-200 flex items-center justify-center">
                    <Database className="w-7 h-7 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">
                      Real NBA Mode
                    </h3>
                    <p className="text-gray-400 text-sm mb-3">
                      Play with real NBA 2024-25 rosters, salaries, and contracts.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                        Coming Soon
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-500" />
                </div>
              </button>
            </div>
          </motion.div>
        )}

        {view === 'load' && (
          <motion.div
            key="load"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="max-w-xl w-full"
          >
            <button
              onClick={() => setView('main')}
              className="text-gray-400 hover:text-white mb-6 flex items-center gap-2 transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back
            </button>

            <h2 className="text-3xl font-bold mb-2">Load Game</h2>
            <p className="text-gray-400 mb-8">Continue where you left off</p>

            <div className="space-y-3">
              {saveSlots
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((slot) => (
                  <div
                    key={slot.id}
                    className="bg-surface-50 border border-surface-200 rounded-xl overflow-hidden"
                  >
                    {deleteConfirm === slot.id ? (
                      <div className="p-4">
                        <p className="text-center mb-3">Delete this save?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="flex-1 px-4 py-2 rounded-lg bg-surface-200 hover:bg-surface-300 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDeleteSave(slot.id)}
                            className="flex-1 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <button
                          onClick={() => onLoadGame(slot.id)}
                          className="flex-1 p-4 text-left hover:bg-surface-100 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold">{slot.name}</span>
                                {slot.id === 0 && (
                                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs">
                                    Auto
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-400">
                                {slot.teamName} • {slot.record.wins}-{slot.record.losses}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Season {slot.season} • {slot.phase}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-gray-500 text-sm">
                                <Clock className="w-4 h-4" />
                                {SaveManager.formatTimestamp(slot.timestamp)}
                              </div>
                              <span className={clsx(
                                'text-xs px-2 py-0.5 rounded mt-1 inline-block',
                                slot.gameMode === 'real' 
                                  ? 'bg-accent/20 text-accent'
                                  : 'bg-primary/20 text-primary'
                              )}>
                                {slot.gameMode === 'real' ? 'Real NBA' : 'Fiction'}
                              </span>
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(slot.id)}
                          className="p-4 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {saveSlots.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Save className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No saved games found</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
