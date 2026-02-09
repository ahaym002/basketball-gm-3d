// Game Settings Types

export type GameMode = 'real' | 'fiction'
export type Difficulty = 'easy' | 'normal' | 'hard' | 'extreme'
export type SeasonLength = 'full' | 'half' | 'short'
export type TradeDifficulty = 'easy' | 'normal' | 'hard'
export type DraftQuality = 'random' | 'strong' | 'weak'

export interface GameSettings {
  // Core settings
  gameMode: GameMode
  difficulty: Difficulty
  seasonLength: SeasonLength
  
  // Optional features
  salaryCap: boolean
  injuries: boolean
  
  // AI settings
  tradeDifficulty: TradeDifficulty
  draftQuality: DraftQuality
}

export const DEFAULT_SETTINGS: GameSettings = {
  gameMode: 'fiction',
  difficulty: 'normal',
  seasonLength: 'full',
  salaryCap: true,
  injuries: true,
  tradeDifficulty: 'normal',
  draftQuality: 'random'
}

// Season length mappings
export const SEASON_GAMES: Record<SeasonLength, number> = {
  full: 82,
  half: 41,
  short: 20
}
