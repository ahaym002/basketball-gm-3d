import { useGameStore } from '../store/gameStore'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const colors = {
  success: 'border-primary bg-primary/10 text-primary',
  error: 'border-accent-red bg-accent-red/10 text-accent-red',
  warning: 'border-accent-gold bg-accent-gold/10 text-accent-gold',
  info: 'border-accent bg-accent/10 text-accent',
}

export default function NotificationPanel() {
  const { notifications, dismissNotification } = useGameStore()
  
  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {notifications.slice(-5).map(notification => {
          const Icon = icons[notification.type]
          
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className={clsx(
                'pointer-events-auto bg-surface-50 border-l-4 rounded-lg p-4 shadow-xl flex items-start gap-3',
                colors[notification.type]
              )}
            >
              <Icon size={20} className="flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm">{notification.title}</p>
                <p className="text-gray-400 text-sm mt-0.5">{notification.message}</p>
              </div>
              <button
                onClick={() => dismissNotification(notification.id)}
                className="p-1 hover:bg-surface-200 rounded transition-colors text-gray-400"
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
