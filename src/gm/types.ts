// ============================================
// Basketball GM 3D - Comprehensive Type Definitions
// ============================================

export interface PlayerStats {
  // Core attributes (0-99)
  speed: number;
  strength: number;
  jumping: number;
  endurance: number;
  
  // Offensive skills
  insideScoring: number;
  midRange: number;
  threePoint: number;
  freeThrow: number;
  ballHandling: number;
  passing: number;
  
  // Defensive skills
  perimeterDefense: number;
  interiorDefense: number;
  stealing: number;
  blocking: number;
  
  // Rebounding
  offensiveRebounding: number;
  defensiveRebounding: number;
  
  // IQ & Intangibles
  basketballIQ: number;
  workEthic: number;
  durability: number;
  clutch: number;
  
  // Computed
  overall: number;
}

export interface SeasonStats {
  gamesPlayed: number;
  gamesStarted: number;
  minutesPerGame: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  personalFouls: number;
  plusMinus: number;
}

export interface BoxScoreStats {
  playerId: string;
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

export type ContractType = 
  | 'standard'
  | 'max'
  | 'supermax'
  | 'rookie'
  | 'minimum'
  | 'mid-level'
  | 'bi-annual'
  | 'ten-day'
  | 'two-way';

export interface Contract {
  salary: number;
  years: number;
  type: ContractType;
  noTradeClause: boolean;
  playerOption?: number;  // Year player option kicks in
  teamOption?: number;    // Year team option kicks in
  tradeBonusPercent?: number;
  signedYear: number;
}

export interface Injury {
  type: string;
  severity: 'minor' | 'moderate' | 'severe' | 'career-threatening';
  gamesRemaining: number;
  recoveryProgress: number; // 0-100
}

export interface PlayerMorale {
  happiness: number;  // 0-100
  loyalty: number;    // 0-100
  chemistry: number;  // 0-100
  tradeDesire: number; // 0-100 (100 = desperately wants trade)
  factors: {
    playingTime: number;
    teamSuccess: number;
    cityPreference: number;
    coaching: number;
    teammates: number;
  };
}

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C';
  secondaryPosition?: 'PG' | 'SG' | 'SF' | 'PF' | 'C';
  height: number; // inches
  weight: number; // pounds
  age: number;
  birthYear: number;
  yearsExperience: number;
  college?: string;
  draftYear?: number;
  draftRound?: number;
  draftPick?: number;
  
  // Ratings
  stats: PlayerStats;
  potential: number; // Peak potential (0-99)
  peakAge: number;   // Age they'll reach peak
  
  // Contract & Status
  teamId: string | null;
  contract: Contract;
  birdRights: boolean;
  
  // Health & Attitude
  injury: Injury | null;
  morale: PlayerMorale;
  
  // Season tracking
  seasonStats: Record<number, SeasonStats>; // year -> stats
  careerStats: SeasonStats;
  
  // Awards
  awards: PlayerAward[];
  allStarSelections: number;
}

export interface PlayerAward {
  year: number;
  type: 'MVP' | 'DPOY' | 'ROY' | 'SMOY' | 'MIP' | 'FMVP' | 
        'All-NBA-1st' | 'All-NBA-2nd' | 'All-NBA-3rd' |
        'All-Defensive-1st' | 'All-Defensive-2nd' | 'All-Star';
}

export interface DraftProspect extends Omit<Player, 'teamId' | 'contract' | 'birdRights' | 'seasonStats' | 'careerStats' | 'awards' | 'allStarSelections'> {
  scoutingReports: ScoutingReport[];
  projectedPick: number;
  trueOverall: number; // Hidden until drafted
  truePotential: number; // Hidden until drafted
  comparisonPlayer?: string;
}

export interface ScoutingReport {
  scoutId: string;
  overallGrade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';
  strengths: string[];
  weaknesses: string[];
  projectedRole: 'Star' | 'Starter' | 'Rotation' | 'Deep Bench' | 'Bust';
  notes: string;
}

export interface DraftPick {
  year: number;
  round: 1 | 2;
  originalTeamId: string;
  currentTeamId: string;
  isSwap: boolean;
  protections?: DraftProtection[];
  conveyedTo?: string; // Team it conveyed to after protections lifted
}

export interface DraftProtection {
  type: 'top' | 'lottery' | 'range';
  value?: number;  // For top-X protection
  rangeStart?: number; // For range protection
  rangeEnd?: number;
  throughYear: number;
}

export interface Trade {
  id: string;
  date: Date;
  teams: string[]; // Team IDs involved
  assets: TradeAsset[];
  status: 'proposed' | 'pending' | 'accepted' | 'rejected' | 'completed';
  tradeValue: Record<string, number>; // Team ID -> value received
}

export interface TradeAsset {
  type: 'player' | 'pick' | 'cash';
  fromTeamId: string;
  toTeamId: string;
  playerId?: string;
  pick?: DraftPick;
  cashAmount?: number;
}

export interface Team {
  id: string;
  name: string;
  city: string;
  abbreviation: string;
  conference: 'Eastern' | 'Western';
  division: string;
  colors: { primary: string; secondary: string; accent: string };
  arena: string;
  coach: Coach;
  
  // Roster
  roster: string[]; // Player IDs
  
  // Finances
  salaryCap: number;
  taxLine: number;
  budget: number;
  payroll: number;
  ownerWealth: 'cheap' | 'moderate' | 'willing' | 'luxury';
  
  // Cap Exceptions
  exceptions: CapException[];
  
  // Draft assets
  draftPicks: DraftPick[];
  
  // Season
  wins: number;
  losses: number;
  streak: number; // positive = win streak, negative = loss streak
  lastTenGames: ('W' | 'L')[];
  
  // History
  championships: number[];
  retiredNumbers: { number: number; playerName: string }[];
  
  // Strategy & Coaching (extended data)
  strategy?: TeamStrategyData;
}

export interface CapException {
  type: 'mid-level' | 'bi-annual' | 'trade' | 'disabled-player' | 'room';
  amount: number;
  remaining: number;
  expiresYear: number;
}

export interface Coach {
  id: string;
  name: string;
  age: number;
  yearsExperience: number;
  style: 'offensive' | 'defensive' | 'balanced';
  playerDevelopment: number; // 0-100
  gameManagement: number;    // 0-100
  motivation: number;        // 0-100
  offensiveScheme: 'pace-and-space' | 'motion' | 'isolation' | 'post-up' | 'balanced';
  defensiveScheme: 'switch-everything' | 'drop' | 'aggressive' | 'zone' | 'balanced';
}

// Extended Team with Strategy/Coaching - imported from strategy systems
export interface TeamStrategyData {
  philosophy?: import('./systems/TeamStrategy').TeamPhilosophy;
  rotation?: import('./systems/TeamStrategy').RotationSettings;
  playbook?: import('./systems/TeamStrategy').Playbook;
  identity?: import('./systems/TeamStrategy').TeamIdentity;
  coachingStaff?: import('./systems/CoachingSystem').CoachingStaff;
}

export interface Game {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  date: GameDate;
  played: boolean;
  homeScore?: number;
  awayScore?: number;
  overtime?: number;
  boxScore?: {
    home: BoxScoreStats[];
    away: BoxScoreStats[];
  };
  playByPlay?: PlayByPlayEvent[];
  isPlayoff?: boolean;
  playoffRound?: number;
  playoffGameNumber?: number;
}

export interface GameDate {
  year: number;
  month: number;
  day: number;
}

export interface PlayByPlayEvent {
  quarter: number;
  timeRemaining: number; // seconds
  team: string;
  player?: string;
  action: string;
  score: { home: number; away: number };
}

export interface Season {
  year: number;
  phase: 'preseason' | 'regular' | 'playoffs' | 'offseason' | 'draft' | 'free-agency';
  week: number;
  day: number;
  
  // Schedule
  schedule: Game[];
  
  // Playoffs
  playoffs?: PlayoffBracket;
  
  // Draft
  draftClass?: DraftProspect[];
  draftOrder?: string[]; // Team IDs in pick order
  draftResults?: { pick: number; round: number; teamId: string; playerId: string }[];
  
  // Awards voting
  awardVotes?: Record<string, Record<string, number>>; // award -> playerId -> votes
}

export interface PlayoffBracket {
  rounds: PlayoffRound[];
  champion?: string;
}

export interface PlayoffRound {
  round: number;
  name: string; // "First Round", "Conference Semis", etc.
  matchups: PlayoffMatchup[];
}

export interface PlayoffMatchup {
  higherSeed: string;
  lowerSeed: string;
  higherSeedWins: number;
  lowerSeedWins: number;
  games: string[]; // Game IDs
  winner?: string;
}

export interface LeagueSettings {
  salaryCap: number;
  luxuryTax: number;
  apron: number;
  minimumSalary: number;
  maximumSalary: number;
  midLevelException: number;
  biAnnualException: number;
  rookieScale: Record<number, number>; // Pick -> salary
  
  numPlayoffTeams: number;
  playoffFormat: '7-game' | '5-game' | 'single-elimination';
  
  draftRounds: number;
  draftLotteryTeams: number;
}

export interface LeagueState {
  settings: LeagueSettings;
  teams: Record<string, Team>;
  players: Record<string, Player>;
  freeAgents: string[]; // Player IDs
  currentSeason: Season;
  seasonHistory: Season[];
  tradeHistory: Trade[];
  
  // User's team
  userTeamId: string;
  
  // League-wide records
  records: {
    singleGamePoints: { value: number; player: string; year: number };
    seasonPoints: { value: number; player: string; year: number };
    careerPoints: { value: number; player: string };
    longestWinStreak: { value: number; team: string; year: number };
    bestRecord: { wins: number; losses: number; team: string; year: number };
  };
}

export type GMTab = 
  | 'dashboard'
  | 'roster'
  | 'coaching'
  | 'strategy'
  | 'freeAgency'
  | 'trade'
  | 'draft'
  | 'standings'
  | 'schedule'
  | 'finances'
  | 'playoffs'
  | 'awards'
  | 'history'
  | 'expansion';
