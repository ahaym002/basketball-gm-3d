import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, ChevronRight, Calendar, Shield, Activity, 
  DollarSign, Zap, Users, TrendingUp, Info
} from 'lucide-react'
import clsx from 'clsx'
import { 
  GameSettings, 
  DEFAULT_SETTINGS, 
  Difficulty, 
  SeasonLength, 
  SEASON_GAMES,
  GameMode
} from '../types/gameSettings'

interface GameSettingsPageProps {
  gameMode: GameMode
  onConfirm: (settings: GameSettings) => void
  onBack: () => void
}

type SettingOption<T> = {
  value: T
  label: string
  description: string
  icon?: typeof Settings
}

export default function GameSettingsPage({ gameMode, onConfirm, onBack }: GameSettingsPageProps) {
  const [settings, setSettings] = useState<GameSettings>({
    ...DEFAULT_SETTINGS,
    gameMode
  })

  const difficultyOptions: SettingOption<Difficulty>[] = [
    { 
      value: 'easy', 
      label: 'Easy', 
      description: 'Relaxed gameplay, forgiving AI, easier trades',
      icon: Zap
    },
    { 
      value: 'normal', 
      label: 'Normal', 
      description: 'Balanced challenge, realistic AI behavior',
      icon: Shield
    },
    { 
      value: 'hard', 
      label: 'Hard', 
      description: 'Tough AI opponents, strict salary cap, hard trades',
      icon: TrendingUp
    },
  ]

  const seasonLengthOptions: SettingOption<SeasonLength>[] = [
    { 
      value: 'full', 
      label: 'Full Season', 
      description: `${SEASON_GAMES.full} games - Complete NBA experience`,
      icon: Calendar
    },
    { 
      value: 'half', 
      label: 'Half Season', 
      description: `${SEASON_GAMES.half} games - Faster paced season`,
      icon: Calendar
    },
    { 
      value: 'short', 
      label: 'Short Season', 
      description: `${SEASON_GAMES.short} games - Quick playoff push`,
      icon: Calendar
    },
  ]

  const toggleOptions: { key: keyof GameSettings; label: string; description: string; icon: typeof Settings }[] = [
    {
      key: 'salaryCap',
      label: 'Salary Cap',
      description: 'Enable realistic salary cap constraints',
      icon: DollarSign
    },
    {
      key: 'injuries',
      label: 'Injuries',
      description: 'Players can get injured during games',
      icon: Activity
    },
  ]

  const handleToggle = (key: keyof GameSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full"
      >
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white mb-6 flex items-center gap-2 transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back
        </button>

        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-8 h-8 text-primary" />
          <h2 className="text-3xl font-bold">Game Settings</h2>
        </div>
        <p className="text-gray-400 mb-8">Customize your experience</p>

        <div className="space-y-8">
          {/* Difficulty */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Difficulty
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {difficultyOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSettings(prev => ({ ...prev, difficulty: opt.value }))}
                  className={clsx(
                    'p-4 rounded-xl border-2 text-left transition-all',
                    settings.difficulty === opt.value
                      ? 'border-primary bg-primary/10'
                      : 'border-surface-200 bg-surface-50 hover:border-surface-300'
                  )}
                >
                  <div className={clsx(
                    'font-bold mb-1',
                    settings.difficulty === opt.value ? 'text-primary' : 'text-white'
                  )}>
                    {opt.label}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {opt.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Season Length */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              Season Length
            </h3>
            <div className="space-y-2">
              {seasonLengthOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSettings(prev => ({ ...prev, seasonLength: opt.value }))}
                  className={clsx(
                    'w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between',
                    settings.seasonLength === opt.value
                      ? 'border-accent bg-accent/10'
                      : 'border-surface-200 bg-surface-50 hover:border-surface-300'
                  )}
                >
                  <div>
                    <div className={clsx(
                      'font-bold',
                      settings.seasonLength === opt.value ? 'text-accent' : 'text-white'
                    )}>
                      {opt.label}
                    </div>
                    <p className="text-sm text-gray-500">{opt.description}</p>
                  </div>
                  <div className={clsx(
                    'w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold',
                    settings.seasonLength === opt.value
                      ? 'bg-accent/20 text-accent'
                      : 'bg-surface-200 text-gray-400'
                  )}>
                    {SEASON_GAMES[opt.value]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Options */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-400" />
              Additional Options
            </h3>
            <div className="space-y-3">
              {toggleOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleToggle(opt.key)}
                  className="w-full p-4 rounded-xl border border-surface-200 bg-surface-50 flex items-center justify-between transition-all hover:bg-surface-100"
                >
                  <div className="flex items-center gap-3">
                    <opt.icon className="w-5 h-5 text-gray-400" />
                    <div className="text-left">
                      <div className="font-medium">{opt.label}</div>
                      <p className="text-sm text-gray-500">{opt.description}</p>
                    </div>
                  </div>
                  <div className={clsx(
                    'w-12 h-7 rounded-full p-1 transition-colors',
                    settings[opt.key] ? 'bg-primary' : 'bg-surface-300'
                  )}>
                    <div className={clsx(
                      'w-5 h-5 rounded-full bg-white transition-transform',
                      settings[opt.key] ? 'translate-x-5' : 'translate-x-0'
                    )} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-surface-50 rounded-xl p-4 border border-surface-200">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Settings Summary</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Mode:</span>{' '}
                <span className="font-medium capitalize">{gameMode}</span>
              </div>
              <div>
                <span className="text-gray-500">Difficulty:</span>{' '}
                <span className="font-medium capitalize">{settings.difficulty}</span>
              </div>
              <div>
                <span className="text-gray-500">Games:</span>{' '}
                <span className="font-medium">{SEASON_GAMES[settings.seasonLength]}</span>
              </div>
              <div>
                <span className="text-gray-500">Salary Cap:</span>{' '}
                <span className="font-medium">{settings.salaryCap ? 'On' : 'Off'}</span>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <button
            onClick={() => onConfirm(settings)}
            className="w-full btn btn-primary py-4 text-lg font-bold flex items-center justify-center gap-3"
          >
            <Users className="w-6 h-6" />
            Choose Your Team
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </div>
  )
}
