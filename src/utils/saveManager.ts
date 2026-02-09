// Save Manager - Handles game save/load functionality with multiple slots
import { LeagueState } from '../gm/types'
import { GameSettings, DEFAULT_SETTINGS } from '../types/gameSettings'

export interface SaveSlot {
  id: number
  name: string
  timestamp: number
  teamId: string
  teamName: string
  season: number
  phase: string
  record: { wins: number; losses: number }
  gameMode: string
  settings: GameSettings
}

export interface SaveData {
  version: number
  slot: SaveSlot
  engineData: string  // Serialized engine state
  isRealDataMode: boolean
  settings: GameSettings
}

const SAVE_VERSION = 1
const STORAGE_KEY_PREFIX = 'basketball-gm-save-'
const SLOTS_INDEX_KEY = 'basketball-gm-save-slots'
const AUTO_SAVE_SLOT_ID = 0
const MAX_MANUAL_SLOTS = 5

export class SaveManager {
  // Get all save slots
  static getSaveSlots(): SaveSlot[] {
    try {
      const slotsJson = localStorage.getItem(SLOTS_INDEX_KEY)
      if (!slotsJson) return []
      return JSON.parse(slotsJson)
    } catch (e) {
      console.error('Failed to load save slots:', e)
      return []
    }
  }

  // Save slots index
  private static saveSlotsIndex(slots: SaveSlot[]): void {
    localStorage.setItem(SLOTS_INDEX_KEY, JSON.stringify(slots))
  }

  // Get next available slot ID
  static getNextSlotId(): number {
    const slots = this.getSaveSlots()
    const manualSlots = slots.filter(s => s.id !== AUTO_SAVE_SLOT_ID)
    if (manualSlots.length >= MAX_MANUAL_SLOTS) {
      return -1 // No slots available
    }
    
    // Find first unused slot (1-5)
    for (let i = 1; i <= MAX_MANUAL_SLOTS; i++) {
      if (!manualSlots.some(s => s.id === i)) {
        return i
      }
    }
    return -1
  }

  // Save game to a slot
  static saveGame(
    slotId: number,
    saveName: string,
    engineSave: string,
    state: LeagueState,
    isRealDataMode: boolean,
    settings: GameSettings
  ): boolean {
    try {
      const team = state.teams[state.userTeamId]
      
      const slot: SaveSlot = {
        id: slotId,
        name: saveName,
        timestamp: Date.now(),
        teamId: state.userTeamId,
        teamName: `${team.city} ${team.name}`,
        season: state.currentSeason.year,
        phase: state.currentSeason.phase,
        record: { wins: team.wins, losses: team.losses },
        gameMode: isRealDataMode ? 'real' : 'fiction',
        settings
      }

      const saveData: SaveData = {
        version: SAVE_VERSION,
        slot,
        engineData: engineSave,
        isRealDataMode,
        settings
      }

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY_PREFIX + slotId, JSON.stringify(saveData))

      // Update slots index
      const slots = this.getSaveSlots()
      const existingIndex = slots.findIndex(s => s.id === slotId)
      if (existingIndex >= 0) {
        slots[existingIndex] = slot
      } else {
        slots.push(slot)
      }
      this.saveSlotsIndex(slots)

      return true
    } catch (e) {
      console.error('Failed to save game:', e)
      return false
    }
  }

  // Auto-save (special slot 0)
  static autoSave(
    engineSave: string,
    state: LeagueState,
    isRealDataMode: boolean,
    settings: GameSettings
  ): boolean {
    return this.saveGame(
      AUTO_SAVE_SLOT_ID,
      'Auto-Save',
      engineSave,
      state,
      isRealDataMode,
      settings
    )
  }

  // Load game from a slot
  static loadGame(slotId: number): SaveData | null {
    try {
      const saveJson = localStorage.getItem(STORAGE_KEY_PREFIX + slotId)
      if (!saveJson) return null

      const saveData: SaveData = JSON.parse(saveJson)
      
      // Version migration if needed
      if (saveData.version !== SAVE_VERSION) {
        console.log('Migrating save from version', saveData.version, 'to', SAVE_VERSION)
        // Add migration logic here if needed
      }

      return saveData
    } catch (e) {
      console.error('Failed to load game:', e)
      return null
    }
  }

  // Delete a save slot
  static deleteSave(slotId: number): boolean {
    try {
      localStorage.removeItem(STORAGE_KEY_PREFIX + slotId)
      
      const slots = this.getSaveSlots()
      const filtered = slots.filter(s => s.id !== slotId)
      this.saveSlotsIndex(filtered)
      
      return true
    } catch (e) {
      console.error('Failed to delete save:', e)
      return false
    }
  }

  // Check if auto-save exists
  static hasAutoSave(): boolean {
    return localStorage.getItem(STORAGE_KEY_PREFIX + AUTO_SAVE_SLOT_ID) !== null
  }

  // Get save slot info without loading full data
  static getSlotInfo(slotId: number): SaveSlot | null {
    const slots = this.getSaveSlots()
    return slots.find(s => s.id === slotId) || null
  }

  // Format timestamp for display
  static formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - timestamp
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString()
  }

  // Clear all saves (for testing/debug)
  static clearAllSaves(): void {
    const slots = this.getSaveSlots()
    for (const slot of slots) {
      localStorage.removeItem(STORAGE_KEY_PREFIX + slot.id)
    }
    localStorage.removeItem(SLOTS_INDEX_KEY)
  }

  // Export save as downloadable JSON
  static exportSave(slotId: number): string | null {
    const saveData = this.loadGame(slotId)
    if (!saveData) return null
    return JSON.stringify(saveData, null, 2)
  }

  // Import save from JSON string
  static importSave(jsonString: string): { success: boolean; slotId?: number; error?: string } {
    try {
      const saveData: SaveData = JSON.parse(jsonString)
      
      if (!saveData.version || !saveData.engineData || !saveData.slot) {
        return { success: false, error: 'Invalid save format' }
      }

      // Find a new slot for imported save
      const newSlotId = this.getNextSlotId()
      if (newSlotId < 0) {
        return { success: false, error: 'No available save slots' }
      }

      // Update slot ID and save
      saveData.slot.id = newSlotId
      saveData.slot.name = `Imported: ${saveData.slot.name}`
      
      localStorage.setItem(STORAGE_KEY_PREFIX + newSlotId, JSON.stringify(saveData))
      
      const slots = this.getSaveSlots()
      slots.push(saveData.slot)
      this.saveSlotsIndex(slots)

      return { success: true, slotId: newSlotId }
    } catch (e) {
      return { success: false, error: 'Failed to parse save file' }
    }
  }
}
