import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const colors = {
  success: 'bg-green-500/10 border-green-500/30 text-green-400',
  error: 'bg-red-500/10 border-red-500/30 text-red-400',
  warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
}

export default function ToastProvider() {
  const { notifications, dismissNotification } = useGameStore()

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const timers = notifications.map(n => {
      return setTimeout(() => {
        dismissNotification(n.id)
      }, 5000)
    })

    return () => {
      timers.forEach(clearTimeout)
    }
  }, [notifications, dismissNotification])

  return (
    <div className="fixed bottom-20 right-6 z-40 space-y-2 max-w-sm">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => {
          const Icon = icons[notification.type]
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              className={clsx(
                'flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm shadow-xl',
                colors[notification.type]
              )}
            >
              <Icon size={20} className="flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{notification.title}</p>
                <p className="text-xs opacity-80 mt-0.5">{notification.message}</p>
              </div>
              <button
                onClick={() => dismissNotification(notification.id)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
