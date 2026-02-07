import { GameState } from '../game/GameState';

type GMTab = 'roster' | 'freeAgency' | 'standings' | 'schedule' | 'finances';

export class GMMode {
  private gameState: GameState;
  private panel!: HTMLElement;
  private currentTab: GMTab = 'roster';

  constructor(gameState: GameState) {
    this.gameState = gameState;
    this.createPanel();
  }

  private createPanel(): void {
    this.panel = document.createElement('div');
    this.panel.id = 'gm-panel';
    document.querySelector('#app')!.appendChild(this.panel);
  }

  public show(): void {
    this.panel.classList.add('active');
    this.render();
  }

  public hide(): void {
    this.panel.classList.remove('active');
  }

  private render(): void {
    this.panel.innerHTML = `
      <div class="gm-header">
        <h1>🏀 ${this.gameState.homeTeam.name} - General Manager</h1>
        <div class="gm-nav">
          <button class="${this.currentTab === 'roster' ? 'active' : ''}" data-tab="roster">Roster</button>
          <button class="${this.currentTab === 'freeAgency' ? 'active' : ''}" data-tab="freeAgency">Free Agency</button>
          <button class="${this.currentTab === 'standings' ? 'active' : ''}" data-tab="standings">Standings</button>
          <button class="${this.currentTab === 'schedule' ? 'active' : ''}" data-tab="schedule">Schedule</button>
          <button class="${this.currentTab === 'finances' ? 'active' : ''}" data-tab="finances">Finances</button>
          <button id="back-to-game" style="background: #ff9500;">▶ Back to Game</button>
        </div>
      </div>
      <div class="gm-content">
        ${this.renderTab()}
      </div>
    `;

    // Tab navigation
    this.panel.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.currentTab = (e.target as HTMLElement).dataset.tab as GMTab;
        this.render();
      });
    });

    // Back to game
    document.getElementById('back-to-game')?.addEventListener('click', () => this.hide());

    // Action buttons
    this.bindActions();
  }

  private renderTab(): string {
    switch (this.currentTab) {
      case 'roster':
        return this.renderRoster();
      case 'freeAgency':
        return this.renderFreeAgency();
      case 'standings':
        return this.renderStandings();
      case 'schedule':
        return this.renderSchedule();
      case 'finances':
        return this.renderFinances();
      default:
        return '';
    }
  }

  private renderRoster(): string {
    const totalSalary = this.gameState.getTotalSalary();
    const capPercent = Math.min(100, (totalSalary / this.gameState.salaryCap) * 100);

    return `
      <div class="gm-section">
        <h2>Team Roster (${this.gameState.roster.length} players)</h2>
        <table class="roster-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Pos</th>
              <th>Age</th>
              <th>OVR</th>
              <th>SPD</th>
              <th>SHT</th>
              <th>DEF</th>
              <th>PAS</th>
              <th>REB</th>
              <th>Salary</th>
              <th>Years</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.gameState.roster.map(p => `
              <tr class="${p.injured ? 'injured' : ''}">
                <td>${p.name} ${p.injured ? '🤕' : ''}</td>
                <td>${p.position}</td>
                <td>${p.age}</td>
                <td><span class="stat-badge">${Math.round(p.stats.overall)}</span></td>
                <td>${Math.round(p.stats.speed)}</td>
                <td>${Math.round(p.stats.shooting)}</td>
                <td>${Math.round(p.stats.defense)}</td>
                <td>${Math.round(p.stats.passing)}</td>
                <td>${Math.round(p.stats.rebounding)}</td>
                <td>$${(p.contract.salary / 1000000).toFixed(1)}M</td>
                <td>${p.contract.years}yr</td>
                <td><button class="release-btn" data-id="${p.id}">Release</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="gm-section">
        <h2>Salary Cap</h2>
        <p>Total: $${(totalSalary / 1000000).toFixed(1)}M / $${(this.gameState.salaryCap / 1000000).toFixed(0)}M</p>
        <div class="salary-cap-bar">
          <div class="salary-cap-fill" style="width: ${capPercent}%"></div>
        </div>
      </div>
    `;
  }

  private renderFreeAgency(): string {
    return `
      <div class="gm-section">
        <h2>Free Agents (${this.gameState.freeAgents.length} available)</h2>
        <table class="roster-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Pos</th>
              <th>Age</th>
              <th>OVR</th>
              <th>POT</th>
              <th>SPD</th>
              <th>SHT</th>
              <th>DEF</th>
              <th>Asking</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.gameState.freeAgents
              .sort((a, b) => b.stats.overall - a.stats.overall)
              .slice(0, 20)
              .map(p => `
              <tr>
                <td>${p.name}</td>
                <td>${p.position}</td>
                <td>${p.age}</td>
                <td><span class="stat-badge">${Math.round(p.stats.overall)}</span></td>
                <td>${p.potential}</td>
                <td>${Math.round(p.stats.speed)}</td>
                <td>${Math.round(p.stats.shooting)}</td>
                <td>${Math.round(p.stats.defense)}</td>
                <td>$${(p.contract.salary / 1000000).toFixed(1)}M/${p.contract.years}yr</td>
                <td><button class="sign-btn" data-id="${p.id}">Sign</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  private renderStandings(): string {
    return `
      <div class="gm-section">
        <h2>Season ${this.gameState.season.year} - Week ${this.gameState.season.week}</h2>
        <button id="advance-week" style="background: #00c851; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-bottom: 20px;">
          ⏩ Advance Week
        </button>
        <table class="roster-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th>W</th>
              <th>L</th>
              <th>PCT</th>
            </tr>
          </thead>
          <tbody>
            ${this.gameState.season.standings.map((s, i) => {
              const pct = s.wins + s.losses > 0 ? (s.wins / (s.wins + s.losses)).toFixed(3) : '.000';
              const isYourTeam = s.team === 'Your Team';
              return `
                <tr style="${isYourTeam ? 'background: rgba(255,149,0,0.2);' : ''}">
                  <td>${i + 1}</td>
                  <td>${s.team} ${isYourTeam ? '⭐' : ''}</td>
                  <td>${s.wins}</td>
                  <td>${s.losses}</td>
                  <td>${pct}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  private renderSchedule(): string {
    const upcomingGames = this.gameState.season.schedule
      .filter(g => !g.played && (g.home === 'Your Team' || g.away === 'Your Team'))
      .slice(0, 10);
    
    const recentGames = this.gameState.season.schedule
      .filter(g => g.played && (g.home === 'Your Team' || g.away === 'Your Team'))
      .slice(-10)
      .reverse();

    return `
      <div class="gm-section">
        <h2>Upcoming Games</h2>
        <table class="roster-table">
          <thead>
            <tr>
              <th>Home</th>
              <th>Away</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${upcomingGames.map(g => `
              <tr>
                <td>${g.home}</td>
                <td>${g.away}</td>
                <td>Scheduled</td>
              </tr>
            `).join('') || '<tr><td colspan="3">No upcoming games</td></tr>'}
          </tbody>
        </table>
      </div>
      
      <div class="gm-section">
        <h2>Recent Results</h2>
        <table class="roster-table">
          <thead>
            <tr>
              <th>Home</th>
              <th>Score</th>
              <th>Away</th>
            </tr>
          </thead>
          <tbody>
            ${recentGames.map(g => `
              <tr>
                <td>${g.home}</td>
                <td>${g.homeScore} - ${g.awayScore}</td>
                <td>${g.away}</td>
              </tr>
            `).join('') || '<tr><td colspan="3">No games played yet</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  }

  private renderFinances(): string {
    const totalSalary = this.gameState.getTotalSalary();
    const taxThreshold = this.gameState.salaryCap * 1.2;
    const isOverTax = totalSalary > taxThreshold;
    const luxuryTax = isOverTax ? (totalSalary - taxThreshold) * 1.5 : 0;

    return `
      <div class="gm-section">
        <h2>Team Finances</h2>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
          <div style="background: rgba(0,200,100,0.2); padding: 20px; border-radius: 10px;">
            <h3 style="color: #00c864; margin-bottom: 10px;">💰 Budget</h3>
            <p style="font-size: 24px; font-weight: bold;">$${(this.gameState.budget / 1000000).toFixed(0)}M</p>
          </div>
          <div style="background: rgba(255,149,0,0.2); padding: 20px; border-radius: 10px;">
            <h3 style="color: #ff9500; margin-bottom: 10px;">📋 Salary Cap</h3>
            <p style="font-size: 24px; font-weight: bold;">$${(this.gameState.salaryCap / 1000000).toFixed(0)}M</p>
          </div>
          <div style="background: rgba(${isOverTax ? '255,68,68' : '100,100,255'},0.2); padding: 20px; border-radius: 10px;">
            <h3 style="color: ${isOverTax ? '#ff4444' : '#6464ff'}; margin-bottom: 10px;">💸 Total Payroll</h3>
            <p style="font-size: 24px; font-weight: bold;">$${(totalSalary / 1000000).toFixed(1)}M</p>
          </div>
        </div>
      </div>
      
      <div class="gm-section">
        <h2>Salary Breakdown</h2>
        ${isOverTax ? `
          <div style="background: rgba(255,68,68,0.2); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            ⚠️ <strong>Luxury Tax:</strong> $${(luxuryTax / 1000000).toFixed(1)}M
            <p style="font-size: 12px; margin-top: 5px; opacity: 0.8;">You're over the tax threshold. Reduce payroll to avoid penalties.</p>
          </div>
        ` : ''}
        <table class="roster-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Salary</th>
              <th>% of Cap</th>
            </tr>
          </thead>
          <tbody>
            ${this.gameState.roster
              .sort((a, b) => b.contract.salary - a.contract.salary)
              .map(p => `
              <tr>
                <td>${p.name}</td>
                <td>$${(p.contract.salary / 1000000).toFixed(2)}M</td>
                <td>${((p.contract.salary / this.gameState.salaryCap) * 100).toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  private bindActions(): void {
    // Release player
    this.panel.querySelectorAll('.release-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.target as HTMLElement).dataset.id!;
        const player = this.gameState.roster.find(p => p.id === id);
        if (player && confirm(`Release ${player.name}?`)) {
          this.gameState.releasePlayer(id);
          this.showMessage(`${player.name} released to free agency`);
          this.render();
        }
      });
    });

    // Sign player
    this.panel.querySelectorAll('.sign-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.target as HTMLElement).dataset.id!;
        const player = this.gameState.freeAgents.find(p => p.id === id);
        if (player) {
          if (this.gameState.signPlayer(player)) {
            this.showMessage(`Signed ${player.name}!`);
            this.render();
          } else {
            this.showMessage('Cannot sign - salary cap exceeded!', true);
          }
        }
      });
    });

    // Advance week
    document.getElementById('advance-week')?.addEventListener('click', () => {
      this.gameState.advanceWeek();
      this.showMessage(`Advanced to Week ${this.gameState.season.week}`);
      this.render();
    });
  }

  private showMessage(message: string, isError: boolean = false): void {
    const toast = document.getElementById('message-toast')!;
    toast.textContent = message;
    toast.classList.remove('error');
    if (isError) toast.classList.add('error');
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
}
