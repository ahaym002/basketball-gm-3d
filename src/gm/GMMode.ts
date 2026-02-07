// ============================================
// Comprehensive GM Mode UI
// ============================================

import { LeagueEngine, getLeagueEngine, createNewLeague } from './LeagueEngine';
import { GMTab, Player, Team, Game, DraftProspect } from './types';
import { 
  TradeProposal, TradePackage, validateTrade, calculateTradeValues, 
  findTradeSuggestions, aiEvaluateTrade, executeTrade 
} from './systems/TradeSystem';
import { getCapSituation, CAP_VALUES, createContractOffer, signPlayer } from './systems/ContractSystem';
import { DraftState } from './systems/DraftSystem';

export class GMMode {
  private engine: LeagueEngine;
  private panel!: HTMLElement;
  private currentTab: GMTab = 'dashboard';
  private tradeState: {
    selectedTeam: string | null;
    userPackage: TradePackage;
    otherPackage: TradePackage;
  } = {
    selectedTeam: null,
    userPackage: { players: [], picks: [], cash: 0 },
    otherPackage: { players: [], picks: [], cash: 0 }
  };

  constructor() {
    this.engine = getLeagueEngine();
    this.createPanel();
  }

  private createPanel(): void {
    this.panel = document.createElement('div');
    this.panel.id = 'gm-panel';
    this.panel.className = 'gm-panel';
    document.querySelector('#app')!.appendChild(this.panel);
  }

  public show(): void {
    this.panel.classList.add('active');
    this.render();
  }

  public hide(): void {
    this.panel.classList.remove('active');
  }

  public setTeam(teamId: string): void {
    this.engine = createNewLeague(teamId);
    this.render();
  }

  private render(): void {
    const team = this.engine.getUserTeam();
    const state = this.engine.getState();
    
    this.panel.innerHTML = `
      <div class="gm-header">
        <div class="gm-team-info">
          <div class="team-logo" style="background-color: ${team.colors.primary}">
            ${team.abbreviation}
          </div>
          <div class="team-details">
            <h1>${team.city} ${team.name}</h1>
            <p>Season ${state.currentSeason.year} | ${state.currentSeason.phase.toUpperCase()} | Week ${state.currentSeason.week}</p>
            <p class="record">${team.wins}-${team.losses} ${team.streak > 0 ? `(W${team.streak})` : team.streak < 0 ? `(L${Math.abs(team.streak)})` : ''}</p>
          </div>
        </div>
        <div class="gm-nav">
          ${this.renderNavTabs()}
        </div>
        <div class="gm-actions">
          <button id="sim-day" class="btn btn-primary">▶ Sim Day</button>
          <button id="sim-week" class="btn btn-secondary">⏩ Sim Week</button>
          <button id="back-to-game" class="btn btn-accent">🎮 Play Game</button>
        </div>
      </div>
      <div class="gm-content">
        ${this.renderTab()}
      </div>
    `;

    this.bindEvents();
  }

  private renderNavTabs(): string {
    const tabs: { id: GMTab; label: string; icon: string }[] = [
      { id: 'dashboard', label: 'Dashboard', icon: '📊' },
      { id: 'roster', label: 'Roster', icon: '👥' },
      { id: 'trade', label: 'Trade', icon: '🔄' },
      { id: 'freeAgency', label: 'Free Agency', icon: '📝' },
      { id: 'draft', label: 'Draft', icon: '🎯' },
      { id: 'standings', label: 'Standings', icon: '🏆' },
      { id: 'schedule', label: 'Schedule', icon: '📅' },
      { id: 'finances', label: 'Finances', icon: '💰' },
      { id: 'awards', label: 'Awards', icon: '🏅' }
    ];
    
    return tabs.map(tab => `
      <button class="nav-tab ${this.currentTab === tab.id ? 'active' : ''}" data-tab="${tab.id}">
        <span class="tab-icon">${tab.icon}</span>
        <span class="tab-label">${tab.label}</span>
      </button>
    `).join('');
  }

  private renderTab(): string {
    switch (this.currentTab) {
      case 'dashboard': return this.renderDashboard();
      case 'roster': return this.renderRoster();
      case 'trade': return this.renderTrade();
      case 'freeAgency': return this.renderFreeAgency();
      case 'draft': return this.renderDraft();
      case 'standings': return this.renderStandings();
      case 'schedule': return this.renderSchedule();
      case 'finances': return this.renderFinances();
      case 'awards': return this.renderAwards();
      default: return '';
    }
  }

  // ==================== DASHBOARD ====================
  private renderDashboard(): string {
    const team = this.engine.getUserTeam();
    const state = this.engine.getState();
    const capSituation = getCapSituation(team, state);
    const upcoming = this.engine.getUpcomingGames(team.id, 5);
    const recent = this.engine.getRecentGames(team.id, 5);
    const standings = this.engine.getStandings(team.conference);
    const teamRank = standings.findIndex(t => t.id === team.id) + 1;
    
    // Get top performers
    const roster = team.roster.map(id => state.players[id]).filter(Boolean);
    const topScorer = roster.sort((a, b) => {
      const aStats = a.seasonStats[state.currentSeason.year];
      const bStats = b.seasonStats[state.currentSeason.year];
      return (bStats?.points / bStats?.gamesPlayed || 0) - (aStats?.points / aStats?.gamesPlayed || 0);
    })[0];
    
    return `
      <div class="dashboard-grid">
        <!-- Team Overview -->
        <div class="dashboard-card team-overview">
          <h2>Team Overview</h2>
          <div class="stats-row">
            <div class="stat-box">
              <span class="stat-label">Record</span>
              <span class="stat-value">${team.wins}-${team.losses}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Conf. Rank</span>
              <span class="stat-value">#${teamRank}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">L10</span>
              <span class="stat-value">${team.lastTenGames.filter(g => g === 'W').length}-${team.lastTenGames.filter(g => g === 'L').length}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Streak</span>
              <span class="stat-value">${team.streak > 0 ? `W${team.streak}` : team.streak < 0 ? `L${Math.abs(team.streak)}` : '-'}</span>
            </div>
          </div>
        </div>
        
        <!-- Cap Situation -->
        <div class="dashboard-card cap-overview">
          <h2>Salary Cap</h2>
          <div class="cap-bar">
            <div class="cap-fill ${capSituation.overTax ? 'over-tax' : capSituation.overCap ? 'over-cap' : 'under-cap'}" 
                 style="width: ${Math.min(100, (capSituation.payroll / CAP_VALUES.luxuryTax) * 100)}%">
            </div>
            <div class="cap-line" style="left: ${(CAP_VALUES.salaryCap / CAP_VALUES.luxuryTax) * 100}%"></div>
          </div>
          <div class="cap-labels">
            <span>$${(capSituation.payroll / 1000000).toFixed(1)}M / $${(CAP_VALUES.salaryCap / 1000000).toFixed(0)}M</span>
            ${capSituation.overTax ? `<span class="tax-warning">⚠️ Luxury Tax: $${(capSituation.projectedTax / 1000000).toFixed(1)}M</span>` : ''}
          </div>
        </div>
        
        <!-- Upcoming Games -->
        <div class="dashboard-card upcoming-games">
          <h2>Upcoming Games</h2>
          <div class="game-list">
            ${upcoming.map(game => this.renderGamePreview(game, team.id)).join('')}
          </div>
        </div>
        
        <!-- Recent Results -->
        <div class="dashboard-card recent-games">
          <h2>Recent Results</h2>
          <div class="game-list">
            ${recent.map(game => this.renderGameResult(game, team.id)).join('')}
          </div>
        </div>
        
        <!-- Top Performers -->
        <div class="dashboard-card top-performers">
          <h2>Team Leaders</h2>
          ${topScorer ? `
            <div class="leader-item">
              <span class="leader-label">PPG Leader</span>
              <span class="leader-name">${topScorer.firstName} ${topScorer.lastName}</span>
              <span class="leader-value">${(topScorer.seasonStats[state.currentSeason.year]?.points / topScorer.seasonStats[state.currentSeason.year]?.gamesPlayed || 0).toFixed(1)}</span>
            </div>
          ` : '<p>No stats yet</p>'}
        </div>
        
        <!-- Quick Actions -->
        <div class="dashboard-card quick-actions">
          <h2>Quick Actions</h2>
          <button class="action-btn" data-action="view-roster">👥 View Roster</button>
          <button class="action-btn" data-action="find-trades">🔄 Find Trades</button>
          <button class="action-btn" data-action="scout-fas">📝 Scout Free Agents</button>
          ${state.currentSeason.phase === 'draft' ? '<button class="action-btn" data-action="go-draft">🎯 Go To Draft</button>' : ''}
        </div>
      </div>
    `;
  }

  private renderGamePreview(game: Game, teamId: string): string {
    const state = this.engine.getState();
    const isHome = game.homeTeamId === teamId;
    const opponent = state.teams[isHome ? game.awayTeamId : game.homeTeamId];
    
    return `
      <div class="game-item">
        <span class="game-type">${isHome ? 'vs' : '@'}</span>
        <span class="game-opponent">${opponent.city} ${opponent.name}</span>
        <span class="game-record">(${opponent.wins}-${opponent.losses})</span>
      </div>
    `;
  }

  private renderGameResult(game: Game, teamId: string): string {
    const state = this.engine.getState();
    const isHome = game.homeTeamId === teamId;
    const opponent = state.teams[isHome ? game.awayTeamId : game.homeTeamId];
    const teamScore = isHome ? game.homeScore : game.awayScore;
    const oppScore = isHome ? game.awayScore : game.homeScore;
    const won = teamScore! > oppScore!;
    
    return `
      <div class="game-item ${won ? 'win' : 'loss'}">
        <span class="game-result">${won ? 'W' : 'L'}</span>
        <span class="game-score">${teamScore}-${oppScore}</span>
        <span class="game-type">${isHome ? 'vs' : '@'}</span>
        <span class="game-opponent">${opponent.abbreviation}</span>
      </div>
    `;
  }

  // ==================== ROSTER ====================
  private renderRoster(): string {
    const team = this.engine.getUserTeam();
    const state = this.engine.getState();
    const players = team.roster.map(id => state.players[id]).filter(Boolean)
      .sort((a, b) => b.stats.overall - a.stats.overall);
    
    return `
      <div class="roster-section">
        <div class="section-header">
          <h2>Team Roster (${players.length}/15)</h2>
          <div class="roster-actions">
            <button class="btn btn-sm" id="sort-overall">Sort by OVR</button>
            <button class="btn btn-sm" id="sort-salary">Sort by Salary</button>
          </div>
        </div>
        
        <table class="data-table roster-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Pos</th>
              <th>Age</th>
              <th>OVR</th>
              <th>POT</th>
              <th>Contract</th>
              <th>Stats</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${players.map(p => this.renderPlayerRow(p, state.currentSeason.year)).join('')}
          </tbody>
        </table>
        
        <div class="salary-summary">
          <h3>Salary Summary</h3>
          <p>Total Payroll: <strong>$${(team.payroll / 1000000).toFixed(1)}M</strong></p>
          <p>Cap Space: <strong>$${Math.max(0, (CAP_VALUES.salaryCap - team.payroll) / 1000000).toFixed(1)}M</strong></p>
        </div>
      </div>
    `;
  }

  private renderPlayerRow(player: Player, year: number): string {
    const stats = player.seasonStats[year];
    const ppg = stats ? (stats.points / stats.gamesPlayed || 0).toFixed(1) : '-';
    const rpg = stats ? (stats.rebounds / stats.gamesPlayed || 0).toFixed(1) : '-';
    const apg = stats ? (stats.assists / stats.gamesPlayed || 0).toFixed(1) : '-';
    
    return `
      <tr class="${player.injury ? 'injured' : ''}">
        <td>
          <div class="player-name">
            ${player.firstName} ${player.lastName}
            ${player.injury ? `<span class="injury-badge" title="${player.injury.type}">🤕</span>` : ''}
          </div>
        </td>
        <td>${player.position}</td>
        <td>${player.age}</td>
        <td><span class="rating-badge ${this.getRatingClass(player.stats.overall)}">${player.stats.overall}</span></td>
        <td><span class="rating-badge pot">${player.potential}</span></td>
        <td>
          <span class="contract-info">
            $${(player.contract.salary / 1000000).toFixed(1)}M/${player.contract.years}yr
            ${player.contract.noTradeClause ? '🔒' : ''}
          </span>
        </td>
        <td class="stat-cell">${ppg}/${rpg}/${apg}</td>
        <td>
          <button class="btn-icon" data-action="view-player" data-id="${player.id}" title="View">👁</button>
          <button class="btn-icon" data-action="trade-player" data-id="${player.id}" title="Trade">🔄</button>
          <button class="btn-icon danger" data-action="release-player" data-id="${player.id}" title="Release">✖</button>
        </td>
      </tr>
    `;
  }

  private getRatingClass(rating: number): string {
    if (rating >= 90) return 'elite';
    if (rating >= 80) return 'star';
    if (rating >= 70) return 'starter';
    if (rating >= 60) return 'rotation';
    return 'bench';
  }

  // ==================== TRADE ====================
  private renderTrade(): string {
    const team = this.engine.getUserTeam();
    const state = this.engine.getState();
    const otherTeams = Object.values(state.teams).filter(t => t.id !== team.id);
    
    return `
      <div class="trade-machine">
        <div class="trade-header">
          <h2>🔄 Trade Machine</h2>
          <p>Build and evaluate trades with any team</p>
        </div>
        
        <div class="trade-sides">
          <!-- Your Team -->
          <div class="trade-side your-side">
            <h3>${team.city} ${team.name} Send</h3>
            <div class="trade-assets" id="your-assets">
              ${this.renderTradeAssets(team, this.tradeState.userPackage, true)}
            </div>
            <div class="asset-selector">
              <select id="your-player-select">
                <option value="">Add Player...</option>
                ${team.roster.map(id => {
                  const p = state.players[id];
                  return p ? `<option value="${p.id}">${p.firstName} ${p.lastName} (${p.stats.overall} OVR, $${(p.contract.salary/1000000).toFixed(1)}M)</option>` : '';
                }).join('')}
              </select>
              <select id="your-pick-select">
                <option value="">Add Pick...</option>
                ${team.draftPicks.map((pick, i) => 
                  `<option value="${i}">${pick.year} ${pick.round === 1 ? '1st' : '2nd'} Round${pick.originalTeamId !== team.id ? ` (via ${pick.originalTeamId})` : ''}</option>`
                ).join('')}
              </select>
            </div>
          </div>
          
          <!-- Trade Arrows -->
          <div class="trade-center">
            <div class="trade-arrows">⇄</div>
            ${this.tradeState.selectedTeam ? this.renderTradeEvaluation() : ''}
          </div>
          
          <!-- Other Team -->
          <div class="trade-side other-side">
            <h3>
              <select id="trade-team-select">
                <option value="">Select Team...</option>
                ${otherTeams.map(t => `<option value="${t.id}" ${this.tradeState.selectedTeam === t.id ? 'selected' : ''}>${t.city} ${t.name}</option>`).join('')}
              </select>
            </h3>
            ${this.tradeState.selectedTeam ? `
              <div class="trade-assets" id="other-assets">
                ${this.renderTradeAssets(state.teams[this.tradeState.selectedTeam], this.tradeState.otherPackage, false)}
              </div>
              <div class="asset-selector">
                <select id="other-player-select">
                  <option value="">Add Player...</option>
                  ${state.teams[this.tradeState.selectedTeam].roster.map(id => {
                    const p = state.players[id];
                    return p ? `<option value="${p.id}">${p.firstName} ${p.lastName} (${p.stats.overall} OVR, $${(p.contract.salary/1000000).toFixed(1)}M)</option>` : '';
                  }).join('')}
                </select>
              </div>
            ` : '<p class="placeholder">Select a team to trade with</p>'}
          </div>
        </div>
        
        <div class="trade-actions">
          <button class="btn btn-secondary" id="clear-trade">Clear Trade</button>
          <button class="btn btn-primary" id="propose-trade" ${!this.tradeState.selectedTeam ? 'disabled' : ''}>Propose Trade</button>
        </div>
        
        <!-- Trade Finder -->
        <div class="trade-finder">
          <h3>💡 Trade Finder</h3>
          <p>Looking for trade ideas? Select a player you want to acquire:</p>
          <input type="text" id="trade-search" placeholder="Search players..." class="search-input" />
        </div>
      </div>
    `;
  }

  private renderTradeAssets(team: Team, pkg: TradePackage, isUser: boolean): string {
    const state = this.engine.getState();
    let html = '';
    
    for (const playerId of pkg.players) {
      const player = state.players[playerId];
      if (player) {
        html += `
          <div class="trade-asset player-asset">
            <span class="asset-name">${player.firstName} ${player.lastName}</span>
            <span class="asset-details">${player.position} | ${player.stats.overall} OVR | $${(player.contract.salary/1000000).toFixed(1)}M</span>
            <button class="remove-asset" data-type="player" data-id="${playerId}" data-side="${isUser ? 'user' : 'other'}">×</button>
          </div>
        `;
      }
    }
    
    for (const pick of pkg.picks) {
      html += `
        <div class="trade-asset pick-asset">
          <span class="asset-name">${pick.year} ${pick.round === 1 ? '1st' : '2nd'} Round Pick</span>
          ${pick.protections?.length ? '<span class="protected">Protected</span>' : ''}
          <button class="remove-asset" data-type="pick" data-id="${pick.year}-${pick.round}" data-side="${isUser ? 'user' : 'other'}">×</button>
        </div>
      `;
    }
    
    if (!html) {
      html = '<p class="no-assets">No assets selected</p>';
    }
    
    return html;
  }

  private renderTradeEvaluation(): string {
    if (!this.tradeState.selectedTeam) return '';
    
    const state = this.engine.getState();
    const proposal: TradeProposal = {
      teams: [state.userTeamId, this.tradeState.selectedTeam],
      assets: new Map([
        [state.userTeamId, this.tradeState.userPackage],
        [this.tradeState.selectedTeam, this.tradeState.otherPackage]
      ])
    };
    
    if (this.tradeState.userPackage.players.length === 0 && this.tradeState.otherPackage.players.length === 0) {
      return '<div class="trade-eval empty">Add players to see trade evaluation</div>';
    }
    
    const validation = validateTrade(proposal, state);
    const values = calculateTradeValues(proposal, state);
    
    const userValue = values[state.userTeamId]?.value || 0;
    
    return `
      <div class="trade-eval ${validation.isValid ? 'valid' : 'invalid'}">
        <div class="trade-value">
          <span class="value-label">Your Value</span>
          <span class="value-number ${userValue >= 0 ? 'positive' : 'negative'}">
            ${userValue >= 0 ? '+' : ''}${userValue.toFixed(0)}
          </span>
        </div>
        ${!validation.isValid ? `
          <div class="trade-errors">
            ${validation.errors.map(e => `<div class="error">❌ ${e}</div>`).join('')}
          </div>
        ` : ''}
        ${validation.warnings.length > 0 ? `
          <div class="trade-warnings">
            ${validation.warnings.map(w => `<div class="warning">⚠️ ${w}</div>`).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  // ==================== FREE AGENCY ====================
  private renderFreeAgency(): string {
    const state = this.engine.getState();
    const freeAgents = state.freeAgents
      .map(id => state.players[id])
      .filter(Boolean)
      .sort((a, b) => b.stats.overall - a.stats.overall);
    
    return `
      <div class="free-agency-section">
        <div class="section-header">
          <h2>📝 Free Agency</h2>
          <div class="filter-row">
            <select id="fa-position-filter">
              <option value="">All Positions</option>
              <option value="PG">Point Guard</option>
              <option value="SG">Shooting Guard</option>
              <option value="SF">Small Forward</option>
              <option value="PF">Power Forward</option>
              <option value="C">Center</option>
            </select>
            <select id="fa-rating-filter">
              <option value="">All Ratings</option>
              <option value="80">80+ OVR</option>
              <option value="70">70+ OVR</option>
              <option value="60">60+ OVR</option>
            </select>
          </div>
        </div>
        
        <table class="data-table fa-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Pos</th>
              <th>Age</th>
              <th>OVR</th>
              <th>POT</th>
              <th>Key Stats</th>
              <th>Asking</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${freeAgents.slice(0, 50).map(p => this.renderFreeAgentRow(p)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  private renderFreeAgentRow(player: Player): string {
    return `
      <tr>
        <td><strong>${player.firstName} ${player.lastName}</strong></td>
        <td>${player.position}</td>
        <td>${player.age}</td>
        <td><span class="rating-badge ${this.getRatingClass(player.stats.overall)}">${player.stats.overall}</span></td>
        <td>${player.potential}</td>
        <td class="stat-cell">
          SPD ${player.stats.speed} | 3PT ${player.stats.threePoint} | DEF ${player.stats.perimeterDefense}
        </td>
        <td>$${(player.contract.salary / 1000000).toFixed(1)}M/${player.contract.years}yr</td>
        <td>
          <button class="btn btn-sm btn-primary" data-action="sign-player" data-id="${player.id}">Sign</button>
          <button class="btn btn-sm" data-action="negotiate" data-id="${player.id}">Negotiate</button>
        </td>
      </tr>
    `;
  }

  // ==================== DRAFT ====================
  private renderDraft(): string {
    const state = this.engine.getState();
    const draftState = this.engine.getDraftState();
    
    if (!draftState) {
      return `
        <div class="draft-section">
          <div class="draft-waiting">
            <h2>🎯 NBA Draft</h2>
            <p>The draft has not started yet.</p>
            ${state.currentSeason.phase === 'offseason' ? `
              <button class="btn btn-primary" id="start-draft">Start Draft</button>
            ` : `
              <p>Complete the season to enter the draft.</p>
            `}
          </div>
        </div>
      `;
    }
    
    return `
      <div class="draft-section">
        <div class="draft-header">
          <h2>🎯 ${draftState.year} NBA Draft</h2>
          <span class="draft-phase">${draftState.phase.toUpperCase()}</span>
        </div>
        
        ${draftState.phase === 'round1' || draftState.phase === 'round2' ? this.renderDraftBoard(draftState) : ''}
        ${draftState.phase === 'complete' ? this.renderDraftResults(draftState) : ''}
        
        ${draftState.lotteryResults.length > 0 ? `
          <div class="lottery-results">
            <h3>Lottery Results</h3>
            <div class="lottery-list">
              ${draftState.lotteryResults.slice(0, 14).map((r, i) => `
                <div class="lottery-item ${r.jumped > 0 ? 'jumped-up' : r.jumped < 0 ? 'jumped-down' : ''}">
                  <span class="pick-num">#${r.position}</span>
                  <span class="team-name">${r.teamName}</span>
                  ${r.jumped !== 0 ? `<span class="jump">${r.jumped > 0 ? `↑${r.jumped}` : `↓${Math.abs(r.jumped)}`}</span>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderDraftBoard(draftState: DraftState): string {
    const state = this.engine.getState();
    const currentTeamId = draftState.draftOrder[draftState.currentPick - 1];
    const isUserPick = currentTeamId === state.userTeamId;
    
    return `
      <div class="draft-board">
        <div class="current-pick">
          <h3>Pick #${draftState.currentPick}</h3>
          <p>${isUserPick ? 'YOUR PICK!' : state.teams[currentTeamId]?.name || 'Unknown'}</p>
          ${!isUserPick ? `<button class="btn" id="sim-pick">Simulate Pick</button>` : ''}
        </div>
        
        ${isUserPick ? `
          <div class="prospect-list">
            <h3>Available Prospects</h3>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Pos</th>
                  <th>Age</th>
                  <th>College</th>
                  <th>OVR</th>
                  <th>POT</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${draftState.availableProspects.slice(0, 20).map((p, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td><strong>${p.firstName} ${p.lastName}</strong></td>
                    <td>${p.position}</td>
                    <td>${p.age}</td>
                    <td>${p.college || 'International'}</td>
                    <td><span class="rating-badge">${p.stats.overall}</span></td>
                    <td><span class="rating-badge pot">${p.potential}</span></td>
                    <td>
                      <button class="btn btn-sm btn-primary" data-action="draft-player" data-id="${p.id}">Draft</button>
                      <button class="btn btn-sm" data-action="scout-prospect" data-id="${p.id}">Scout</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
        
        <div class="draft-history">
          <h3>Draft Results</h3>
          ${draftState.results.slice(-10).reverse().map(r => `
            <div class="draft-result">
              <span class="pick">#${r.overallPick}</span>
              <span class="team">${r.teamName}</span>
              <span class="player">${r.prospectName}</span>
              <span class="pos">${r.position}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  private renderDraftResults(draftState: DraftState): string {
    return `
      <div class="draft-complete">
        <h3>Draft Complete!</h3>
        <button class="btn btn-primary" id="continue-offseason">Continue to Free Agency</button>
        
        <div class="draft-recap">
          <h4>Full Draft Results</h4>
          <table class="data-table">
            <thead>
              <tr>
                <th>Pick</th>
                <th>Team</th>
                <th>Player</th>
                <th>Position</th>
              </tr>
            </thead>
            <tbody>
              ${draftState.results.map(r => `
                <tr>
                  <td>#${r.overallPick}</td>
                  <td>${r.teamName}</td>
                  <td>${r.prospectName}</td>
                  <td>${r.position}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ==================== STANDINGS ====================
  private renderStandings(): string {
    const eastern = this.engine.getStandings('Eastern');
    const western = this.engine.getStandings('Western');
    
    return `
      <div class="standings-section">
        <div class="conference-standings">
          <div class="conference">
            <h2>Eastern Conference</h2>
            ${this.renderConferenceStandings(eastern)}
          </div>
          <div class="conference">
            <h2>Western Conference</h2>
            ${this.renderConferenceStandings(western)}
          </div>
        </div>
      </div>
    `;
  }

  private renderConferenceStandings(teams: Team[]): string {
    const userTeamId = this.engine.getState().userTeamId;
    
    return `
      <table class="data-table standings-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Team</th>
            <th>W</th>
            <th>L</th>
            <th>PCT</th>
            <th>GB</th>
            <th>L10</th>
            <th>Strk</th>
          </tr>
        </thead>
        <tbody>
          ${teams.map((team, i) => {
            const pct = team.wins + team.losses > 0 ? (team.wins / (team.wins + team.losses)).toFixed(3) : '.000';
            const firstTeam = teams[0];
            const firstPct = firstTeam.wins / (firstTeam.wins + firstTeam.losses || 1);
            const thisPct = team.wins / (team.wins + team.losses || 1);
            const gb = i === 0 ? '-' : (((firstTeam.wins - team.wins) + (team.losses - firstTeam.losses)) / 2).toFixed(1);
            const l10 = team.lastTenGames.filter(g => g === 'W').length + '-' + team.lastTenGames.filter(g => g === 'L').length;
            const streak = team.streak > 0 ? `W${team.streak}` : team.streak < 0 ? `L${Math.abs(team.streak)}` : '-';
            
            return `
              <tr class="${team.id === userTeamId ? 'user-team' : ''} ${i < 6 ? 'playoff-position' : i < 10 ? 'playin-position' : ''}">
                <td>${i + 1}</td>
                <td>
                  <span class="team-color" style="background-color: ${team.colors.primary}"></span>
                  ${team.city} ${team.name}
                </td>
                <td>${team.wins}</td>
                <td>${team.losses}</td>
                <td>${pct}</td>
                <td>${gb}</td>
                <td>${l10}</td>
                <td>${streak}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  // ==================== SCHEDULE ====================
  private renderSchedule(): string {
    const team = this.engine.getUserTeam();
    const upcoming = this.engine.getUpcomingGames(team.id, 20);
    const recent = this.engine.getRecentGames(team.id, 20);
    
    return `
      <div class="schedule-section">
        <div class="schedule-column">
          <h2>Upcoming Games</h2>
          ${this.renderGameList(upcoming, team.id, false)}
        </div>
        <div class="schedule-column">
          <h2>Recent Games</h2>
          ${this.renderGameList(recent, team.id, true)}
        </div>
      </div>
    `;
  }

  private renderGameList(games: Game[], teamId: string, showResults: boolean): string {
    const state = this.engine.getState();
    
    if (games.length === 0) {
      return '<p class="empty-list">No games</p>';
    }
    
    return `
      <div class="game-list detailed">
        ${games.map(game => {
          const isHome = game.homeTeamId === teamId;
          const opponent = state.teams[isHome ? game.awayTeamId : game.homeTeamId];
          
          if (showResults && game.played) {
            const teamScore = isHome ? game.homeScore : game.awayScore;
            const oppScore = isHome ? game.awayScore : game.homeScore;
            const won = teamScore! > oppScore!;
            
            return `
              <div class="game-card ${won ? 'win' : 'loss'}">
                <div class="game-result-badge">${won ? 'W' : 'L'}</div>
                <div class="game-info">
                  <span class="game-matchup">${isHome ? 'vs' : '@'} ${opponent.city} ${opponent.name}</span>
                  <span class="game-score">${teamScore} - ${oppScore}${game.overtime ? ` (${game.overtime}OT)` : ''}</span>
                </div>
                <button class="btn btn-sm" data-action="view-boxscore" data-id="${game.id}">Box Score</button>
              </div>
            `;
          } else {
            return `
              <div class="game-card upcoming">
                <div class="game-date">${game.date.month}/${game.date.day}</div>
                <div class="game-info">
                  <span class="game-matchup">${isHome ? 'vs' : '@'} ${opponent.city} ${opponent.name}</span>
                  <span class="opponent-record">${opponent.wins}-${opponent.losses}</span>
                </div>
              </div>
            `;
          }
        }).join('')}
      </div>
    `;
  }

  // ==================== FINANCES ====================
  private renderFinances(): string {
    const team = this.engine.getUserTeam();
    const state = this.engine.getState();
    const capSituation = getCapSituation(team, state);
    const players = team.roster.map(id => state.players[id]).filter(Boolean)
      .sort((a, b) => b.contract.salary - a.contract.salary);
    
    return `
      <div class="finances-section">
        <div class="finance-cards">
          <div class="finance-card">
            <h3>💰 Salary Cap</h3>
            <div class="big-number">$${(CAP_VALUES.salaryCap / 1000000).toFixed(0)}M</div>
          </div>
          <div class="finance-card">
            <h3>📊 Current Payroll</h3>
            <div class="big-number ${capSituation.overCap ? 'warning' : ''}">$${(capSituation.payroll / 1000000).toFixed(1)}M</div>
          </div>
          <div class="finance-card">
            <h3>📈 Cap Space</h3>
            <div class="big-number ${capSituation.capSpace > 0 ? 'positive' : 'negative'}">$${(capSituation.capSpace / 1000000).toFixed(1)}M</div>
          </div>
          <div class="finance-card ${capSituation.overTax ? 'danger' : ''}">
            <h3>💸 Luxury Tax</h3>
            <div class="big-number">${capSituation.overTax ? `$${(capSituation.projectedTax / 1000000).toFixed(1)}M` : 'None'}</div>
          </div>
        </div>
        
        <div class="cap-visualization">
          <h3>Salary Cap Breakdown</h3>
          <div class="cap-bar-large">
            <div class="cap-segment payroll" style="width: ${Math.min(100, (capSituation.payroll / CAP_VALUES.secondApron) * 100)}%">
              Payroll
            </div>
            <div class="cap-marker cap-line" style="left: ${(CAP_VALUES.salaryCap / CAP_VALUES.secondApron) * 100}%">
              <span>Cap</span>
            </div>
            <div class="cap-marker tax-line" style="left: ${(CAP_VALUES.luxuryTax / CAP_VALUES.secondApron) * 100}%">
              <span>Tax</span>
            </div>
            <div class="cap-marker apron-line" style="left: ${(CAP_VALUES.firstApron / CAP_VALUES.secondApron) * 100}%">
              <span>Apron</span>
            </div>
          </div>
        </div>
        
        <div class="salary-breakdown">
          <h3>Player Salaries</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Salary</th>
                <th>Years</th>
                <th>% of Cap</th>
                <th>Contract Type</th>
              </tr>
            </thead>
            <tbody>
              ${players.map(p => `
                <tr>
                  <td>${p.firstName} ${p.lastName}</td>
                  <td>$${(p.contract.salary / 1000000).toFixed(2)}M</td>
                  <td>${p.contract.years}</td>
                  <td>${((p.contract.salary / CAP_VALUES.salaryCap) * 100).toFixed(1)}%</td>
                  <td>
                    ${p.contract.type}
                    ${p.contract.noTradeClause ? '🔒 NTC' : ''}
                    ${p.contract.playerOption ? '🎯 PO' : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="cap-exceptions">
          <h3>Available Exceptions</h3>
          ${capSituation.availableExceptions.length > 0 ? `
            <ul class="exception-list">
              ${capSituation.availableExceptions.map(e => `
                <li>
                  <strong>${e.type.replace('-', ' ').toUpperCase()}</strong>: 
                  $${(e.remaining / 1000000).toFixed(1)}M remaining
                </li>
              `).join('')}
            </ul>
          ` : '<p>No exceptions available</p>'}
        </div>
      </div>
    `;
  }

  // ==================== AWARDS ====================
  private renderAwards(): string {
    const state = this.engine.getState();
    const leaders = this.engine.getLeaders();
    
    return `
      <div class="awards-section">
        <h2>🏅 Season Awards & Leaders</h2>
        
        <div class="stat-leaders">
          <div class="leader-category">
            <h3>Points Per Game</h3>
            ${this.renderLeadersList(leaders.points)}
          </div>
          <div class="leader-category">
            <h3>Rebounds Per Game</h3>
            ${this.renderLeadersList(leaders.rebounds)}
          </div>
          <div class="leader-category">
            <h3>Assists Per Game</h3>
            ${this.renderLeadersList(leaders.assists)}
          </div>
          <div class="leader-category">
            <h3>Steals Per Game</h3>
            ${this.renderLeadersList(leaders.steals)}
          </div>
          <div class="leader-category">
            <h3>Blocks Per Game</h3>
            ${this.renderLeadersList(leaders.blocks)}
          </div>
        </div>
        
        <div class="award-history">
          <h3>Recent Award Winners</h3>
          <p class="placeholder">Awards will be announced at end of season.</p>
        </div>
      </div>
    `;
  }

  private renderLeadersList(leaders: { player: Player; value: number }[]): string {
    return `
      <ol class="leaders-list">
        ${leaders.slice(0, 5).map((l, i) => `
          <li>
            <span class="rank">${i + 1}.</span>
            <span class="name">${l.player.firstName} ${l.player.lastName}</span>
            <span class="team">${l.player.teamId}</span>
            <span class="value">${l.value.toFixed(1)}</span>
          </li>
        `).join('')}
      </ol>
    `;
  }

  // ==================== EVENT BINDINGS ====================
  private bindEvents(): void {
    // Tab navigation
    this.panel.querySelectorAll('.nav-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.currentTab = (e.currentTarget as HTMLElement).dataset.tab as GMTab;
        this.render();
      });
    });

    // Simulation buttons
    document.getElementById('sim-day')?.addEventListener('click', () => {
      this.engine.simulateDay();
      this.render();
    });

    document.getElementById('sim-week')?.addEventListener('click', () => {
      this.engine.simulateWeek();
      this.render();
    });

    document.getElementById('back-to-game')?.addEventListener('click', () => {
      this.hide();
    });

    // Trade team select
    document.getElementById('trade-team-select')?.addEventListener('change', (e) => {
      this.tradeState.selectedTeam = (e.target as HTMLSelectElement).value || null;
      this.tradeState.otherPackage = { players: [], picks: [], cash: 0 };
      this.render();
    });

    // Add player to trade
    document.getElementById('your-player-select')?.addEventListener('change', (e) => {
      const playerId = (e.target as HTMLSelectElement).value;
      if (playerId && !this.tradeState.userPackage.players.includes(playerId)) {
        this.tradeState.userPackage.players.push(playerId);
        this.render();
      }
    });

    document.getElementById('other-player-select')?.addEventListener('change', (e) => {
      const playerId = (e.target as HTMLSelectElement).value;
      if (playerId && !this.tradeState.otherPackage.players.includes(playerId)) {
        this.tradeState.otherPackage.players.push(playerId);
        this.render();
      }
    });

    // Clear trade
    document.getElementById('clear-trade')?.addEventListener('click', () => {
      this.tradeState.userPackage = { players: [], picks: [], cash: 0 };
      this.tradeState.otherPackage = { players: [], picks: [], cash: 0 };
      this.render();
    });

    // Propose trade
    document.getElementById('propose-trade')?.addEventListener('click', () => {
      this.proposeTrade();
    });

    // Draft actions
    document.getElementById('start-draft')?.addEventListener('click', () => {
      this.engine.startDraft();
      this.render();
    });

    document.getElementById('sim-pick')?.addEventListener('click', () => {
      this.engine.makeDraftPick();
      this.render();
    });

    // Draft player buttons
    this.panel.querySelectorAll('[data-action="draft-player"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const prospectId = (e.currentTarget as HTMLElement).dataset.id!;
        this.engine.makeDraftPick(prospectId);
        this.render();
      });
    });

    // Sign free agent
    this.panel.querySelectorAll('[data-action="sign-player"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const playerId = (e.currentTarget as HTMLElement).dataset.id!;
        this.signFreeAgent(playerId);
      });
    });

    // Release player
    this.panel.querySelectorAll('[data-action="release-player"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const playerId = (e.currentTarget as HTMLElement).dataset.id!;
        if (confirm('Are you sure you want to release this player?')) {
          // Would call release function here
          this.showMessage('Player released');
          this.render();
        }
      });
    });
  }

  private proposeTrade(): void {
    if (!this.tradeState.selectedTeam) return;
    
    const state = this.engine.getState();
    const proposal: TradeProposal = {
      teams: [state.userTeamId, this.tradeState.selectedTeam],
      assets: new Map([
        [state.userTeamId, this.tradeState.userPackage],
        [this.tradeState.selectedTeam, this.tradeState.otherPackage]
      ])
    };
    
    const validation = validateTrade(proposal, state);
    
    if (!validation.isValid) {
      this.showMessage(`Trade invalid: ${validation.errors[0]}`, true);
      return;
    }
    
    const aiResponse = aiEvaluateTrade(this.tradeState.selectedTeam, proposal, state);
    
    if (aiResponse.accept) {
      executeTrade(proposal, state);
      this.showMessage('Trade accepted!');
      this.tradeState = {
        selectedTeam: null,
        userPackage: { players: [], picks: [], cash: 0 },
        otherPackage: { players: [], picks: [], cash: 0 }
      };
    } else {
      this.showMessage(`Trade rejected: ${aiResponse.reason}`, true);
    }
    
    this.render();
  }

  private signFreeAgent(playerId: string): void {
    const state = this.engine.getState();
    const player = state.players[playerId];
    const team = this.engine.getUserTeam();
    
    if (!player) return;
    
    const offer = createContractOffer(player, team, state);
    
    if (!offer) {
      this.showMessage('Cannot create valid contract offer', true);
      return;
    }
    
    if (signPlayer(player, team, offer, state)) {
      this.showMessage(`Signed ${player.firstName} ${player.lastName}!`);
    } else {
      this.showMessage('Could not sign player', true);
    }
    
    this.render();
  }

  private showMessage(message: string, isError: boolean = false): void {
    let toast = document.getElementById('gm-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'gm-toast';
      document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.className = `gm-toast show ${isError ? 'error' : 'success'}`;
    
    setTimeout(() => {
      toast!.classList.remove('show');
    }, 3000);
  }
}
