import { useState, useCallback } from 'react'
import { useGameStore } from '../store/gameStore'
import { Play, FastForward, SkipForward, ChevronUp, Loader2, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

export default function PlayButton() {
  const [isOpen, setIsOpen] = useState(false)
  const { state, isSimulating, simulateDay, simulateWeek, advancePhase, addNotification } = useGameStore()
  
  const phase = state?.currentSeason.phase || 'regular'
  
  // Wrap actions to provide feedback
  const handleSimulateDay = useCallback(() => {
    const games = simulateDay()
    if (games && games.length > 0) {
      addNotification({
        type: 'info',
        title: 'Day Simulated',
        message: `${games.length} game${games.length > 1 ? 's' : ''} played`
      })
    } else if (phase === 'regular') {
      addNotification({
        type: 'info',
        title: 'No Games Today',
        message: 'Advancing to next game day...'
      })
    }
  }, [simulateDay, addNotification, phase])
  
  const handleSimulateWeek = useCallback(() => {
    const games = simulateWeek()
    if (games && games.length > 0) {
      addNotification({
        type: 'info',
        title: 'Week Simulated',
        message: `${games.length} game${games.length > 1 ? 's' : ''} played this week`
      })
    }
  }, [simulateWeek, addNotification])
  
  const handleAdvancePhase = useCallback(() => {
    advancePhase()
    addNotification({
      type: 'success',
      title: 'Phase Advanced',
      message: `Moving to ${state?.currentSeason.phase || 'next phase'}...`
    })
  }, [advancePhase, addNotification, state?.currentSeason.phase])
  
  const actions = [
    { 
      label: 'Play 1 Day', 
      icon: Play, 
      action: handleSimulateDay,
      description: 'Simulate today\'s games',
      enabled: ['regular', 'playoffs'].includes(phase)
    },
    { 
      label: 'Play 1 Week', 
      icon: FastForward, 
      action: handleSimulateWeek,
      description: 'Simulate a full week',
      enabled: ['regular'].includes(phase)
    },
    { 
      label: phase === 'draft' ? 'Continue Draft' : 
             phase === 'free-agency' ? 'Start New Season' :
             phase === 'offseason' ? 'Start Draft' :
             phase === 'playoffs' ? 'Sim Playoffs' : 'Sim to Playoffs', 
      icon: SkipForward, 
      description: phase === 'regular' ? 'Skip to playoffs' : 'Advance to next phase',
      action: handleAdvancePhase,
      enabled: true
    },
  ]
  
  return (
    <div className="fixed bottom-6 right-6 z-50 play-button">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full right-0 mb-2 bg-surface-100 border border-surface-200 rounded-xl shadow-2xl overflow-hidden min-w-56"
          >
            {/* Current phase indicator */}
            <div className="px-4 py-2 bg-surface-50 border-b border-surface-200 flex items-center gap-2 text-xs text-gray-500">
              <Calendar size={14} />
              <span className="capitalize">{phase} Season</span>
              {state?.currentSeason && (
                <span className="ml-auto">
                  Week {state.currentSeason.week}
                </span>
              )}
            </div>
            
            {actions.filter(a => a.enabled).map((action, i) => (
              <button
                key={i}
                onClick={() => {
                  action.action()
                  setIsOpen(false)
                }}
                disabled={isSimulating}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-200 transition-colors disabled:opacity-50 group"
              >
                <div className="p-2 rounded-lg bg-surface-50 group-hover:bg-primary/20 transition-colors">
                  <action.icon size={16} className="text-gray-400 group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{action.label}</p>
                  <p className="text-xs text-gray-500">{action.description}</p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSimulating}
        whileHover={{ scale: isSimulating ? 1 : 1.05 }}
        whileTap={{ scale: isSimulating ? 1 : 0.95 }}
        className={clsx(
          'flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white shadow-xl transition-all',
          'bg-primary hover:bg-primary-600',
          'disabled:opacity-70 disabled:cursor-wait',
          'shadow-primary/30'
        )}
      >
        {isSimulating ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            <span>Simulating...</span>
          </>
        ) : (
          <>
            <Play size={20} fill="currentColor" />
            <span>PLAY</span>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronUp size={16} />
            </motion.div>
          </>
        )}
      </motion.button>
    </div>
  )
}
