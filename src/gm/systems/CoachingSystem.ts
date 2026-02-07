// ============================================
// Coaching System - Hire/Fire, Ratings, Contracts
// ============================================

import { Coach, Team, Player, LeagueState } from '../types';

export interface CoachContract {
  salary: number;
  years: number;
  signedYear: number;
  buyout: number; // Cost to fire before contract ends
}

export interface CoachRatings {
  // Core coaching skills (0-100)
  offense: number;
  defense: number;
  playerDevelopment: number;
  gameManagement: number;
  motivation: number;
  adaptability: number;
  recruiting: number; // Affects free agent interest
  
  // Reputation
  reputation: number; // 0-100, affects player morale and FA interest
  experienceYears: number;
  championships: number;
  careerWins: number;
  careerLosses: number;
}

export interface AssistantCoach {
  id: string;
  name: string;
  age: number;
  specialty: 'offense' | 'defense' | 'player-development' | 'analytics' | 'shooting';
  rating: number; // 0-100
  salary: number;
  yearsRemaining: number;
  potentialHeadCoach: boolean;
}

export interface CoachingStaff {
  headCoach: ExtendedCoach;
  assistants: AssistantCoach[];
  maxAssistants: number;
}

export interface ExtendedCoach extends Coach {
  ratings: CoachRatings;
  contract: CoachContract;
  preferredOffense: OffensiveSystem;
  preferredDefense: DefensiveScheme;
  preferredPace: PaceSetting;
  developmentFocus: DevelopmentPhilosophy;
  traits: CoachTrait[];
}

export type OffensiveSystem = 
  | 'motion'           // Ball movement, cutting, screens
  | 'iso-heavy'        // Star player isolation plays
  | 'pick-and-roll'    // PnR focused offense
  | 'pace-and-space'   // 3-point shooting, floor spacing
  | 'post-up'          // Inside-out, post plays
  | 'princeton'        // Backdoor cuts, misdirection
  | 'triangle'         // Triangle offense
  | 'balanced';        // Mix of everything

export type DefensiveScheme = 
  | 'man-to-man'       // Traditional man defense
  | 'zone-2-3'         // 2-3 zone
  | 'zone-3-2'         // 3-2 zone
  | 'zone-1-3-1'       // 1-3-1 zone
  | 'switch-everything' // Modern switching defense
  | 'drop-coverage'    // Big drops back in PnR
  | 'aggressive-blitz' // Trapping, full court pressure
  | 'pack-the-paint';  // Protect the rim, give up 3s

export type PaceSetting = 
  | 'fastest'      // 105+ possessions
  | 'fast'         // 100-105 possessions
  | 'moderate'     // 95-100 possessions
  | 'slow'         // 90-95 possessions
  | 'slowest';     // Under 90 possessions

export type DevelopmentPhilosophy = 
  | 'win-now'          // Play veterans, maximize current roster
  | 'balanced'         // Mix of development and winning
  | 'develop-youth'    // Prioritize young player minutes
  | 'rebuild';         // Full youth movement

export type CoachTrait = 
  | 'players-coach'        // Players love him, +morale
  | 'disciplinarian'       // Strict, -morale but +effort
  | 'offensive-genius'     // +15% offensive rating
  | 'defensive-mastermind' // +15% defensive rating
  | 'talent-whisperer'     // +25% player development
  | 'in-game-wizard'       // Better timeout/lineup decisions
  | 'recruiter'            // +20% free agent interest
  | 'analytics-driven'     // Better rotation optimization
  | 'old-school'           // Less 3-point shooting
  | 'hot-head'             // Gets technicals, fires up team
  | 'calm-demeanor'        // Steady under pressure
  | 'media-savvy';         // Better market value

// Coach name generation
const COACH_FIRST_NAMES = [
  'Steve', 'Erik', 'Gregg', 'Doc', 'Nick', 'Mike', 'Tom', 'Jason', 'Tyronn', 'Quin',
  'Billy', 'Monty', 'Taylor', 'Ime', 'Jamahl', 'Darvin', 'Wes', 'Chris', 'JB', 'Dwane',
  'Frank', 'Charles', 'Rick', 'Brad', 'Stan', 'Scott', 'Jeff', 'Terry', 'Kevin', 'Mark',
  'Larry', 'Phil', 'Pat', 'Jerry', 'Don', 'Red', 'Chuck', 'Lenny', 'Flip', 'George'
];

const COACH_LAST_NAMES = [
  'Kerr', 'Spoelstra', 'Popovich', 'Rivers', 'Nurse', 'Budenholzer', 'Thibodeau', 'Kidd',
  'Lue', 'Snyder', 'Donovan', 'Williams', 'Jenkins', 'Udoka', 'Mosley', 'Ham', 'Unseld',
  'Finch', 'Bickerstaff', 'Casey', 'Vogel', 'Lee', 'Carlisle', 'Stevens', 'Van Gundy',
  'Brooks', 'Stotts', 'Clifford', 'Silas', 'Brown', 'Jackson', 'Adelman', 'Sloan',
  'Riley', 'Auerbach', 'Daly', 'Wilkens', 'Nelson', 'Saunders', 'Karl', 'Malone'
];

function generateId(): string {
  return `coach-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateCoachRatings(tier: 'elite' | 'good' | 'average' | 'poor'): CoachRatings {
  const tierRanges = {
    elite: { min: 80, max: 99, repMin: 85, expMin: 10 },
    good: { min: 65, max: 85, repMin: 60, expMin: 5 },
    average: { min: 50, max: 70, repMin: 40, expMin: 2 },
    poor: { min: 35, max: 55, repMin: 20, expMin: 0 }
  };
  
  const range = tierRanges[tier];
  
  return {
    offense: randomBetween(range.min, range.max),
    defense: randomBetween(range.min, range.max),
    playerDevelopment: randomBetween(range.min, range.max),
    gameManagement: randomBetween(range.min, range.max),
    motivation: randomBetween(range.min, range.max),
    adaptability: randomBetween(range.min, range.max),
    recruiting: randomBetween(range.min, range.max),
    reputation: randomBetween(range.repMin, range.repMin + 20),
    experienceYears: randomBetween(range.expMin, range.expMin + 15),
    championships: tier === 'elite' ? randomBetween(0, 4) : (tier === 'good' ? randomBetween(0, 1) : 0),
    careerWins: randomBetween(range.expMin * 30, range.expMin * 50),
    careerLosses: randomBetween(range.expMin * 20, range.expMin * 40)
  };
}

export function generateCoachTraits(ratings: CoachRatings): CoachTrait[] {
  const traits: CoachTrait[] = [];
  const possibleTraits: CoachTrait[] = [
    'players-coach', 'disciplinarian', 'offensive-genius', 'defensive-mastermind',
    'talent-whisperer', 'in-game-wizard', 'recruiter', 'analytics-driven',
    'old-school', 'hot-head', 'calm-demeanor', 'media-savvy'
  ];
  
  // Add traits based on ratings
  if (ratings.offense >= 85) traits.push('offensive-genius');
  if (ratings.defense >= 85) traits.push('defensive-mastermind');
  if (ratings.playerDevelopment >= 85) traits.push('talent-whisperer');
  if (ratings.gameManagement >= 85) traits.push('in-game-wizard');
  if (ratings.recruiting >= 85) traits.push('recruiter');
  if (ratings.motivation >= 85) traits.push('players-coach');
  
  // Add 1-2 random traits
  const remainingTraits = possibleTraits.filter(t => !traits.includes(t));
  const numRandom = Math.min(2, remainingTraits.length);
  
  for (let i = 0; i < numRandom; i++) {
    const idx = Math.floor(Math.random() * remainingTraits.length);
    traits.push(remainingTraits.splice(idx, 1)[0]);
  }
  
  return traits;
}

export function generateCoach(tier: 'elite' | 'good' | 'average' | 'poor' = 'average'): ExtendedCoach {
  const firstName = pickRandom(COACH_FIRST_NAMES);
  const lastName = pickRandom(COACH_LAST_NAMES);
  const ratings = generateCoachRatings(tier);
  const traits = generateCoachTraits(ratings);
  
  const offenseSystems: OffensiveSystem[] = ['motion', 'iso-heavy', 'pick-and-roll', 'pace-and-space', 'post-up', 'balanced'];
  const defenseSchemes: DefensiveScheme[] = ['man-to-man', 'switch-everything', 'drop-coverage', 'aggressive-blitz', 'pack-the-paint'];
  const paceSettings: PaceSetting[] = ['fastest', 'fast', 'moderate', 'slow'];
  const devPhilosophies: DevelopmentPhilosophy[] = ['win-now', 'balanced', 'develop-youth'];
  
  // Calculate salary based on tier
  const salaryRanges = {
    elite: { min: 8000000, max: 15000000 },
    good: { min: 4000000, max: 9000000 },
    average: { min: 2000000, max: 5000000 },
    poor: { min: 1000000, max: 3000000 }
  };
  const salaryRange = salaryRanges[tier];
  
  const age = 40 + randomBetween(0, 30);
  
  return {
    id: generateId(),
    name: `${firstName} ${lastName}`,
    age,
    yearsExperience: ratings.experienceYears,
    style: ratings.offense > ratings.defense ? 'offensive' : (ratings.defense > ratings.offense ? 'defensive' : 'balanced'),
    playerDevelopment: ratings.playerDevelopment,
    gameManagement: ratings.gameManagement,
    motivation: ratings.motivation,
    offensiveScheme: pickRandom(['pace-and-space', 'motion', 'isolation', 'post-up', 'balanced']),
    defensiveScheme: pickRandom(['switch-everything', 'drop', 'aggressive', 'zone', 'balanced']),
    ratings,
    contract: {
      salary: randomBetween(salaryRange.min, salaryRange.max),
      years: randomBetween(2, 5),
      signedYear: new Date().getFullYear(),
      buyout: randomBetween(1000000, 5000000)
    },
    preferredOffense: pickRandom(offenseSystems),
    preferredDefense: pickRandom(defenseSchemes),
    preferredPace: pickRandom(paceSettings),
    developmentFocus: pickRandom(devPhilosophies),
    traits
  };
}

export function generateAssistantCoach(specialty?: AssistantCoach['specialty']): AssistantCoach {
  const firstName = pickRandom(COACH_FIRST_NAMES);
  const lastName = pickRandom(COACH_LAST_NAMES);
  const specialties: AssistantCoach['specialty'][] = ['offense', 'defense', 'player-development', 'analytics', 'shooting'];
  
  return {
    id: generateId(),
    name: `${firstName} ${lastName}`,
    age: 35 + randomBetween(0, 25),
    specialty: specialty || pickRandom(specialties),
    rating: randomBetween(50, 90),
    salary: randomBetween(500000, 2500000),
    yearsRemaining: randomBetween(1, 4),
    potentialHeadCoach: Math.random() > 0.7
  };
}

export function generateCoachingStaff(): CoachingStaff {
  const headCoach = generateCoach(Math.random() > 0.7 ? 'good' : 'average');
  const numAssistants = randomBetween(3, 5);
  const assistants: AssistantCoach[] = [];
  
  // Ensure at least one of each key specialty
  assistants.push(generateAssistantCoach('offense'));
  assistants.push(generateAssistantCoach('defense'));
  assistants.push(generateAssistantCoach('player-development'));
  
  // Fill remaining slots randomly
  for (let i = 3; i < numAssistants; i++) {
    assistants.push(generateAssistantCoach());
  }
  
  return {
    headCoach,
    assistants,
    maxAssistants: 6
  };
}

// Available coaches in the market
export function generateCoachMarket(count: number = 15): ExtendedCoach[] {
  const coaches: ExtendedCoach[] = [];
  
  // 2-3 elite coaches
  for (let i = 0; i < 2; i++) {
    coaches.push(generateCoach('elite'));
  }
  
  // 4-5 good coaches
  for (let i = 0; i < 4; i++) {
    coaches.push(generateCoach('good'));
  }
  
  // Rest are average/poor
  for (let i = coaches.length; i < count; i++) {
    coaches.push(generateCoach(Math.random() > 0.5 ? 'average' : 'poor'));
  }
  
  return coaches.sort((a, b) => {
    const aAvg = (a.ratings.offense + a.ratings.defense + a.ratings.playerDevelopment) / 3;
    const bAvg = (b.ratings.offense + b.ratings.defense + b.ratings.playerDevelopment) / 3;
    return bAvg - aAvg;
  });
}

export function calculateCoachImpact(
  coach: ExtendedCoach,
  assistants: AssistantCoach[],
  players: Player[]
): {
  offensiveBonus: number;
  defensiveBonus: number;
  developmentBonus: number;
  moraleBonus: number;
  faInterestBonus: number;
} {
  let offensiveBonus = 0;
  let defensiveBonus = 0;
  let developmentBonus = 0;
  let moraleBonus = 0;
  let faInterestBonus = 0;
  
  // Head coach impact
  offensiveBonus += (coach.ratings.offense - 50) / 10; // -5 to +5
  defensiveBonus += (coach.ratings.defense - 50) / 10;
  developmentBonus += (coach.ratings.playerDevelopment - 50) / 5; // -10 to +10
  moraleBonus += (coach.ratings.motivation - 50) / 10;
  faInterestBonus += (coach.ratings.recruiting - 50) / 10;
  faInterestBonus += (coach.ratings.reputation - 50) / 10;
  
  // Trait bonuses
  for (const trait of coach.traits) {
    switch (trait) {
      case 'offensive-genius':
        offensiveBonus += 3;
        break;
      case 'defensive-mastermind':
        defensiveBonus += 3;
        break;
      case 'talent-whisperer':
        developmentBonus += 5;
        break;
      case 'players-coach':
        moraleBonus += 4;
        break;
      case 'disciplinarian':
        moraleBonus -= 2;
        developmentBonus += 2;
        break;
      case 'recruiter':
        faInterestBonus += 4;
        break;
      case 'analytics-driven':
        offensiveBonus += 1;
        defensiveBonus += 1;
        break;
    }
  }
  
  // Assistant coach impact
  for (const assistant of assistants) {
    const bonus = (assistant.rating - 50) / 30; // Small bonus per assistant
    
    switch (assistant.specialty) {
      case 'offense':
        offensiveBonus += bonus;
        break;
      case 'defense':
        defensiveBonus += bonus;
        break;
      case 'player-development':
        developmentBonus += bonus * 2;
        break;
      case 'shooting':
        offensiveBonus += bonus * 0.5;
        break;
      case 'analytics':
        offensiveBonus += bonus * 0.3;
        defensiveBonus += bonus * 0.3;
        break;
    }
  }
  
  return {
    offensiveBonus: Math.round(offensiveBonus * 10) / 10,
    defensiveBonus: Math.round(defensiveBonus * 10) / 10,
    developmentBonus: Math.round(developmentBonus * 10) / 10,
    moraleBonus: Math.round(moraleBonus * 10) / 10,
    faInterestBonus: Math.round(faInterestBonus * 10) / 10
  };
}

export function hireCoach(
  team: Team,
  coach: ExtendedCoach,
  contract: CoachContract,
  state: LeagueState
): boolean {
  // Check if can afford
  if (contract.salary > team.budget * 0.1) {
    return false; // Coach salary shouldn't exceed 10% of budget
  }
  
  // Set as team's coach
  team.coach = coach;
  coach.contract = contract;
  
  return true;
}

export function fireCoach(team: Team, state: LeagueState): { success: boolean; buyoutCost: number } {
  const coach = team.coach as ExtendedCoach;
  if (!coach || !coach.contract) {
    return { success: false, buyoutCost: 0 };
  }
  
  const yearsRemaining = coach.contract.years - (state.currentSeason.year - coach.contract.signedYear);
  const buyoutCost = yearsRemaining > 0 ? coach.contract.buyout * yearsRemaining : 0;
  
  // Remove coach
  team.coach = generateCoach('poor'); // Interim coach
  
  return { success: true, buyoutCost };
}

export function evaluateCoachPerformance(
  coach: ExtendedCoach,
  team: Team,
  expectedWins: number
): {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  overperformed: boolean;
  winDifference: number;
  notes: string[];
} {
  const actualWins = team.wins;
  const winDiff = actualWins - expectedWins;
  const notes: string[] = [];
  
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  
  if (winDiff >= 10) {
    grade = 'A';
    notes.push('Significantly exceeded expectations');
  } else if (winDiff >= 5) {
    grade = 'B';
    notes.push('Exceeded expectations');
  } else if (winDiff >= -5) {
    grade = 'C';
    notes.push('Met expectations');
  } else if (winDiff >= -10) {
    grade = 'D';
    notes.push('Underperformed');
  } else {
    grade = 'F';
    notes.push('Significantly underperformed');
  }
  
  // Check playoff success
  if (team.wins >= 50) {
    notes.push('Led team to 50+ wins');
    if (grade === 'C') grade = 'B';
  }
  
  return {
    grade,
    overperformed: winDiff > 5,
    winDifference: winDiff,
    notes
  };
}
