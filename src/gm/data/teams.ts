// ============================================
// All 30 NBA Teams with Real Structure
// ============================================

import { Team, Coach } from '../types';

interface TeamTemplate {
  id: string;
  name: string;
  city: string;
  abbreviation: string;
  conference: 'Eastern' | 'Western';
  division: string;
  colors: { primary: string; secondary: string; accent: string };
  arena: string;
  ownerWealth: 'cheap' | 'moderate' | 'willing' | 'luxury';
  championships: number[];
  retiredNumbers: { number: number; playerName: string }[];
}

export const NBA_TEAMS: TeamTemplate[] = [
  // EASTERN CONFERENCE
  // Atlantic Division
  {
    id: 'BOS',
    name: 'Celtics',
    city: 'Boston',
    abbreviation: 'BOS',
    conference: 'Eastern',
    division: 'Atlantic',
    colors: { primary: '#007A33', secondary: '#FFFFFF', accent: '#BA9653' },
    arena: 'TD Garden',
    ownerWealth: 'willing',
    championships: [1957, 1959, 1960, 1961, 1962, 1963, 1964, 1965, 1966, 1968, 1969, 1974, 1976, 1981, 1984, 1986, 2008, 2024],
    retiredNumbers: [
      { number: 1, playerName: 'Walter Brown' },
      { number: 6, playerName: 'Bill Russell' },
      { number: 33, playerName: 'Larry Bird' },
      { number: 34, playerName: 'Paul Pierce' }
    ]
  },
  {
    id: 'BKN',
    name: 'Nets',
    city: 'Brooklyn',
    abbreviation: 'BKN',
    conference: 'Eastern',
    division: 'Atlantic',
    colors: { primary: '#000000', secondary: '#FFFFFF', accent: '#707271' },
    arena: 'Barclays Center',
    ownerWealth: 'luxury',
    championships: [],
    retiredNumbers: [
      { number: 3, playerName: 'Drazen Petrovic' },
      { number: 32, playerName: 'Julius Erving' }
    ]
  },
  {
    id: 'NYK',
    name: 'Knicks',
    city: 'New York',
    abbreviation: 'NYK',
    conference: 'Eastern',
    division: 'Atlantic',
    colors: { primary: '#006BB6', secondary: '#F58426', accent: '#FFFFFF' },
    arena: 'Madison Square Garden',
    ownerWealth: 'luxury',
    championships: [1970, 1973],
    retiredNumbers: [
      { number: 10, playerName: 'Walt Frazier' },
      { number: 33, playerName: 'Patrick Ewing' }
    ]
  },
  {
    id: 'PHI',
    name: '76ers',
    city: 'Philadelphia',
    abbreviation: 'PHI',
    conference: 'Eastern',
    division: 'Atlantic',
    colors: { primary: '#006BB6', secondary: '#ED174C', accent: '#FFFFFF' },
    arena: 'Wells Fargo Center',
    ownerWealth: 'willing',
    championships: [1955, 1967, 1983],
    retiredNumbers: [
      { number: 3, playerName: 'Allen Iverson' },
      { number: 6, playerName: 'Julius Erving' },
      { number: 13, playerName: 'Wilt Chamberlain' }
    ]
  },
  {
    id: 'TOR',
    name: 'Raptors',
    city: 'Toronto',
    abbreviation: 'TOR',
    conference: 'Eastern',
    division: 'Atlantic',
    colors: { primary: '#CE1141', secondary: '#000000', accent: '#A1A1A4' },
    arena: 'Scotiabank Arena',
    ownerWealth: 'moderate',
    championships: [2019],
    retiredNumbers: [
      { number: 10, playerName: 'DeMar DeRozan' },
      { number: 15, playerName: 'Vince Carter' }
    ]
  },
  
  // Central Division
  {
    id: 'CHI',
    name: 'Bulls',
    city: 'Chicago',
    abbreviation: 'CHI',
    conference: 'Eastern',
    division: 'Central',
    colors: { primary: '#CE1141', secondary: '#000000', accent: '#FFFFFF' },
    arena: 'United Center',
    ownerWealth: 'moderate',
    championships: [1991, 1992, 1993, 1996, 1997, 1998],
    retiredNumbers: [
      { number: 23, playerName: 'Michael Jordan' },
      { number: 33, playerName: 'Scottie Pippen' }
    ]
  },
  {
    id: 'CLE',
    name: 'Cavaliers',
    city: 'Cleveland',
    abbreviation: 'CLE',
    conference: 'Eastern',
    division: 'Central',
    colors: { primary: '#860038', secondary: '#041E42', accent: '#FDBB30' },
    arena: 'Rocket Mortgage FieldHouse',
    ownerWealth: 'willing',
    championships: [2016],
    retiredNumbers: [
      { number: 25, playerName: 'Mark Price' },
      { number: 34, playerName: 'Austin Carr' }
    ]
  },
  {
    id: 'DET',
    name: 'Pistons',
    city: 'Detroit',
    abbreviation: 'DET',
    conference: 'Eastern',
    division: 'Central',
    colors: { primary: '#C8102E', secondary: '#1D42BA', accent: '#FFFFFF' },
    arena: 'Little Caesars Arena',
    ownerWealth: 'moderate',
    championships: [1989, 1990, 2004],
    retiredNumbers: [
      { number: 3, playerName: 'Ben Wallace' },
      { number: 11, playerName: 'Isiah Thomas' }
    ]
  },
  {
    id: 'IND',
    name: 'Pacers',
    city: 'Indiana',
    abbreviation: 'IND',
    conference: 'Eastern',
    division: 'Central',
    colors: { primary: '#002D62', secondary: '#FDBB30', accent: '#FFFFFF' },
    arena: 'Gainbridge Fieldhouse',
    ownerWealth: 'cheap',
    championships: [],
    retiredNumbers: [
      { number: 31, playerName: 'Reggie Miller' },
      { number: 35, playerName: 'Roger Brown' }
    ]
  },
  {
    id: 'MIL',
    name: 'Bucks',
    city: 'Milwaukee',
    abbreviation: 'MIL',
    conference: 'Eastern',
    division: 'Central',
    colors: { primary: '#00471B', secondary: '#EEE1C6', accent: '#0077C0' },
    arena: 'Fiserv Forum',
    ownerWealth: 'willing',
    championships: [1971, 2021],
    retiredNumbers: [
      { number: 1, playerName: 'Oscar Robertson' },
      { number: 33, playerName: 'Kareem Abdul-Jabbar' }
    ]
  },
  
  // Southeast Division
  {
    id: 'ATL',
    name: 'Hawks',
    city: 'Atlanta',
    abbreviation: 'ATL',
    conference: 'Eastern',
    division: 'Southeast',
    colors: { primary: '#E03A3E', secondary: '#C1D32F', accent: '#26282A' },
    arena: 'State Farm Arena',
    ownerWealth: 'moderate',
    championships: [1958],
    retiredNumbers: [
      { number: 21, playerName: 'Dominique Wilkins' },
      { number: 23, playerName: 'Lou Hudson' }
    ]
  },
  {
    id: 'CHA',
    name: 'Hornets',
    city: 'Charlotte',
    abbreviation: 'CHA',
    conference: 'Eastern',
    division: 'Southeast',
    colors: { primary: '#1D1160', secondary: '#00788C', accent: '#A1A1A4' },
    arena: 'Spectrum Center',
    ownerWealth: 'moderate',
    championships: [],
    retiredNumbers: [
      { number: 13, playerName: 'Bobby Phills' }
    ]
  },
  {
    id: 'MIA',
    name: 'Heat',
    city: 'Miami',
    abbreviation: 'MIA',
    conference: 'Eastern',
    division: 'Southeast',
    colors: { primary: '#98002E', secondary: '#000000', accent: '#F9A01B' },
    arena: 'Kaseya Center',
    ownerWealth: 'willing',
    championships: [2006, 2012, 2013],
    retiredNumbers: [
      { number: 1, playerName: 'Chris Bosh' },
      { number: 3, playerName: 'Dwyane Wade' },
      { number: 23, playerName: 'Michael Jordan' }
    ]
  },
  {
    id: 'ORL',
    name: 'Magic',
    city: 'Orlando',
    abbreviation: 'ORL',
    conference: 'Eastern',
    division: 'Southeast',
    colors: { primary: '#0077C0', secondary: '#C4CED4', accent: '#000000' },
    arena: 'Kia Center',
    ownerWealth: 'moderate',
    championships: [],
    retiredNumbers: [
      { number: 6, playerName: 'Bill Russell' }
    ]
  },
  {
    id: 'WAS',
    name: 'Wizards',
    city: 'Washington',
    abbreviation: 'WAS',
    conference: 'Eastern',
    division: 'Southeast',
    colors: { primary: '#002B5C', secondary: '#E31837', accent: '#C4CED4' },
    arena: 'Capital One Arena',
    ownerWealth: 'cheap',
    championships: [1978],
    retiredNumbers: [
      { number: 11, playerName: 'Elvin Hayes' },
      { number: 41, playerName: 'Wes Unseld' }
    ]
  },
  
  // WESTERN CONFERENCE
  // Northwest Division
  {
    id: 'DEN',
    name: 'Nuggets',
    city: 'Denver',
    abbreviation: 'DEN',
    conference: 'Western',
    division: 'Northwest',
    colors: { primary: '#0E2240', secondary: '#FEC524', accent: '#8B2131' },
    arena: 'Ball Arena',
    ownerWealth: 'willing',
    championships: [2023],
    retiredNumbers: [
      { number: 2, playerName: 'Alex English' },
      { number: 33, playerName: 'David Thompson' }
    ]
  },
  {
    id: 'MIN',
    name: 'Timberwolves',
    city: 'Minnesota',
    abbreviation: 'MIN',
    conference: 'Western',
    division: 'Northwest',
    colors: { primary: '#0C2340', secondary: '#236192', accent: '#78BE20' },
    arena: 'Target Center',
    ownerWealth: 'moderate',
    championships: [],
    retiredNumbers: [
      { number: 2, playerName: 'Malik Sealy' }
    ]
  },
  {
    id: 'OKC',
    name: 'Thunder',
    city: 'Oklahoma City',
    abbreviation: 'OKC',
    conference: 'Western',
    division: 'Northwest',
    colors: { primary: '#007AC1', secondary: '#EF3B24', accent: '#002D62' },
    arena: 'Paycom Center',
    ownerWealth: 'moderate',
    championships: [1979],
    retiredNumbers: []
  },
  {
    id: 'POR',
    name: 'Trail Blazers',
    city: 'Portland',
    abbreviation: 'POR',
    conference: 'Western',
    division: 'Northwest',
    colors: { primary: '#E03A3E', secondary: '#000000', accent: '#FFFFFF' },
    arena: 'Moda Center',
    ownerWealth: 'willing',
    championships: [1977],
    retiredNumbers: [
      { number: 22, playerName: 'Clyde Drexler' },
      { number: 30, playerName: 'Terry Porter' }
    ]
  },
  {
    id: 'UTA',
    name: 'Jazz',
    city: 'Utah',
    abbreviation: 'UTA',
    conference: 'Western',
    division: 'Northwest',
    colors: { primary: '#002B5C', secondary: '#F9A01B', accent: '#00471B' },
    arena: 'Delta Center',
    ownerWealth: 'moderate',
    championships: [],
    retiredNumbers: [
      { number: 12, playerName: 'John Stockton' },
      { number: 32, playerName: 'Karl Malone' }
    ]
  },
  
  // Pacific Division
  {
    id: 'GSW',
    name: 'Warriors',
    city: 'Golden State',
    abbreviation: 'GSW',
    conference: 'Western',
    division: 'Pacific',
    colors: { primary: '#1D428A', secondary: '#FFC72C', accent: '#FFFFFF' },
    arena: 'Chase Center',
    ownerWealth: 'luxury',
    championships: [1947, 1956, 1975, 2015, 2017, 2018, 2022],
    retiredNumbers: [
      { number: 13, playerName: 'Wilt Chamberlain' },
      { number: 17, playerName: 'Chris Mullin' }
    ]
  },
  {
    id: 'LAC',
    name: 'Clippers',
    city: 'Los Angeles',
    abbreviation: 'LAC',
    conference: 'Western',
    division: 'Pacific',
    colors: { primary: '#C8102E', secondary: '#1D428A', accent: '#FFFFFF' },
    arena: 'Intuit Dome',
    ownerWealth: 'luxury',
    championships: [],
    retiredNumbers: []
  },
  {
    id: 'LAL',
    name: 'Lakers',
    city: 'Los Angeles',
    abbreviation: 'LAL',
    conference: 'Western',
    division: 'Pacific',
    colors: { primary: '#552583', secondary: '#FDB927', accent: '#000000' },
    arena: 'Crypto.com Arena',
    ownerWealth: 'willing',
    championships: [1949, 1950, 1952, 1953, 1954, 1972, 1980, 1982, 1985, 1987, 1988, 2000, 2001, 2002, 2009, 2010, 2020],
    retiredNumbers: [
      { number: 8, playerName: 'Kobe Bryant' },
      { number: 24, playerName: 'Kobe Bryant' },
      { number: 32, playerName: 'Magic Johnson' },
      { number: 33, playerName: 'Kareem Abdul-Jabbar' },
      { number: 34, playerName: 'Shaquille O\'Neal' }
    ]
  },
  {
    id: 'PHX',
    name: 'Suns',
    city: 'Phoenix',
    abbreviation: 'PHX',
    conference: 'Western',
    division: 'Pacific',
    colors: { primary: '#1D1160', secondary: '#E56020', accent: '#000000' },
    arena: 'Footprint Center',
    ownerWealth: 'luxury',
    championships: [],
    retiredNumbers: [
      { number: 7, playerName: 'Kevin Johnson' },
      { number: 13, playerName: 'Steve Nash' }
    ]
  },
  {
    id: 'SAC',
    name: 'Kings',
    city: 'Sacramento',
    abbreviation: 'SAC',
    conference: 'Western',
    division: 'Pacific',
    colors: { primary: '#5A2D81', secondary: '#63727A', accent: '#000000' },
    arena: 'Golden 1 Center',
    ownerWealth: 'moderate',
    championships: [1951],
    retiredNumbers: [
      { number: 4, playerName: 'Chris Webber' },
      { number: 16, playerName: 'Peja Stojakovic' }
    ]
  },
  
  // Southwest Division
  {
    id: 'DAL',
    name: 'Mavericks',
    city: 'Dallas',
    abbreviation: 'DAL',
    conference: 'Western',
    division: 'Southwest',
    colors: { primary: '#00538C', secondary: '#002B5E', accent: '#B8C4CA' },
    arena: 'American Airlines Center',
    ownerWealth: 'luxury',
    championships: [2011],
    retiredNumbers: [
      { number: 12, playerName: 'Derek Harper' },
      { number: 41, playerName: 'Dirk Nowitzki' }
    ]
  },
  {
    id: 'HOU',
    name: 'Rockets',
    city: 'Houston',
    abbreviation: 'HOU',
    conference: 'Western',
    division: 'Southwest',
    colors: { primary: '#CE1141', secondary: '#000000', accent: '#C4CED4' },
    arena: 'Toyota Center',
    ownerWealth: 'willing',
    championships: [1994, 1995],
    retiredNumbers: [
      { number: 11, playerName: 'Yao Ming' },
      { number: 22, playerName: 'Clyde Drexler' },
      { number: 34, playerName: 'Hakeem Olajuwon' }
    ]
  },
  {
    id: 'MEM',
    name: 'Grizzlies',
    city: 'Memphis',
    abbreviation: 'MEM',
    conference: 'Western',
    division: 'Southwest',
    colors: { primary: '#5D76A9', secondary: '#12173F', accent: '#F5B112' },
    arena: 'FedExForum',
    ownerWealth: 'moderate',
    championships: [],
    retiredNumbers: [
      { number: 33, playerName: 'Marc Gasol' },
      { number: 50, playerName: 'Zach Randolph' }
    ]
  },
  {
    id: 'NOP',
    name: 'Pelicans',
    city: 'New Orleans',
    abbreviation: 'NOP',
    conference: 'Western',
    division: 'Southwest',
    colors: { primary: '#0C2340', secondary: '#C8102E', accent: '#85714D' },
    arena: 'Smoothie King Center',
    ownerWealth: 'moderate',
    championships: [],
    retiredNumbers: []
  },
  {
    id: 'SAS',
    name: 'Spurs',
    city: 'San Antonio',
    abbreviation: 'SAS',
    conference: 'Western',
    division: 'Southwest',
    colors: { primary: '#C4CED4', secondary: '#000000', accent: '#FFFFFF' },
    arena: 'Frost Bank Center',
    ownerWealth: 'cheap',
    championships: [1999, 2003, 2005, 2007, 2014],
    retiredNumbers: [
      { number: 12, playerName: 'Bruce Bowen' },
      { number: 21, playerName: 'Tim Duncan' },
      { number: 44, playerName: 'George Gervin' }
    ]
  }
];

export function generateCoach(): Coach {
  const firstNames = ['Steve', 'Erik', 'Gregg', 'Doc', 'Nick', 'Mike', 'Tom', 'Jason', 'JB', 'Quin'];
  const lastNames = ['Kerr', 'Spoelstra', 'Popovich', 'Rivers', 'Nurse', 'Malone', 'Thibodeau', 'Kidd', 'Bickerstaff', 'Snyder'];
  const styles: Coach['style'][] = ['offensive', 'defensive', 'balanced'];
  const offSchemes: Coach['offensiveScheme'][] = ['pace-and-space', 'motion', 'isolation', 'post-up', 'balanced'];
  const defSchemes: Coach['defensiveScheme'][] = ['switch-everything', 'drop', 'aggressive', 'zone', 'balanced'];
  
  return {
    id: `coach-${Math.random().toString(36).substr(2, 9)}`,
    name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
    age: 40 + Math.floor(Math.random() * 25),
    yearsExperience: 1 + Math.floor(Math.random() * 20),
    style: styles[Math.floor(Math.random() * styles.length)],
    playerDevelopment: 50 + Math.floor(Math.random() * 50),
    gameManagement: 50 + Math.floor(Math.random() * 50),
    motivation: 50 + Math.floor(Math.random() * 50),
    offensiveScheme: offSchemes[Math.floor(Math.random() * offSchemes.length)],
    defensiveScheme: defSchemes[Math.floor(Math.random() * defSchemes.length)]
  };
}

export function createTeamFromTemplate(template: TeamTemplate, budget: number = 150000000): Team {
  const coach = generateCoach();
  
  return {
    ...template,
    coach,
    roster: [],
    salaryCap: 136000000,
    taxLine: 165000000,
    budget,
    payroll: 0,
    exceptions: [
      { type: 'mid-level', amount: 12800000, remaining: 12800000, expiresYear: 2025 },
      { type: 'bi-annual', amount: 4500000, remaining: 4500000, expiresYear: 2025 }
    ],
    draftPicks: [],
    wins: 0,
    losses: 0,
    streak: 0,
    lastTenGames: []
  };
}

export function initializeAllTeams(): Record<string, Team> {
  const teams: Record<string, Team> = {};
  
  for (const template of NBA_TEAMS) {
    teams[template.id] = createTeamFromTemplate(template);
  }
  
  return teams;
}
