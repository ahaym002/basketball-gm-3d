import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { Play, FastForward, SkipForward, ChevronUp, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

export default function PlayButton() {
  const [isOpen, setIsOpen] = useState(false)
  const { state, isSimulating, simulateDay, simulateWeek, advancePhase } = useGameStore()
  
  const phase = state?.currentSeason.phase || 'regular'
  
  const actions = [
    { 
      label: 'Play 1 Day', 
      icon: Play, 
      action: simulateDay,
      enabled: ['regular', 'playoffs'].includes(phase)
    },
    { 
      label: 'Play 1 Week', 
      icon: FastForward, 
      action: simulateWeek,
      enabled: ['regular'].includes(phase)
    },
    { 
      label: phase === 'draft' ? 'Continue Draft' : 
             phase === 'free-agency' ? 'Start New Season' :
             phase === 'offseason' ? 'Start Draft' :
             phase === 'playoffs' ? 'Sim Playoffs' : 'Sim to Playoffs', 
      icon: SkipForward, 
      action: advancePhase,
      enabled: true
    },
  ]
  
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full right-0 mb-2 bg-surface-100 border border-surface-200 rounded-xl shadow-2xl overflow-hidden min-w-48"
          >
            {actions.filter(a => a.enabled).map((action, i) => (
              <button
                key={i}
                onClick={() => {
                  action.action()
                  setIsOpen(false)
                }}
                disabled={isSimulating}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-200 transition-colors disabled:opacity-50"
              >
                <action.icon size={18} className="text-gray-400" />
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSimulating}
        className={clsx(
          'flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white shadow-xl transition-all',
          'bg-primary hover:bg-primary-600 hover:scale-105 active:scale-95',
          'disabled:opacity-50 disabled:hover:scale-100',
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
            <ChevronUp 
              size={16} 
              className={clsx(
                'transition-transform',
                isOpen && 'rotate-180'
              )} 
            />
          </>
        )}
      </button>
    </div>
  )
}
