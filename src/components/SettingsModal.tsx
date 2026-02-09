import { useState, useEffect } from 'react'
import { X, Save, FolderOpen, Trash2, Download, Upload, Check } from 'lucide-react'
import { SaveManager, SaveSlot } from '../utils/saveManager'
import { useGameStore } from '../store/gameStore'
import clsx from 'clsx'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

type Tab = 'save' | 'load' | 'settings'

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('save')
  const [slots, setSlots] = useState<SaveSlot[]>([])
  const [saveName, setSaveName] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [loadSuccess, setLoadSuccess] = useState(false)
  
  const { saveGame, state, loadFromSave, resetGame } = useGameStore()
  
  useEffect(() => {
    if (isOpen) {
      refreshSlots()
      setSaveSuccess(false)
      setLoadSuccess(false)
    }
  }, [isOpen])
  
  const refreshSlots = () => {
    const allSlots = SaveManager.getSaveSlots()
    // Filter out auto-save (slot 0) for display, show manual slots 1-5
    setSlots(allSlots.filter(s => s.id !== 0))
  }
  
  const handleSave = (slotId: number) => {
    const name = saveName || `Save ${slotId}`
    const success = saveGame(slotId, name)
    if (success) {
      setSaveSuccess(true)
      refreshSlots()
      setTimeout(() => setSaveSuccess(false), 2000)
    }
  }
  
  const handleLoad = (slotId: number) => {
    const success = loadFromSave(slotId)
    if (success) {
      setLoadSuccess(true)
      setTimeout(() => {
        setLoadSuccess(false)
        onClose()
      }, 1000)
    }
  }
  
  const handleDelete = (slotId: number) => {
    if (confirm('Delete this save? This cannot be undone.')) {
      SaveManager.deleteSave(slotId)
      refreshSlots()
    }
  }
  
  const handleExport = (slotId: number) => {
    const data = SaveManager.exportSave(slotId)
    if (data) {
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `basketball-gm-save-${slotId}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }
  
  if (!isOpen) return null
  
  const team = state ? state.teams[state.userTeamId] : null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-surface-50 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
          <h2 className="text-xl font-bold">Game Menu</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-100 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-surface-200">
          {[
            { id: 'save' as Tab, label: 'Save Game', icon: Save },
            { id: 'load' as Tab, label: 'Load Game', icon: FolderOpen },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-gray-400 hover:text-white hover:bg-surface-100/50'
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'save' && (
            <div className="space-y-4">
              {/* Current game info */}
              {team && (
                <div className="bg-surface-100 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-400 mb-1">Current Game</p>
                  <p className="font-semibold">{team.city} {team.name}</p>
                  <p className="text-sm text-gray-400">
                    {state?.currentSeason.year}-{(state?.currentSeason.year || 0) + 1} • {team.wins}-{team.losses}
                  </p>
                </div>
              )}
              
              {/* Save name input */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Save Name (optional)</label>
                <input
                  type="text"
                  value={saveName}
                  onChange={e => setSaveName(e.target.value)}
                  placeholder="My Dynasty Save"
                  className="w-full px-4 py-2 bg-surface-100 rounded-lg border border-surface-200 focus:border-primary focus:outline-none"
                />
              </div>
              
              {/* Save slots */}
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Save Slots</p>
                {[1, 2, 3, 4, 5].map(slotId => {
                  const existingSlot = slots.find(s => s.id === slotId)
                  return (
                    <div 
                      key={slotId}
                      className={clsx(
                        'flex items-center justify-between p-3 rounded-lg border transition-colors',
                        existingSlot 
                          ? 'bg-surface-100 border-surface-200' 
                          : 'bg-surface-100/50 border-surface-200/50 border-dashed'
                      )}
                    >
                      <div className="flex-1">
                        {existingSlot ? (
                          <>
                            <p className="font-medium">{existingSlot.name}</p>
                            <p className="text-sm text-gray-400">
                              {existingSlot.teamName} • {existingSlot.record.wins}-{existingSlot.record.losses} • {SaveManager.formatTimestamp(existingSlot.timestamp)}
                            </p>
                          </>
                        ) : (
                          <p className="text-gray-500">Empty Slot {slotId}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleSave(slotId)}
                        className="px-4 py-2 bg-primary hover:bg-primary/80 text-black font-medium rounded-lg transition-colors flex items-center gap-2"
                      >
                        {saveSuccess && selectedSlot === slotId ? (
                          <>
                            <Check size={16} />
                            Saved!
                          </>
                        ) : (
                          <>
                            <Save size={16} />
                            {existingSlot ? 'Overwrite' : 'Save'}
                          </>
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          
          {activeTab === 'load' && (
            <div className="space-y-4">
              {slots.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No saved games found</p>
                  <p className="text-sm mt-1">Start a new game and save it first</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {slots.map(slot => (
                    <div 
                      key={slot.id}
                      className="flex items-center justify-between p-4 bg-surface-100 rounded-lg border border-surface-200"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{slot.name}</p>
                        <p className="text-sm text-gray-400">
                          {slot.teamName} • {slot.record.wins}-{slot.record.losses}
                        </p>
                        <p className="text-xs text-gray-500">
                          Season {slot.season} • {slot.phase} • {SaveManager.formatTimestamp(slot.timestamp)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleExport(slot.id)}
                          className="p-2 hover:bg-surface-200 rounded-lg text-gray-400 hover:text-white transition-colors"
                          title="Export save"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(slot.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                          title="Delete save"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button
                          onClick={() => handleLoad(slot.id)}
                          className="px-4 py-2 bg-primary hover:bg-primary/80 text-black font-medium rounded-lg transition-colors flex items-center gap-2"
                        >
                          {loadSuccess ? (
                            <>
                              <Check size={16} />
                              Loaded!
                            </>
                          ) : (
                            <>
                              <FolderOpen size={16} />
                              Load
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Auto-save info */}
              {SaveManager.hasAutoSave() && (
                <div className="mt-4 p-3 bg-surface-100/50 rounded-lg border border-surface-200/50 border-dashed">
                  <p className="text-sm text-gray-400">
                    💡 Auto-save is enabled. Your game is automatically saved after each action.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-surface-200 bg-surface-100/50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-surface-200 hover:bg-surface-300 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
