// ============================================
// Fiction Teams - Generated Team Names for Fiction Mode
// Uses same structure as NBA teams but with fictional names
// ============================================

import { Team, Coach } from '../types';
import { NBA_TEAMS, generateCoach, createTeamFromTemplate } from './teams';

// For now, fiction mode uses the same NBA teams
// In the future, this could be expanded to generate random city/team name combos
export const FICTION_TEAMS = NBA_TEAMS;

export function initializeFictionTeams(): Record<string, Team> {
  const teams: Record<string, Team> = {};
  
  for (const template of FICTION_TEAMS) {
    teams[template.id] = createTeamFromTemplate(template);
  }
  
  return teams;
}

// Fake name generator for fiction mode players
const FIRST_NAMES = [
  'James', 'Michael', 'Marcus', 'Jaylen', 'Anthony', 'DeAndre', 'Kevin', 'Chris',
  'Damian', 'Kyrie', 'Stephen', 'LeBron', 'Zion', 'Luka', 'Giannis', 'Joel',
  'Nikola', 'Jayson', 'Trae', 'Donovan', 'Ja', 'Tyrese', 'Devin', 'Tyler',
  'Brandon', 'Darius', 'Miles', 'Cole', 'Jalen', 'Cameron', 'Isaiah', 'Terry'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore',
  'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson',
  'Robinson', 'Clark', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young',
  'King', 'Wright', 'Lopez', 'Green', 'Adams', 'Baker', 'Nelson', 'Carter'
];

export function generateFakePlayerName(): { firstName: string; lastName: string } {
  return {
    firstName: FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)],
    lastName: LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
  };
}
