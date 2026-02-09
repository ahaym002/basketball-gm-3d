import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, ChevronRight, ChevronLeft, Play, Users, BarChart3, 
  ArrowRightLeft, UserPlus, Trophy, HelpCircle, CheckCircle2
} from 'lucide-react'
import clsx from 'clsx'

interface TutorialStep {
  id: string
  title: string
  description: string
  icon: typeof Play
  highlight?: string // CSS selector to highlight
  position?: 'center' | 'bottom-right' | 'top-left'
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Basketball GM! 🏀',
    description: 'You are now the General Manager of your team. Your job is to build a championship roster through smart decisions. Let\'s learn the basics!',
    icon: Trophy,
    position: 'center'
  },
  {
    id: 'play-button',
    title: 'Advancing Time',
    description: 'Click the PLAY button in the bottom-right to simulate games. You can play one day, one week, or simulate to the next major event (playoffs, draft, etc.).',
    icon: Play,
    position: 'bottom-right',
    highlight: '.play-button'
  },
  {
    id: 'dashboard',
    title: 'Your Dashboard',
    description: 'The dashboard shows your team\'s record, upcoming games, recent results, and standings. Check it often to track your progress!',
    icon: BarChart3,
    position: 'center'
  },
  {
    id: 'roster',
    title: 'Managing Your Roster',
    description: 'Visit the Roster page to see all your players, their ratings, contracts, and stats. You can release players here if needed.',
    icon: Users,
    position: 'top-left'
  },
  {
    id: 'free-agents',
    title: 'Signing Free Agents',
    description: 'The Free Agents page shows available players. Sign them to fill roster gaps! Watch your salary cap - you can\'t go too far over.',
    icon: UserPlus,
    position: 'center'
  },
  {
    id: 'trade',
    title: 'Making Trades',
    description: 'Use the Trade page to swap players with other teams. Build packages that make sense - other GMs will reject bad deals!',
    icon: ArrowRightLeft,
    position: 'center'
  },
  {
    id: 'schedule',
    title: 'Playing Live Games',
    description: 'On the Schedule page, click "Play" next to any upcoming game to watch it live with play-by-play action and coaching controls!',
    icon: Play,
    position: 'center'
  },
  {
    id: 'goals',
    title: 'Your First Season Goals',
    description: 'Try to: Make a trade, Sign a free agent, Win 40+ games, Make the playoffs. Good luck, GM!',
    icon: CheckCircle2,
    position: 'center'
  }
]

const TUTORIAL_STORAGE_KEY = 'basketball-gm-tutorial-complete'

export default function TutorialOverlay() {
  const [isVisible, setIsVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [showHelpButton, setShowHelpButton] = useState(false)

  useEffect(() => {
    // Check if tutorial was already completed
    const completed = localStorage.getItem(TUTORIAL_STORAGE_KEY)
    if (!completed) {
      // Delay showing tutorial to let the UI settle
      const timer = setTimeout(() => setIsVisible(true), 500)
      return () => clearTimeout(timer)
    } else {
      setShowHelpButton(true)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeTutorial()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completeTutorial = () => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true')
    setIsVisible(false)
    setShowHelpButton(true)
  }

  const restartTutorial = () => {
    setCurrentStep(0)
    setIsVisible(true)
  }

  const step = tutorialSteps[currentStep]
  const Icon = step.icon

  return (
    <>
      {/* Help button to restart tutorial */}
      <AnimatePresence>
        {showHelpButton && !isVisible && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={restartTutorial}
            className="fixed bottom-6 left-6 z-50 p-3 rounded-full bg-surface-100 border border-surface-200 hover:bg-surface-200 text-gray-400 hover:text-white transition-all shadow-lg"
            title="Show Tutorial"
          >
            <HelpCircle size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Tutorial overlay */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={completeTutorial}
            />

            {/* Tutorial card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={clsx(
                'relative bg-surface-50 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-surface-200',
                step.position === 'bottom-right' && 'fixed bottom-24 right-24',
                step.position === 'top-left' && 'fixed top-24 left-24'
              )}
            >
              {/* Close button */}
              <button
                onClick={completeTutorial}
                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              {/* Progress dots */}
              <div className="flex justify-center gap-1.5 mb-6">
                {tutorialSteps.map((_, i) => (
                  <div
                    key={i}
                    className={clsx(
                      'w-2 h-2 rounded-full transition-all',
                      i === currentStep 
                        ? 'bg-primary w-6' 
                        : i < currentStep 
                          ? 'bg-primary/50' 
                          : 'bg-surface-200'
                    )}
                  />
                ))}
              </div>

              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                  <Icon size={32} />
                </div>
              </div>

              {/* Content */}
              <h2 className="text-xl font-bold text-center mb-3">
                {step.title}
              </h2>
              <p className="text-gray-400 text-center text-sm leading-relaxed mb-6">
                {step.description}
              </p>

              {/* Navigation */}
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className={clsx(
                    'flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    currentStep === 0
                      ? 'text-gray-600 cursor-not-allowed'
                      : 'text-gray-400 hover:text-white hover:bg-surface-100'
                  )}
                >
                  <ChevronLeft size={16} />
                  Back
                </button>

                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 px-6 py-2 rounded-lg bg-primary hover:bg-primary-600 text-white text-sm font-semibold transition-all"
                >
                  {currentStep === tutorialSteps.length - 1 ? (
                    'Get Started!'
                  ) : (
                    <>
                      Next
                      <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </div>

              {/* Skip link */}
              <button
                onClick={completeTutorial}
                className="block w-full text-center text-xs text-gray-600 hover:text-gray-400 mt-4 transition-colors"
              >
                Skip tutorial
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
