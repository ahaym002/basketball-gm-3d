// Match Engine Types

export interface Position2D {
  x: number;
  y: number;
}

export interface Velocity2D {
  vx: number;
  vy: number;
}

export interface CourtPlayer {
  playerId: string;
  position: Position2D;
  velocity: Velocity2D;
  teamId: string;
  jerseyNumber: number;
  hasBall: boolean;
  fatigue: number; // 0-100, 100 = exhausted
  fouls: number;
  isHot: boolean; // On fire
  isCold: boolean; // Struggling
  stats: GamePlayerStats;
  // Physical attributes from player
  speed: number;
  strength: number;
  shooting: number;
  defense: number;
}

export interface Ball {
  position: Position2D;
  velocity: Velocity2D;
  height: number; // For shot animations
  holder: string | null; // playerId
  state: 'held' | 'passing' | 'shooting' | 'loose' | 'dead';
}

export interface GamePlayerStats {
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  fouls: number;
  plusMinus: number;
}

export interface TeamGameState {
  teamId: string;
  score: number;
  timeoutsRemaining: number;
  teamFouls: number;
  inBonus: boolean;
  possession: boolean;
  onCourt: string[]; // 5 player IDs
  bench: string[]; // Bench player IDs
  momentum: number; // -100 to 100
}

export interface GameClock {
  quarter: number;
  timeRemaining: number; // seconds in quarter
  shotClock: number; // 24 second shot clock
  isRunning: boolean;
}

export interface PlayByPlayEntry {
  id: string;
  quarter: number;
  time: number;
  teamId: string;
  playerId?: string;
  secondaryPlayerId?: string;
  action: PlayAction;
  description: string;
  homeScore: number;
  awayScore: number;
  isImportant: boolean;
}

export type PlayAction =
  | 'made_shot'
  | 'missed_shot'
  | 'made_three'
  | 'missed_three'
  | 'made_ft'
  | 'missed_ft'
  | 'offensive_rebound'
  | 'defensive_rebound'
  | 'assist'
  | 'steal'
  | 'block'
  | 'turnover'
  | 'foul'
  | 'timeout'
  | 'substitution'
  | 'quarter_start'
  | 'quarter_end'
  | 'game_start'
  | 'game_end'
  | 'jump_ball';

export interface MatchState {
  gameId: string;
  homeTeam: TeamGameState;
  awayTeam: TeamGameState;
  clock: GameClock;
  ball: Ball;
  players: Record<string, CourtPlayer>;
  playByPlay: PlayByPlayEntry[];
  simSpeed: SimSpeed;
  isPaused: boolean;
  isComplete: boolean;
  winner: string | null;
  
  // Tactics
  homeTactics: TeamTactics;
  awayTactics: TeamTactics;
}

export type SimSpeed = 'paused' | '1x' | '2x' | '4x' | '8x' | 'instant';

export interface TeamTactics {
  pace: 'push' | 'normal' | 'slow';
  offenseFocus: 'inside' | 'balanced' | 'perimeter';
  defenseScheme: 'man' | 'zone-23' | 'zone-32' | 'press';
  playCall: 'iso' | 'pnr' | 'motion' | 'postup' | 'auto';
}

export interface ShotAttempt {
  shooterId: string;
  position: Position2D;
  shotType: ShotType;
  distance: number;
  contested: boolean;
  contestLevel: number; // 0-1
  probability: number;
  made: boolean;
  points: number;
}

export type ShotType = 'layup' | 'dunk' | 'floater' | 'midrange' | 'three' | 'ft';

export interface PossessionResult {
  outcome: 'made' | 'missed' | 'turnover' | 'foul';
  points: number;
  shooter?: string;
  assister?: string;
  rebounder?: string;
  fouler?: string;
  shotType?: ShotType;
  playByPlay: PlayByPlayEntry[];
}

// Court constants (in feet, origin at center court)
export const COURT = {
  length: 94,
  width: 50,
  halfLength: 47,
  threePointRadius: 23.75,
  threePointCorner: 22,
  keyWidth: 16,
  keyLength: 19,
  freeThrowDistance: 15,
  restrictedAreaRadius: 4,
  basketX: 0,
  basketYHome: -41.75, // Home basket at bottom
  basketYAway: 41.75,  // Away basket at top
};

export const QUARTER_LENGTH = 720; // 12 minutes in seconds
export const SHOT_CLOCK = 24;
