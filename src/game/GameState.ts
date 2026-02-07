export interface TeamData {
  name: string;
  abbreviation: string;
  color: string;
  score: number;
}

export interface PlayerData {
  id: string;
  name: string;
  position: string;
  age: number;
  stats: {
    speed: number;
    shooting: number;
    defense: number;
    passing: number;
    rebounding: number;
    overall: number;
  };
  contract: {
    salary: number;
    years: number;
  };
  injured: boolean;
  potential: number;
}

export interface SeasonData {
  year: number;
  week: number;
  standings: { team: string; wins: number; losses: number }[];
  schedule: { home: string; away: string; played: boolean; homeScore?: number; awayScore?: number }[];
}

export class GameState {
  public homeTeam: TeamData;
  public awayTeam: TeamData;
  public quarter: number = 1;
  public timeRemaining: number = 12 * 60; // 12 minutes in seconds
  public roster: PlayerData[] = [];
  public season: SeasonData;
  public salaryCap: number = 136000000; // NBA salary cap ~$136M
  public budget: number = 150000000;
  public freeAgents: PlayerData[] = [];
  
  private onScoreCallback: (() => void) | null = null;

  constructor() {
    this.homeTeam = {
      name: 'Your Team',
      abbreviation: 'YOU',
      color: '#3498db',
      score: 0,
    };

    this.awayTeam = {
      name: 'Opponents',
      abbreviation: 'OPP',
      color: '#e74c3c',
      score: 0,
    };

    this.season = {
      year: 2024,
      week: 1,
      standings: [],
      schedule: [],
    };

    this.initializeRoster();
    this.initializeFreeAgents();
    this.initializeLeague();
  }

  private initializeRoster(): void {
    const positions = ['PG', 'SG', 'SF', 'PF', 'C'];
    const firstNames = ['James', 'Michael', 'Kevin', 'Stephen', 'LeBron', 'Kobe', 'Tim', 'Magic', 'Larry', 'Shaquille'];
    const lastNames = ['Johnson', 'Smith', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Anderson', 'Taylor', 'Thomas'];

    for (let i = 0; i < 12; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const position = positions[i % 5];
      
      const speed = 60 + Math.floor(Math.random() * 35);
      const shooting = 60 + Math.floor(Math.random() * 35);
      const defense = 60 + Math.floor(Math.random() * 35);
      const passing = 60 + Math.floor(Math.random() * 35);
      const rebounding = 60 + Math.floor(Math.random() * 35);
      const overall = Math.floor((speed + shooting + defense + passing + rebounding) / 5);

      this.roster.push({
        id: `player-${i}`,
        name: `${firstName} ${lastName}`,
        position,
        age: 20 + Math.floor(Math.random() * 15),
        stats: { speed, shooting, defense, passing, rebounding, overall },
        contract: {
          salary: 1000000 + Math.floor(Math.random() * 30000000),
          years: 1 + Math.floor(Math.random() * 4),
        },
        injured: Math.random() < 0.1,
        potential: 70 + Math.floor(Math.random() * 25),
      });
    }
  }

  private initializeFreeAgents(): void {
    const positions = ['PG', 'SG', 'SF', 'PF', 'C'];
    const firstNames = ['Anthony', 'Paul', 'Chris', 'Dwyane', 'Russell', 'John', 'Bradley', 'Damian', 'Kyrie', 'Kawhi'];
    const lastNames = ['George', 'Pierce', 'Paul', 'Wade', 'Westbrook', 'Wall', 'Beal', 'Lillard', 'Irving', 'Leonard'];

    for (let i = 0; i < 30; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const position = positions[Math.floor(Math.random() * 5)];
      
      const speed = 55 + Math.floor(Math.random() * 40);
      const shooting = 55 + Math.floor(Math.random() * 40);
      const defense = 55 + Math.floor(Math.random() * 40);
      const passing = 55 + Math.floor(Math.random() * 40);
      const rebounding = 55 + Math.floor(Math.random() * 40);
      const overall = Math.floor((speed + shooting + defense + passing + rebounding) / 5);

      this.freeAgents.push({
        id: `fa-${i}`,
        name: `${firstName} ${lastName}`,
        position,
        age: 22 + Math.floor(Math.random() * 14),
        stats: { speed, shooting, defense, passing, rebounding, overall },
        contract: {
          salary: 500000 + Math.floor(Math.random() * 15000000),
          years: 1 + Math.floor(Math.random() * 3),
        },
        injured: false,
        potential: 65 + Math.floor(Math.random() * 30),
      });
    }
  }

  private initializeLeague(): void {
    const teams = [
      'Your Team', 'Lakers', 'Celtics', 'Warriors', 'Heat',
      'Bulls', 'Knicks', 'Nets', 'Suns', 'Mavericks',
      'Bucks', 'Sixers', 'Clippers', 'Nuggets', 'Grizzlies',
      'Cavaliers', 'Hawks', 'Raptors', 'Wizards', 'Hornets',
      'Pacers', 'Magic', 'Pistons', 'Kings', 'Pelicans',
      'Timberwolves', 'Thunder', 'Trail Blazers', 'Jazz', 'Spurs'
    ];

    // Initialize standings
    this.season.standings = teams.map(team => ({
      team,
      wins: 0,
      losses: 0,
    }));

    // Generate schedule (simplified - 82 games per team)
    for (let week = 1; week <= 26; week++) {
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          if (Math.random() < 0.05) { // Sparse schedule per week
            this.season.schedule.push({
              home: teams[i],
              away: teams[j],
              played: false,
            });
          }
        }
      }
    }
  }

  public scoreHome(points: number): void {
    this.homeTeam.score += points;
    if (this.onScoreCallback) this.onScoreCallback();
  }

  public scoreAway(points: number): void {
    this.awayTeam.score += points;
    if (this.onScoreCallback) this.onScoreCallback();
  }

  public onScore(callback: () => void): void {
    this.onScoreCallback = callback;
  }

  public getTotalSalary(): number {
    return this.roster.reduce((sum, p) => sum + p.contract.salary, 0);
  }

  public canSign(player: PlayerData): boolean {
    return this.getTotalSalary() + player.contract.salary <= this.salaryCap * 1.2; // Soft cap with tax
  }

  public signPlayer(player: PlayerData): boolean {
    if (!this.canSign(player)) return false;
    
    const index = this.freeAgents.findIndex(p => p.id === player.id);
    if (index === -1) return false;
    
    this.freeAgents.splice(index, 1);
    this.roster.push(player);
    return true;
  }

  public releasePlayer(playerId: string): boolean {
    const index = this.roster.findIndex(p => p.id === playerId);
    if (index === -1) return false;
    
    const player = this.roster.splice(index, 1)[0];
    this.freeAgents.push(player);
    return true;
  }

  public simulateGame(homeTeam: string, awayTeam: string): { homeScore: number; awayScore: number } {
    const homeScore = 90 + Math.floor(Math.random() * 35);
    const awayScore = 90 + Math.floor(Math.random() * 35);
    
    // Update standings
    const homeStanding = this.season.standings.find(s => s.team === homeTeam);
    const awayStanding = this.season.standings.find(s => s.team === awayTeam);
    
    if (homeStanding && awayStanding) {
      if (homeScore > awayScore) {
        homeStanding.wins++;
        awayStanding.losses++;
      } else {
        awayStanding.wins++;
        homeStanding.losses++;
      }
    }
    
    return { homeScore, awayScore };
  }

  public advanceWeek(): void {
    this.season.week++;
    
    // Simulate games for the week
    this.season.schedule
      .filter(g => !g.played)
      .slice(0, 15) // ~15 games per week
      .forEach(game => {
        const result = this.simulateGame(game.home, game.away);
        game.played = true;
        game.homeScore = result.homeScore;
        game.awayScore = result.awayScore;
      });
    
    // Sort standings
    this.season.standings.sort((a, b) => {
      const aWinPct = a.wins / (a.wins + a.losses || 1);
      const bWinPct = b.wins / (b.wins + b.losses || 1);
      return bWinPct - aWinPct;
    });
    
    // Player development (small random changes)
    this.roster.forEach(player => {
      if (player.age < 27) {
        // Young players improve
        const improvement = Math.random() * 0.5;
        player.stats.overall = Math.min(99, player.stats.overall + improvement);
      } else if (player.age > 32) {
        // Older players decline
        const decline = Math.random() * 0.3;
        player.stats.overall = Math.max(40, player.stats.overall - decline);
      }
    });
  }
}
