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
import { 
  ExtendedCoach, generateCoachMarket, generateAssistantCoach, hireCoach, fireCoach,
  calculateCoachImpact, CoachingStaff, AssistantCoach
} from './systems/CoachingSystem';
import {
  TeamPhilosophy, RotationSettings, Playbook, TeamIdentity,
  calculatePlayerFit, calculateTeamFit, PlayerSystemFit
} from './systems/TeamStrategy';
import {
  EXPANSION_CITIES, TEAM_NAME_SUGGESTIONS, COLOR_PRESETS,
  ExpansionCity, ExpansionTeamConfig, ExpansionDraftState,
  calculateExpansionFee, createExpansionTeam, initializeExpansionDraft,
  selectExpansionPlayer, autoSelectExpansionPlayer, fillExpansionRoster,
  determineExpansionDivision, validateExpansionConfig, generateExpansionTeamId
} from './systems/ExpansionSystem';

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
  
  private expansionState: {
    phase: 'create' | 'draft' | 'complete';
    config: Partial<ExpansionTeamConfig>;
    draftState: ExpansionDraftState | null;
    newTeam: Team | null;
  } = {
    phase: 'create',
    config: {},
    draftState: null,
    newTeam: null
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
      { id: 'coaching', label: 'Coaching', icon: '🎓' },
      { id: 'strategy', label: 'Strategy', icon: '📋' },
      { id: 'trade', label: 'Trade', icon: '🔄' },
      { id: 'freeAgency', label: 'Free Agency', icon: '📝' },
      { id: 'draft', label: 'Draft', icon: '🎯' },
      { id: 'standings', label: 'Standings', icon: '📆' },
      { id: 'playoffs', label: 'Playoffs', icon: '🏆' },
      { id: 'schedule', label: 'Schedule', icon: '📅' },
      { id: 'finances', label: 'Finances', icon: '💰' },
      { id: 'allstar', label: 'All-Star', icon: '⭐' },
      { id: 'awards', label: 'Awards', icon: '🏅' },
      { id: 'expansion', label: 'Expansion', icon: '🏗️' }
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
      case 'coaching': return this.renderCoaching();
      case 'strategy': return this.renderStrategy();
      case 'trade': return this.renderTrade();
      case 'freeAgency': return this.renderFreeAgency();
      case 'draft': return this.renderDraft();
      case 'standings': return this.renderStandings();
      case 'playoffs': return this.renderPlayoffs();
      case 'schedule': return this.renderSchedule();
      case 'finances': return this.renderFinances();
      case 'allstar': return this.renderAllStar();
      case 'awards': return this.renderAwards();
      case 'expansion': return this.renderExpansion();
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

  // ==================== PLAYOFFS ====================
  private renderPlayoffs(): string {
    const state = this.engine.getState();
    const playoffStatus = this.engine.getPlayoffStatus();
    
    if (state.currentSeason.phase !== 'playoffs' && !state.currentSeason.playoffs) {
      return `
        <div class="playoffs-section">
          <div class="playoffs-waiting">
            <h2>🏆 NBA Playoffs</h2>
            <div class="waiting-content">
              <div class="trophy-icon">🏆</div>
              <p>The playoffs have not started yet.</p>
              <p class="sub-text">Complete the regular season to begin the journey to the championship.</p>
              ${state.currentSeason.phase === 'regular' ? `
                <div class="season-progress">
                  <div class="progress-bar-large">
                    <div class="progress-fill" style="width: ${this.engine.getSeasonProgress().percent}%"></div>
                  </div>
                  <p>${this.engine.getSeasonProgress().percent}% of regular season complete</p>
                </div>
                <button class="btn btn-primary btn-lg" id="sim-to-playoffs">⏩ Simulate to Playoffs</button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }
    
    return `
      <div class="playoffs-section">
        <div class="playoffs-header">
          <h2>🏆 NBA Playoffs ${state.currentSeason.year}</h2>
          <div class="playoff-round-indicator">
            <span class="current-round">${playoffStatus.currentRoundName}</span>
          </div>
        </div>
        
        ${playoffStatus.champion ? `
          <div class="champion-banner">
            <div class="champion-trophy">🏆</div>
            <h3>${playoffStatus.champion.name}</h3>
            <p>NBA CHAMPIONS</p>
          </div>
        ` : ''}
        
        <div class="playoff-bracket">
          ${this.renderBracketColumn('Eastern Conference', playoffStatus.matchups.filter(m => m.conference === 'Eastern'), state)}
          ${this.renderFinalsColumn(playoffStatus.matchups.filter(m => m.conference === 'Finals'), state)}
          ${this.renderBracketColumn('Western Conference', playoffStatus.matchups.filter(m => m.conference === 'Western'), state)}
        </div>
        
        <div class="playoffs-actions">
          ${!playoffStatus.champion ? `
            <button class="btn btn-primary" id="sim-playoff-game">▶ Sim Next Game</button>
            <button class="btn btn-secondary" id="sim-playoff-round">⏩ Sim Round</button>
            <button class="btn btn-accent" id="sim-all-playoffs">🏆 Sim All Playoffs</button>
          ` : `
            <button class="btn btn-primary" id="end-season-btn">Continue to Offseason</button>
          `}
        </div>
      </div>
    `;
  }
  
  private renderBracketColumn(title: string, matchups: any[], state: any): string {
    const round1 = matchups.filter(m => m.round === 1);
    const round2 = matchups.filter(m => m.round === 2);
    const round3 = matchups.filter(m => m.round === 3);
    
    return `
      <div class="bracket-column">
        <h3 class="conference-title">${title}</h3>
        <div class="bracket-rounds">
          <div class="bracket-round round-1">
            <div class="round-label">First Round</div>
            ${round1.map(m => this.renderMatchupCard(m, state)).join('')}
          </div>
          <div class="bracket-round round-2">
            <div class="round-label">Conf. Semis</div>
            ${round2.length > 0 ? round2.map(m => this.renderMatchupCard(m, state)).join('') : this.renderEmptyMatchups(2)}
          </div>
          <div class="bracket-round round-3">
            <div class="round-label">Conf. Finals</div>
            ${round3.length > 0 ? round3.map(m => this.renderMatchupCard(m, state)).join('') : this.renderEmptyMatchups(1)}
          </div>
        </div>
      </div>
    `;
  }
  
  private renderFinalsColumn(matchups: any[], state: any): string {
    const finals = matchups.filter(m => m.round === 4);
    
    return `
      <div class="bracket-column finals-column">
        <h3 class="conference-title">NBA Finals</h3>
        <div class="finals-matchup-container">
          ${finals.length > 0 ? finals.map(m => this.renderMatchupCard(m, state, true)).join('') : this.renderEmptyMatchups(1, true)}
        </div>
      </div>
    `;
  }
  
  private renderMatchupCard(matchup: any, state: any, isFinals: boolean = false): string {
    const team1 = state.teams[matchup.team1.id];
    const team2 = state.teams[matchup.team2.id];
    const userTeamId = state.userTeamId;
    const isComplete = !!matchup.winner;
    
    return `
      <div class="matchup-card ${isFinals ? 'finals-matchup' : ''} ${isComplete ? 'complete' : 'active'}">
        <div class="matchup-team ${matchup.team1.id === userTeamId ? 'user-team' : ''} ${matchup.winner === matchup.team1.id ? 'winner' : ''}">
          <span class="seed">${matchup.team1.seed}</span>
          <span class="team-abbr" style="color: ${team1?.colors.primary || '#fff'}">${team1?.abbreviation || matchup.team1.id}</span>
          <span class="team-wins">${matchup.team1.wins}</span>
        </div>
        <div class="matchup-team ${matchup.team2.id === userTeamId ? 'user-team' : ''} ${matchup.winner === matchup.team2.id ? 'winner' : ''}">
          <span class="seed">${matchup.team2.seed}</span>
          <span class="team-abbr" style="color: ${team2?.colors.primary || '#fff'}">${team2?.abbreviation || matchup.team2.id}</span>
          <span class="team-wins">${matchup.team2.wins}</span>
        </div>
        ${isComplete ? `<div class="series-status">Final</div>` : `<div class="series-status">Game ${matchup.games + 1}</div>`}
      </div>
    `;
  }
  
  private renderEmptyMatchups(count: number, isFinals: boolean = false): string {
    let html = '';
    for (let i = 0; i < count; i++) {
      html += `
        <div class="matchup-card ${isFinals ? 'finals-matchup' : ''} pending">
          <div class="matchup-team pending">
            <span class="seed">-</span>
            <span class="team-abbr">TBD</span>
            <span class="team-wins">-</span>
          </div>
          <div class="matchup-team pending">
            <span class="seed">-</span>
            <span class="team-abbr">TBD</span>
            <span class="team-wins">-</span>
          </div>
          <div class="series-status">Waiting</div>
        </div>
      `;
    }
    return html;
  }

  // ==================== ALL-STAR ====================
  private renderAllStar(): string {
    const allStarDisplay = this.engine.getAllStarDisplay();
    
    if (!allStarDisplay) {
      return `
        <div class="allstar-section">
          <div class="allstar-waiting">
            <h2>⭐ NBA All-Star Game</h2>
            <div class="waiting-content">
              <div class="star-icon">⭐</div>
              <p>The All-Star Game hasn't happened yet this season.</p>
              <p class="sub-text">The All-Star break occurs at the midpoint of the regular season (around 45-50% complete).</p>
              <div class="season-progress">
                <div class="progress-bar-large">
                  <div class="progress-fill" style="width: ${this.engine.getSeasonProgress().percent}%"></div>
                </div>
                <p>${this.engine.getSeasonProgress().percent}% of regular season complete</p>
              </div>
            </div>
          </div>
        </div>
      `;
    }
    
    return `
      <div class="allstar-section">
        <div class="allstar-header">
          <h2>⭐ NBA All-Star Game ${allStarDisplay.year}</h2>
          ${allStarDisplay.gameComplete ? `
            <div class="allstar-score">
              <span class="team-score east">${allStarDisplay.east.teamName}: ${allStarDisplay.east.score}</span>
              <span class="vs">vs</span>
              <span class="team-score west">${allStarDisplay.west.teamName}: ${allStarDisplay.west.score}</span>
            </div>
          ` : ''}
        </div>
        
        ${allStarDisplay.mvp ? `
          <div class="allstar-mvp">
            <div class="mvp-badge">⭐ All-Star MVP</div>
            <div class="mvp-name">${allStarDisplay.mvp.name}</div>
            <div class="mvp-team">${allStarDisplay.mvp.teamName}</div>
          </div>
        ` : ''}
        
        <div class="allstar-rosters">
          ${this.renderAllStarTeam(allStarDisplay.east, 'East')}
          ${this.renderAllStarTeam(allStarDisplay.west, 'West')}
        </div>
      </div>
    `;
  }
  
  private renderAllStarTeam(team: any, label: string): string {
    return `
      <div class="allstar-team ${label.toLowerCase()}">
        <div class="allstar-team-header">
          <h3>${label}ern Conference</h3>
          <p class="coach">Coach: ${team.coach}</p>
        </div>
        
        <div class="allstar-starters">
          <h4>Starters</h4>
          ${team.starters.map((p: any) => `
            <div class="allstar-player starter">
              <span class="player-ovr ${this.getRatingClass(p.overall)}">${p.overall}</span>
              <div class="player-info">
                <span class="player-name">${p.name}</span>
                <span class="player-team">${p.team} • ${p.position}</span>
              </div>
              <div class="player-stats">
                <span>${p.ppg} PPG</span>
                <span>${p.rpg} RPG</span>
                <span>${p.apg} APG</span>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="allstar-reserves">
          <h4>Reserves</h4>
          ${team.reserves.map((p: any) => `
            <div class="allstar-player reserve">
              <span class="player-ovr ${this.getRatingClass(p.overall)}">${p.overall}</span>
              <div class="player-info">
                <span class="player-name">${p.name}</span>
                <span class="player-team">${p.team} • ${p.position}</span>
              </div>
              <div class="player-stats">
                <span>${p.ppg} PPG</span>
                <span>${p.rpg} RPG</span>
                <span>${p.apg} APG</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ==================== AWARDS ====================
  private renderAwards(): string {
    const state = this.engine.getState();
    const leaders = this.engine.getLeaders();
    const awardWinners = this.engine.getAwardWinners();
    const championships = this.engine.getChampionshipHistory();
    
    return `
      <div class="awards-section">
        <h2>🏅 Awards & League Leaders</h2>
        
        <!-- Major Awards -->
        <div class="major-awards">
          <h3>Season Awards ${state.currentSeason.year}</h3>
          <div class="awards-grid">
            ${this.renderAwardCard('MVP', awardWinners['MVP']?.[0]?.player, state)}
            ${this.renderAwardCard('DPOY', awardWinners['DPOY']?.[0]?.player, state)}
            ${this.renderAwardCard('ROY', awardWinners['ROY']?.[0]?.player, state)}
            ${this.renderAwardCard('6MOY', awardWinners['SMOY']?.[0]?.player, state)}
            ${this.renderAwardCard('Finals MVP', awardWinners['FMVP']?.[0]?.player, state)}
          </div>
        </div>
        
        <!-- All-NBA Teams -->
        <div class="all-nba-section">
          <h3>All-NBA Teams</h3>
          <div class="all-nba-grid">
            ${this.renderAllNBATeam('1st Team', awardWinners['All-NBA-1st'], state)}
            ${this.renderAllNBATeam('2nd Team', awardWinners['All-NBA-2nd'], state)}
            ${this.renderAllNBATeam('3rd Team', awardWinners['All-NBA-3rd'], state)}
          </div>
        </div>
        
        <!-- Stat Leaders -->
        <div class="stat-leaders">
          <h3>Statistical Leaders</h3>
          <div class="leaders-grid">
            <div class="leader-category">
              <h4>Points Per Game</h4>
              ${this.renderLeadersList(leaders.points)}
            </div>
            <div class="leader-category">
              <h4>Rebounds Per Game</h4>
              ${this.renderLeadersList(leaders.rebounds)}
            </div>
            <div class="leader-category">
              <h4>Assists Per Game</h4>
              ${this.renderLeadersList(leaders.assists)}
            </div>
            <div class="leader-category">
              <h4>Steals Per Game</h4>
              ${this.renderLeadersList(leaders.steals)}
            </div>
            <div class="leader-category">
              <h4>Blocks Per Game</h4>
              ${this.renderLeadersList(leaders.blocks)}
            </div>
          </div>
        </div>
        
        <!-- Championship History -->
        ${championships.length > 0 ? `
          <div class="championship-history">
            <h3>🏆 Championship History</h3>
            <div class="championship-list">
              ${championships.slice(0, 10).map(c => `
                <div class="championship-item">
                  <span class="champ-year">${c.year}</span>
                  <span class="champ-team" style="color: ${c.team.colors.primary}">${c.team.city} ${c.team.name}</span>
                  ${c.fmvp ? `<span class="champ-fmvp">FMVP: ${c.fmvp.firstName} ${c.fmvp.lastName}</span>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
  
  private renderAwardCard(title: string, player: Player | undefined, state: any): string {
    if (!player) {
      return `
        <div class="award-card pending">
          <div class="award-title">${title}</div>
          <div class="award-pending">TBD</div>
          <p class="award-note">Announced at season end</p>
        </div>
      `;
    }
    
    const team = player.teamId ? state.teams[player.teamId] : null;
    const stats = player.seasonStats[state.currentSeason.year];
    const ppg = stats ? (stats.points / stats.gamesPlayed).toFixed(1) : '0.0';
    const rpg = stats ? (stats.rebounds / stats.gamesPlayed).toFixed(1) : '0.0';
    const apg = stats ? (stats.assists / stats.gamesPlayed).toFixed(1) : '0.0';
    
    return `
      <div class="award-card won">
        <div class="award-title">${title}</div>
        <div class="award-winner">
          <span class="winner-ovr ${this.getRatingClass(player.stats.overall)}">${player.stats.overall}</span>
          <div class="winner-info">
            <span class="winner-name">${player.firstName} ${player.lastName}</span>
            <span class="winner-team">${team?.city || ''} ${team?.name || ''}</span>
          </div>
        </div>
        <div class="winner-stats">${ppg} PPG | ${rpg} RPG | ${apg} APG</div>
      </div>
    `;
  }
  
  private renderAllNBATeam(teamName: string, players: { player: Player }[] | undefined, state: any): string {
    if (!players || players.length === 0) {
      return `
        <div class="all-nba-team pending">
          <h4>${teamName}</h4>
          <p class="pending-text">Selected at season end</p>
        </div>
      `;
    }
    
    return `
      <div class="all-nba-team">
        <h4>${teamName}</h4>
        <div class="team-players">
          ${players.map(({ player }) => {
            const team = player.teamId ? state.teams[player.teamId] : null;
            return `
              <div class="all-nba-player">
                <span class="player-ovr ${this.getRatingClass(player.stats.overall)}">${player.stats.overall}</span>
                <span class="player-name">${player.firstName} ${player.lastName}</span>
                <span class="player-pos">${player.position}</span>
              </div>
            `;
          }).join('')}
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

  // ==================== COACHING ====================
  private renderCoaching(): string {
    const team = this.engine.getUserTeam();
    const state = this.engine.getState();
    const strategy = team.strategy;
    const coachingStaff = strategy?.coachingStaff;
    const headCoach = coachingStaff?.headCoach as ExtendedCoach | undefined;
    
    if (!headCoach) {
      return '<div class="coaching-section"><p>No coaching data available</p></div>';
    }
    
    const roster = team.roster.map(id => state.players[id]).filter(Boolean);
    const coachImpact = coachingStaff ? calculateCoachImpact(headCoach, coachingStaff.assistants, roster) : null;
    
    return `
      <div class="coaching-section">
        <div class="coach-header">
          <h2>🎓 Coaching Staff</h2>
        </div>
        
        <!-- Head Coach -->
        <div class="coach-card head-coach">
          <div class="coach-info">
            <h3>Head Coach</h3>
            <div class="coach-name">${headCoach.name}</div>
            <div class="coach-meta">Age ${headCoach.age} | ${headCoach.ratings?.experienceYears || 0} years experience</div>
            ${headCoach.ratings?.championships ? `<div class="coach-rings">🏆 × ${headCoach.ratings.championships}</div>` : ''}
          </div>
          
          <div class="coach-ratings">
            <h4>Ratings</h4>
            <div class="rating-grid">
              <div class="rating-item">
                <span class="rating-label">Offense</span>
                <div class="rating-bar">
                  <div class="rating-fill" style="width: ${headCoach.ratings?.offense || 50}%"></div>
                </div>
                <span class="rating-value">${headCoach.ratings?.offense || 50}</span>
              </div>
              <div class="rating-item">
                <span class="rating-label">Defense</span>
                <div class="rating-bar">
                  <div class="rating-fill" style="width: ${headCoach.ratings?.defense || 50}%"></div>
                </div>
                <span class="rating-value">${headCoach.ratings?.defense || 50}</span>
              </div>
              <div class="rating-item">
                <span class="rating-label">Development</span>
                <div class="rating-bar">
                  <div class="rating-fill" style="width: ${headCoach.ratings?.playerDevelopment || 50}%"></div>
                </div>
                <span class="rating-value">${headCoach.ratings?.playerDevelopment || 50}</span>
              </div>
              <div class="rating-item">
                <span class="rating-label">Game Mgmt</span>
                <div class="rating-bar">
                  <div class="rating-fill" style="width: ${headCoach.ratings?.gameManagement || 50}%"></div>
                </div>
                <span class="rating-value">${headCoach.ratings?.gameManagement || 50}</span>
              </div>
              <div class="rating-item">
                <span class="rating-label">Motivation</span>
                <div class="rating-bar">
                  <div class="rating-fill" style="width: ${headCoach.ratings?.motivation || 50}%"></div>
                </div>
                <span class="rating-value">${headCoach.ratings?.motivation || 50}</span>
              </div>
              <div class="rating-item">
                <span class="rating-label">Recruiting</span>
                <div class="rating-bar">
                  <div class="rating-fill" style="width: ${headCoach.ratings?.recruiting || 50}%"></div>
                </div>
                <span class="rating-value">${headCoach.ratings?.recruiting || 50}</span>
              </div>
            </div>
          </div>
          
          <div class="coach-traits">
            <h4>Traits</h4>
            <div class="trait-list">
              ${(headCoach.traits || []).map(trait => `
                <span class="trait-badge">${this.formatTrait(trait)}</span>
              `).join('')}
            </div>
          </div>
          
          <div class="coach-style">
            <h4>Preferred Style</h4>
            <p><strong>Offense:</strong> ${this.formatSystem(headCoach.preferredOffense)}</p>
            <p><strong>Defense:</strong> ${this.formatScheme(headCoach.preferredDefense)}</p>
            <p><strong>Pace:</strong> ${this.formatPace(headCoach.preferredPace)}</p>
          </div>
          
          <div class="coach-contract">
            <h4>Contract</h4>
            <p>$${((headCoach.contract?.salary || 0) / 1000000).toFixed(1)}M / ${headCoach.contract?.years || 0} years</p>
            <p class="buyout">Buyout: $${((headCoach.contract?.buyout || 0) / 1000000).toFixed(1)}M</p>
          </div>
          
          <div class="coach-actions">
            <button class="btn btn-secondary" id="extend-coach">Extend Contract</button>
            <button class="btn btn-danger" id="fire-coach">Fire Coach</button>
          </div>
        </div>
        
        ${coachImpact ? `
          <div class="coach-impact">
            <h3>Coaching Impact</h3>
            <div class="impact-grid">
              <div class="impact-item ${coachImpact.offensiveBonus >= 0 ? 'positive' : 'negative'}">
                <span class="impact-value">${coachImpact.offensiveBonus >= 0 ? '+' : ''}${coachImpact.offensiveBonus}</span>
                <span class="impact-label">Offensive Rating</span>
              </div>
              <div class="impact-item ${coachImpact.defensiveBonus >= 0 ? 'positive' : 'negative'}">
                <span class="impact-value">${coachImpact.defensiveBonus >= 0 ? '+' : ''}${coachImpact.defensiveBonus}</span>
                <span class="impact-label">Defensive Rating</span>
              </div>
              <div class="impact-item ${coachImpact.developmentBonus >= 0 ? 'positive' : 'negative'}">
                <span class="impact-value">${coachImpact.developmentBonus >= 0 ? '+' : ''}${coachImpact.developmentBonus}%</span>
                <span class="impact-label">Player Development</span>
              </div>
              <div class="impact-item ${coachImpact.moraleBonus >= 0 ? 'positive' : 'negative'}">
                <span class="impact-value">${coachImpact.moraleBonus >= 0 ? '+' : ''}${coachImpact.moraleBonus}</span>
                <span class="impact-label">Team Morale</span>
              </div>
            </div>
          </div>
        ` : ''}
        
        <!-- Assistant Coaches -->
        <div class="assistants-section">
          <h3>Assistant Coaches (${coachingStaff?.assistants.length || 0}/${coachingStaff?.maxAssistants || 6})</h3>
          <div class="assistant-grid">
            ${(coachingStaff?.assistants || []).map(assistant => `
              <div class="assistant-card">
                <div class="assistant-name">${assistant.name}</div>
                <div class="assistant-specialty">${this.formatSpecialty(assistant.specialty)}</div>
                <div class="assistant-rating">Rating: ${assistant.rating}</div>
                <div class="assistant-salary">$${(assistant.salary / 1000000).toFixed(1)}M/yr</div>
                ${assistant.potentialHeadCoach ? '<span class="hc-potential">⭐ HC Potential</span>' : ''}
                <button class="btn btn-sm btn-danger" data-action="fire-assistant" data-id="${assistant.id}">Fire</button>
              </div>
            `).join('')}
            ${(coachingStaff?.assistants.length || 0) < (coachingStaff?.maxAssistants || 6) ? `
              <div class="assistant-card add-new">
                <button class="btn btn-primary" id="hire-assistant">+ Hire Assistant</button>
              </div>
            ` : ''}
          </div>
        </div>
        
        <!-- Coach Market -->
        <div class="coach-market">
          <h3>Available Coaches</h3>
          <button class="btn btn-secondary" id="view-coach-market">Browse Coach Market</button>
        </div>
      </div>
    `;
  }

  // ==================== STRATEGY ====================
  private renderStrategy(): string {
    const team = this.engine.getUserTeam();
    const state = this.engine.getState();
    const strategy = team.strategy;
    const philosophy = strategy?.philosophy;
    const rotation = strategy?.rotation;
    const identity = strategy?.identity;
    const headCoach = strategy?.coachingStaff?.headCoach as ExtendedCoach | undefined;
    
    if (!philosophy) {
      return '<div class="strategy-section"><p>No strategy data available</p></div>';
    }
    
    const roster = team.roster.map(id => state.players[id]).filter(Boolean);
    const teamFit = headCoach ? calculateTeamFit(roster, philosophy, headCoach) : null;
    
    return `
      <div class="strategy-section">
        <h2>📋 Team Strategy & Philosophy</h2>
        
        <!-- Offensive System -->
        <div class="strategy-card">
          <h3>⚔️ Offensive System</h3>
          <div class="system-selector">
            <select id="offensive-system" class="system-select">
              <option value="motion" ${philosophy.offensiveSystem === 'motion' ? 'selected' : ''}>Motion Offense</option>
              <option value="iso-heavy" ${philosophy.offensiveSystem === 'iso-heavy' ? 'selected' : ''}>Isolation Heavy</option>
              <option value="pick-and-roll" ${philosophy.offensiveSystem === 'pick-and-roll' ? 'selected' : ''}>Pick & Roll</option>
              <option value="pace-and-space" ${philosophy.offensiveSystem === 'pace-and-space' ? 'selected' : ''}>Pace & Space</option>
              <option value="post-up" ${philosophy.offensiveSystem === 'post-up' ? 'selected' : ''}>Post-Up</option>
              <option value="princeton" ${philosophy.offensiveSystem === 'princeton' ? 'selected' : ''}>Princeton</option>
              <option value="triangle" ${philosophy.offensiveSystem === 'triangle' ? 'selected' : ''}>Triangle</option>
              <option value="balanced" ${philosophy.offensiveSystem === 'balanced' ? 'selected' : ''}>Balanced</option>
            </select>
            <p class="system-description">${this.getSystemDescription(philosophy.offensiveSystem)}</p>
          </div>
        </div>
        
        <!-- Defensive Scheme -->
        <div class="strategy-card">
          <h3>🛡️ Defensive Scheme</h3>
          <div class="system-selector">
            <select id="defensive-scheme" class="system-select">
              <option value="man-to-man" ${philosophy.defensiveScheme === 'man-to-man' ? 'selected' : ''}>Man-to-Man</option>
              <option value="zone-2-3" ${philosophy.defensiveScheme === 'zone-2-3' ? 'selected' : ''}>2-3 Zone</option>
              <option value="zone-3-2" ${philosophy.defensiveScheme === 'zone-3-2' ? 'selected' : ''}>3-2 Zone</option>
              <option value="switch-everything" ${philosophy.defensiveScheme === 'switch-everything' ? 'selected' : ''}>Switch Everything</option>
              <option value="drop-coverage" ${philosophy.defensiveScheme === 'drop-coverage' ? 'selected' : ''}>Drop Coverage</option>
              <option value="aggressive-blitz" ${philosophy.defensiveScheme === 'aggressive-blitz' ? 'selected' : ''}>Aggressive Blitz</option>
              <option value="pack-the-paint" ${philosophy.defensiveScheme === 'pack-the-paint' ? 'selected' : ''}>Pack the Paint</option>
            </select>
            <p class="system-description">${this.getSchemeDescription(philosophy.defensiveScheme)}</p>
          </div>
        </div>
        
        <!-- Pace & Style -->
        <div class="strategy-card">
          <h3>⏱️ Pace & Style</h3>
          <div class="pace-slider">
            <label>Tempo</label>
            <input type="range" id="pace-setting" min="0" max="4" 
                   value="${['slowest', 'slow', 'moderate', 'fast', 'fastest'].indexOf(philosophy.pace)}" 
                   class="slider">
            <div class="pace-labels">
              <span>Slowest</span>
              <span>Slow</span>
              <span>Moderate</span>
              <span>Fast</span>
              <span>Fastest</span>
            </div>
          </div>
          
          <div class="priority-sliders">
            <div class="priority-item">
              <label>3-Point Focus</label>
              <input type="range" id="priority-3pt" min="0" max="100" value="${philosophy.priorities.threePointShooting}" class="slider">
              <span>${philosophy.priorities.threePointShooting}%</span>
            </div>
            <div class="priority-item">
              <label>Inside Paint</label>
              <input type="range" id="priority-paint" min="0" max="100" value="${philosophy.priorities.insidePaint}" class="slider">
              <span>${philosophy.priorities.insidePaint}%</span>
            </div>
            <div class="priority-item">
              <label>Fast Break</label>
              <input type="range" id="priority-fastbreak" min="0" max="100" value="${philosophy.priorities.fastBreak}" class="slider">
              <span>${philosophy.priorities.fastBreak}%</span>
            </div>
          </div>
        </div>
        
        <!-- Development Philosophy -->
        <div class="strategy-card">
          <h3>📈 Development Philosophy</h3>
          <div class="philosophy-buttons">
            <button class="phil-btn ${philosophy.developmentFocus === 'win-now' ? 'active' : ''}" data-focus="win-now">
              🏆 Win Now
              <small>Play veterans, maximize current roster</small>
            </button>
            <button class="phil-btn ${philosophy.developmentFocus === 'balanced' ? 'active' : ''}" data-focus="balanced">
              ⚖️ Balanced
              <small>Mix of development and winning</small>
            </button>
            <button class="phil-btn ${philosophy.developmentFocus === 'develop-youth' ? 'active' : ''}" data-focus="develop-youth">
              🌱 Develop Youth
              <small>Prioritize young player minutes</small>
            </button>
            <button class="phil-btn ${philosophy.developmentFocus === 'rebuild' ? 'active' : ''}" data-focus="rebuild">
              🔄 Rebuild
              <small>Full youth movement</small>
            </button>
          </div>
        </div>
        
        <!-- Rotation Settings -->
        <div class="strategy-card">
          <h3>🔄 Rotation Settings</h3>
          <div class="rotation-controls">
            <div class="rotation-item">
              <label>Rotation Depth</label>
              <input type="range" id="bench-depth" min="8" max="12" value="${philosophy.benchDepth}" class="slider">
              <span>${philosophy.benchDepth} players</span>
            </div>
            <div class="rotation-item">
              <label>Star Usage Rate</label>
              <input type="range" id="star-usage" min="20" max="40" value="${philosophy.starUsageRate}" class="slider">
              <span>${philosophy.starUsageRate}%</span>
            </div>
          </div>
          
          <div class="load-management">
            <h4>Load Management</h4>
            <label class="toggle">
              <input type="checkbox" id="load-mgmt-enabled" ${rotation?.loadManagement.enabled ? 'checked' : ''}>
              <span>Enable Load Management</span>
            </label>
            ${rotation?.loadManagement.enabled ? `
              <div class="load-options">
                <label>
                  Rest games per month:
                  <input type="number" id="rest-games" value="${rotation.loadManagement.restGamesPerMonth}" min="0" max="4">
                </label>
                <label class="toggle">
                  <input type="checkbox" id="b2b-rest" ${rotation.loadManagement.backToBackRest ? 'checked' : ''}>
                  <span>Rest on back-to-backs</span>
                </label>
                <label>
                  Minutes limit:
                  <input type="number" id="minutes-limit" value="${rotation.loadManagement.minutesLimit}" min="28" max="40">
                </label>
              </div>
            ` : ''}
          </div>
        </div>
        
        <!-- Team Identity -->
        ${identity ? `
          <div class="strategy-card identity-card">
            <h3>🏛️ Team Identity</h3>
            <div class="identity-info">
              <p><strong>Established:</strong> ${identity.establishedYears} years</p>
              <p><strong>Offensive Identity:</strong> ${this.formatIdentity(identity.offensiveIdentity)}</p>
              <p><strong>Defensive Identity:</strong> ${this.formatIdentity(identity.defensiveIdentity)}</p>
              <p><strong>Culture:</strong> ${this.formatCulture(identity.culture)}</p>
            </div>
            <div class="reputation-grid">
              <div class="rep-item">
                <span class="rep-label">Offense Rank</span>
                <span class="rep-value">#${identity.leaguePerception.offensiveRanking}</span>
              </div>
              <div class="rep-item">
                <span class="rep-label">Defense Rank</span>
                <span class="rep-value">#${identity.leaguePerception.defensiveRanking}</span>
              </div>
              <div class="rep-item">
                <span class="rep-label">Clutch Rating</span>
                <span class="rep-value">${identity.leaguePerception.clutchRating}</span>
              </div>
              <div class="rep-item">
                <span class="rep-label">Home Court</span>
                <span class="rep-value">${identity.leaguePerception.homeCourtAdvantage}</span>
              </div>
            </div>
            ${identity.knownFor.length > 0 ? `
              <div class="known-for">
                <strong>Known For:</strong>
                ${identity.knownFor.map(k => `<span class="known-tag">${k}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        ` : ''}
        
        <!-- Player Fit Analysis -->
        ${teamFit ? `
          <div class="strategy-card fit-analysis">
            <h3>🧩 System Fit Analysis</h3>
            <div class="fit-summary">
              <div class="fit-score">
                <span class="score-value ${teamFit.averageFit >= 60 ? 'good' : teamFit.averageFit >= 45 ? 'okay' : 'poor'}">${teamFit.averageFit}</span>
                <span class="score-label">Average Team Fit</span>
              </div>
            </div>
            
            <div class="fit-columns">
              <div class="fit-column">
                <h4>✅ Best Fits</h4>
                ${teamFit.bestFits.map(f => `
                  <div class="fit-player good">
                    <span class="player-name">${f.playerName}</span>
                    <span class="fit-value">${f.overallFit}</span>
                    <div class="fit-details">${f.playerStrengths.slice(0, 2).join(', ')}</div>
                  </div>
                `).join('')}
              </div>
              <div class="fit-column">
                <h4>❌ Worst Fits</h4>
                ${teamFit.worstFits.map(f => `
                  <div class="fit-player poor">
                    <span class="player-name">${f.playerName}</span>
                    <span class="fit-value">${f.overallFit}</span>
                    <div class="fit-details">${f.gaps.slice(0, 2).join(', ')}</div>
                  </div>
                `).join('')}
              </div>
            </div>
            
            ${teamFit.recommendations.length > 0 ? `
              <div class="fit-recommendations">
                <h4>💡 Recommendations</h4>
                <ul>
                  ${teamFit.recommendations.map(r => `<li>${r}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        ` : ''}
        
        <div class="strategy-actions">
          <button class="btn btn-primary" id="save-strategy">Save Changes</button>
          <button class="btn btn-secondary" id="reset-strategy">Reset to Defaults</button>
        </div>
      </div>
    `;
  }

  // Helper formatting methods
  private formatTrait(trait: string): string {
    return trait.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  private formatSystem(system: string): string {
    const names: Record<string, string> = {
      'motion': 'Motion Offense',
      'iso-heavy': 'Isolation Heavy',
      'pick-and-roll': 'Pick & Roll',
      'pace-and-space': 'Pace & Space',
      'post-up': 'Post-Up',
      'princeton': 'Princeton Offense',
      'triangle': 'Triangle Offense',
      'balanced': 'Balanced'
    };
    return names[system] || system;
  }

  private formatScheme(scheme: string): string {
    const names: Record<string, string> = {
      'man-to-man': 'Man-to-Man',
      'zone-2-3': '2-3 Zone',
      'zone-3-2': '3-2 Zone',
      'switch-everything': 'Switch Everything',
      'drop-coverage': 'Drop Coverage',
      'aggressive-blitz': 'Aggressive Blitz',
      'pack-the-paint': 'Pack the Paint'
    };
    return names[scheme] || scheme;
  }

  private formatPace(pace: string): string {
    const names: Record<string, string> = {
      'fastest': 'Fastest (105+ possessions)',
      'fast': 'Fast (100-105)',
      'moderate': 'Moderate (95-100)',
      'slow': 'Slow (90-95)',
      'slowest': 'Slowest (<90)'
    };
    return names[pace] || pace;
  }

  private formatSpecialty(specialty: string): string {
    const names: Record<string, string> = {
      'offense': '⚔️ Offense',
      'defense': '🛡️ Defense',
      'player-development': '📈 Player Development',
      'analytics': '📊 Analytics',
      'shooting': '🎯 Shooting'
    };
    return names[specialty] || specialty;
  }

  private formatIdentity(identity: string): string {
    return identity.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  private formatCulture(culture: string): string {
    return culture.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  private getSystemDescription(system: string): string {
    const descriptions: Record<string, string> = {
      'motion': 'Ball movement, cutting, and off-ball screens. Requires high basketball IQ.',
      'iso-heavy': 'Let your stars create. Works best with elite scorers.',
      'pick-and-roll': 'PnR heavy offense. Need a good ball handler and rolling big.',
      'pace-and-space': 'Modern 3-point focused offense. Spread the floor, shoot threes.',
      'post-up': 'Inside-out offense. Feed the post, kick for threes.',
      'princeton': 'Backdoor cuts and misdirection. Requires discipline and execution.',
      'triangle': 'Classic triangle offense. Versatile but complex.',
      'balanced': 'Mix of everything. Adaptable but no clear identity.'
    };
    return descriptions[system] || '';
  }

  private getSchemeDescription(scheme: string): string {
    const descriptions: Record<string, string> = {
      'man-to-man': 'Traditional defense. Each player guards one opponent.',
      'zone-2-3': 'Two up top, three along the baseline. Protects paint.',
      'zone-3-2': 'Three up top, two down low. Guards perimeter better.',
      'switch-everything': 'Switch all screens. Requires versatile defenders.',
      'drop-coverage': 'Big drops back on PnR. Gives up mid-range.',
      'aggressive-blitz': 'Trap and gamble for steals. High risk, high reward.',
      'pack-the-paint': 'Protect the rim, give up threes. Need shot blockers.'
    };
    return descriptions[scheme] || '';
  }

  // ==================== EXPANSION ====================
  private renderExpansion(): string {
    const state = this.engine.getState();
    
    if (this.expansionState.phase === 'draft' && this.expansionState.draftState) {
      return this.renderExpansionDraft();
    }
    
    if (this.expansionState.phase === 'complete' && this.expansionState.newTeam) {
      return this.renderExpansionComplete();
    }
    
    // Default: Create expansion team form
    return `
      <div class="expansion-section">
        <div class="expansion-header">
          <h2>🏗️ Create Expansion Team</h2>
          <p>Add a new franchise to the league. Build from scratch and compete!</p>
        </div>
        
        <div class="expansion-form">
          <!-- City Selection -->
          <div class="expansion-card">
            <h3>📍 Choose Your City</h3>
            <div class="city-grid">
              ${EXPANSION_CITIES.map(city => `
                <div class="city-option ${this.expansionState.config.city?.name === city.name ? 'selected' : ''}" 
                     data-city="${city.name}">
                  <div class="city-name">${city.name}, ${city.state}</div>
                  <div class="city-meta">
                    <span class="market-badge ${city.market}">${city.market.toUpperCase()}</span>
                    ${city.hasNBAHistory ? '<span class="history-badge">📜 NBA History</span>' : ''}
                  </div>
                  <div class="city-details">
                    <span>Pop: ${(city.population / 1000000).toFixed(1)}M</span>
                    <span>Region: ${city.region}</span>
                  </div>
                  ${city.previousTeam ? `<div class="previous-team">Former: ${city.previousTeam}</div>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
          
          ${this.expansionState.config.city ? `
            <!-- Team Name -->
            <div class="expansion-card">
              <h3>🏀 Team Identity</h3>
              <div class="form-group">
                <label>Team Name</label>
                <input type="text" id="team-name" class="form-input" 
                       placeholder="e.g., SuperSonics, Knights, Aztecs"
                       value="${this.expansionState.config.teamName || ''}">
                <div class="name-suggestions">
                  <span class="suggestion-label">Suggestions:</span>
                  ${(TEAM_NAME_SUGGESTIONS[this.expansionState.config.city.name] || []).map(name => `
                    <button class="name-suggestion" data-name="${name}">${name}</button>
                  `).join('')}
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label>Abbreviation (3 letters)</label>
                  <input type="text" id="team-abbr" class="form-input abbr-input" 
                         maxlength="3" placeholder="SEA"
                         value="${this.expansionState.config.abbreviation || ''}">
                </div>
                <div class="form-group">
                  <label>Mascot (optional)</label>
                  <input type="text" id="team-mascot" class="form-input" 
                         placeholder="e.g., Squatch, Ace"
                         value="${this.expansionState.config.mascot || ''}">
                </div>
              </div>
            </div>
            
            <!-- Colors -->
            <div class="expansion-card">
              <h3>🎨 Team Colors</h3>
              <div class="color-presets">
                ${COLOR_PRESETS.map(preset => `
                  <div class="color-preset" data-preset='${JSON.stringify(preset)}'>
                    <div class="color-swatch" style="background: linear-gradient(135deg, ${preset.primary} 50%, ${preset.secondary} 50%)"></div>
                    <span>${preset.name}</span>
                  </div>
                `).join('')}
              </div>
              <div class="color-custom">
                <div class="form-group">
                  <label>Primary</label>
                  <input type="color" id="color-primary" value="${this.expansionState.config.colors?.primary || '#00653A'}">
                </div>
                <div class="form-group">
                  <label>Secondary</label>
                  <input type="color" id="color-secondary" value="${this.expansionState.config.colors?.secondary || '#FFC425'}">
                </div>
                <div class="form-group">
                  <label>Accent</label>
                  <input type="color" id="color-accent" value="${this.expansionState.config.colors?.accent || '#FFFFFF'}">
                </div>
              </div>
              ${this.expansionState.config.colors ? `
                <div class="color-preview">
                  <div class="preview-jersey" style="background: ${this.expansionState.config.colors.primary}; border-color: ${this.expansionState.config.colors.secondary}">
                    <span style="color: ${this.expansionState.config.colors.secondary}">${this.expansionState.config.abbreviation || 'XXX'}</span>
                  </div>
                </div>
              ` : ''}
            </div>
            
            <!-- Arena -->
            <div class="expansion-card">
              <h3>🏟️ Home Arena</h3>
              <div class="arena-options">
                ${(this.expansionState.config.city.arenaOptions || []).map(arena => `
                  <button class="arena-option ${this.expansionState.config.arena === arena ? 'selected' : ''}" 
                          data-arena="${arena}">${arena}</button>
                `).join('')}
              </div>
              <div class="form-group">
                <label>Or enter custom name:</label>
                <input type="text" id="custom-arena" class="form-input" 
                       placeholder="Custom Arena Name"
                       value="${this.expansionState.config.arena || ''}">
              </div>
            </div>
            
            <!-- Finances -->
            <div class="expansion-card">
              <h3>💰 Expansion Finances</h3>
              <div class="finance-preview">
                <div class="finance-item">
                  <span class="finance-label">Expansion Fee</span>
                  <span class="finance-value">$${(calculateExpansionFee(this.expansionState.config.city) / 1000000000).toFixed(2)}B</span>
                </div>
                <div class="finance-item">
                  <span class="finance-label">Market Size</span>
                  <span class="finance-value">${this.expansionState.config.city.market.toUpperCase()}</span>
                </div>
                <div class="finance-item">
                  <span class="finance-label">Initial Budget</span>
                  <span class="finance-value">$200M</span>
                </div>
              </div>
              
              <div class="form-group">
                <label>Ticket Price Strategy</label>
                <input type="range" id="ticket-price" class="slider" 
                       min="80" max="150" step="5" 
                       value="${(this.expansionState.config.ticketPriceMultiplier || 1) * 100}">
                <div class="range-labels">
                  <span>Budget (80%)</span>
                  <span>Standard</span>
                  <span>Premium (150%)</span>
                </div>
              </div>
            </div>
            
            <!-- Create Button -->
            <div class="expansion-actions">
              <button class="btn btn-lg btn-primary" id="create-expansion-team">
                🚀 Create Team & Start Expansion Draft
              </button>
              <button class="btn btn-secondary" id="reset-expansion">
                Reset
              </button>
            </div>
          ` : `
            <div class="expansion-placeholder">
              <p>👆 Select a city above to begin creating your expansion team</p>
            </div>
          `}
        </div>
      </div>
    `;
  }
  
  private renderExpansionDraft(): string {
    const draftState = this.expansionState.draftState!;
    const newTeam = this.expansionState.newTeam!;
    const state = this.engine.getState();
    
    const unprotectedPlayers = draftState.availablePlayers
      .filter(p => p.protectionStatus === 'unprotected')
      .filter(p => !draftState.selectedPlayers.includes(p.player.id));
    
    // Group by team
    const playersByTeam = new Map<string, typeof unprotectedPlayers>();
    for (const entry of unprotectedPlayers) {
      if (!playersByTeam.has(entry.originalTeamId)) {
        playersByTeam.set(entry.originalTeamId, []);
      }
      playersByTeam.get(entry.originalTeamId)!.push(entry);
    }
    
    return `
      <div class="expansion-draft">
        <div class="draft-header">
          <h2>🎯 Expansion Draft</h2>
          <div class="draft-info">
            <span class="new-team-badge" style="background: ${newTeam.colors.primary}">
              ${newTeam.city} ${newTeam.name}
            </span>
            <span class="pick-counter">Pick ${draftState.currentPick} of ${draftState.maxPicks}</span>
          </div>
        </div>
        
        <div class="draft-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${(draftState.currentPick / draftState.maxPicks) * 100}%"></div>
          </div>
          <p>Select one player from each team (max one per team)</p>
        </div>
        
        <!-- Selected Players -->
        <div class="selected-players">
          <h3>✅ Your Selections (${draftState.selectedPlayers.length})</h3>
          <div class="selected-grid">
            ${draftState.selectedPlayers.map(playerId => {
              const entry = draftState.availablePlayers.find(p => p.player.id === playerId);
              if (!entry) return '';
              const player = entry.player;
              return `
                <div class="selected-player-card">
                  <div class="player-rating">${player.stats.overall}</div>
                  <div class="player-info">
                    <div class="player-name">${player.firstName} ${player.lastName}</div>
                    <div class="player-meta">${player.position} | Age ${player.age} | From ${entry.originalTeamName}</div>
                  </div>
                </div>
              `;
            }).join('') || '<p class="no-selections">No players selected yet</p>'}
          </div>
        </div>
        
        <!-- Available Players by Team -->
        <div class="available-teams">
          <h3>📋 Available Players by Team</h3>
          ${Array.from(playersByTeam.entries()).map(([teamId, players]) => {
            const team = state.teams[teamId];
            const alreadySelected = draftState.selectedPlayers.some(id => {
              const e = draftState.availablePlayers.find(p => p.player.id === id);
              return e?.originalTeamId === teamId;
            });
            
            return `
              <div class="team-pool ${alreadySelected ? 'selected' : ''}">
                <div class="team-header" style="border-color: ${team.colors.primary}">
                  <span class="team-logo-sm" style="background: ${team.colors.primary}">${team.abbreviation}</span>
                  <span class="team-name">${team.city} ${team.name}</span>
                  ${alreadySelected ? '<span class="selected-badge">✓ Selected</span>' : ''}
                </div>
                ${!alreadySelected ? `
                  <div class="player-list">
                    ${players.slice(0, 5).map(entry => `
                      <div class="expansion-player" data-player-id="${entry.player.id}">
                        <div class="player-rating ${this.getRatingClass(entry.player.stats.overall)}">${entry.player.stats.overall}</div>
                        <div class="player-details">
                          <div class="player-name">${entry.player.firstName} ${entry.player.lastName}</div>
                          <div class="player-meta">${entry.player.position} | ${entry.player.age}yo | $${(entry.player.contract.salary / 1000000).toFixed(1)}M</div>
                        </div>
                        <div class="player-value">Value: ${entry.value}</div>
                        <button class="btn btn-sm btn-primary" data-action="select-expansion-player" data-id="${entry.player.id}">
                          Select
                        </button>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
        
        <div class="draft-actions">
          <button class="btn btn-secondary" id="auto-draft-expansion">🤖 Auto-Complete Draft</button>
          ${draftState.selectedPlayers.length >= 10 ? `
            <button class="btn btn-primary" id="finish-expansion-draft">✅ Finish Draft</button>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  private renderExpansionComplete(): string {
    const newTeam = this.expansionState.newTeam!;
    const state = this.engine.getState();
    const roster = newTeam.roster.map(id => state.players[id]).filter(Boolean);
    
    return `
      <div class="expansion-complete">
        <div class="celebration">
          <h1>🎉 Welcome to the League!</h1>
          <div class="new-team-display" style="border-color: ${newTeam.colors.primary}">
            <div class="team-logo-large" style="background: ${newTeam.colors.primary}; color: ${newTeam.colors.secondary}">
              ${newTeam.abbreviation}
            </div>
            <h2>${newTeam.city} ${newTeam.name}</h2>
            <p>${newTeam.arena} | ${newTeam.conference} Conference | ${newTeam.division} Division</p>
          </div>
        </div>
        
        <div class="expansion-roster">
          <h3>📋 Your Inaugural Roster</h3>
          <div class="roster-grid">
            ${roster.sort((a, b) => b.stats.overall - a.stats.overall).map(player => `
              <div class="roster-card">
                <div class="player-rating ${this.getRatingClass(player.stats.overall)}">${player.stats.overall}</div>
                <div class="player-info">
                  <div class="player-name">${player.firstName} ${player.lastName}</div>
                  <div class="player-meta">${player.position} | ${player.age}yo</div>
                  <div class="player-contract">$${(player.contract.salary / 1000000).toFixed(1)}M / ${player.contract.years}yr</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="expansion-actions">
          <button class="btn btn-lg btn-primary" id="start-as-expansion">
            🏀 Start Playing as ${newTeam.name}
          </button>
        </div>
      </div>
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

    // ==================== PLAYOFF EVENTS ====================
    
    // Simulate to playoffs
    document.getElementById('sim-to-playoffs')?.addEventListener('click', () => {
      this.showMessage('Simulating to playoffs...');
      setTimeout(() => {
        this.engine.simulateToPlayoffs();
        this.render();
        this.showMessage('Regular season complete!');
      }, 100);
    });

    // Sim next playoff game
    document.getElementById('sim-playoff-game')?.addEventListener('click', () => {
      const games = this.engine.simulateDay();
      if (games.length > 0) {
        this.render();
      }
    });

    // Sim playoff round
    document.getElementById('sim-playoff-round')?.addEventListener('click', () => {
      this.showMessage('Simulating round...');
      setTimeout(() => {
        for (let i = 0; i < 50; i++) {
          this.engine.simulateDay();
        }
        this.render();
      }, 100);
    });

    // Sim all playoffs
    document.getElementById('sim-all-playoffs')?.addEventListener('click', () => {
      this.showMessage('Simulating playoffs...');
      setTimeout(() => {
        const result = this.engine.simulatePlayoffs();
        this.render();
        if (result.champion) {
          const team = this.engine.getState().teams[result.champion];
          this.showMessage(`🏆 ${team.city} ${team.name} are NBA Champions!`);
        }
      }, 100);
    });

    // End season
    document.getElementById('end-season-btn')?.addEventListener('click', () => {
      this.engine.endSeason();
      this.currentTab = 'awards';
      this.render();
      this.showMessage('Season complete! Check the awards.');
    });

    // Continue to draft
    document.getElementById('continue-offseason')?.addEventListener('click', () => {
      this.engine.startDraft();
      this.currentTab = 'draft';
      this.render();
    });

    // ==================== EXPANSION EVENTS ====================
    
    // City selection
    this.panel.querySelectorAll('.city-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cityName = (e.currentTarget as HTMLElement).dataset.city;
        const city = EXPANSION_CITIES.find(c => c.name === cityName);
        if (city) {
          this.expansionState.config.city = city;
          this.expansionState.config.abbreviation = generateExpansionTeamId(
            this.expansionState.config.teamName || '',
            city.name
          );
          this.render();
        }
      });
    });

    // Team name input
    document.getElementById('team-name')?.addEventListener('input', (e) => {
      const name = (e.target as HTMLInputElement).value;
      this.expansionState.config.teamName = name;
      if (this.expansionState.config.city && name.length >= 2) {
        this.expansionState.config.abbreviation = generateExpansionTeamId(
          name,
          this.expansionState.config.city.name
        );
      }
    });

    // Name suggestions
    this.panel.querySelectorAll('.name-suggestion').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const name = (e.currentTarget as HTMLElement).dataset.name!;
        this.expansionState.config.teamName = name;
        if (this.expansionState.config.city) {
          this.expansionState.config.abbreviation = generateExpansionTeamId(
            name,
            this.expansionState.config.city.name
          );
        }
        this.render();
      });
    });

    // Abbreviation input
    document.getElementById('team-abbr')?.addEventListener('input', (e) => {
      this.expansionState.config.abbreviation = (e.target as HTMLInputElement).value.toUpperCase();
    });

    // Color presets
    this.panel.querySelectorAll('.color-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const preset = JSON.parse((e.currentTarget as HTMLElement).dataset.preset!);
        this.expansionState.config.colors = {
          primary: preset.primary,
          secondary: preset.secondary,
          accent: preset.accent
        };
        this.render();
      });
    });

    // Custom colors
    document.getElementById('color-primary')?.addEventListener('input', (e) => {
      if (!this.expansionState.config.colors) {
        this.expansionState.config.colors = { primary: '#000', secondary: '#FFF', accent: '#888' };
      }
      this.expansionState.config.colors.primary = (e.target as HTMLInputElement).value;
    });

    document.getElementById('color-secondary')?.addEventListener('input', (e) => {
      if (!this.expansionState.config.colors) {
        this.expansionState.config.colors = { primary: '#000', secondary: '#FFF', accent: '#888' };
      }
      this.expansionState.config.colors.secondary = (e.target as HTMLInputElement).value;
    });

    document.getElementById('color-accent')?.addEventListener('input', (e) => {
      if (!this.expansionState.config.colors) {
        this.expansionState.config.colors = { primary: '#000', secondary: '#FFF', accent: '#888' };
      }
      this.expansionState.config.colors.accent = (e.target as HTMLInputElement).value;
    });

    // Arena selection
    this.panel.querySelectorAll('.arena-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.expansionState.config.arena = (e.currentTarget as HTMLElement).dataset.arena!;
        this.render();
      });
    });

    document.getElementById('custom-arena')?.addEventListener('input', (e) => {
      this.expansionState.config.arena = (e.target as HTMLInputElement).value;
    });

    // Ticket price slider
    document.getElementById('ticket-price')?.addEventListener('input', (e) => {
      this.expansionState.config.ticketPriceMultiplier = parseInt((e.target as HTMLInputElement).value) / 100;
    });

    // Create expansion team
    document.getElementById('create-expansion-team')?.addEventListener('click', () => {
      this.createExpansionTeam();
    });

    // Reset expansion
    document.getElementById('reset-expansion')?.addEventListener('click', () => {
      this.expansionState = {
        phase: 'create',
        config: {},
        draftState: null,
        newTeam: null
      };
      this.render();
    });

    // Select expansion player
    this.panel.querySelectorAll('[data-action="select-expansion-player"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const playerId = (e.currentTarget as HTMLElement).dataset.id!;
        this.selectExpansionPlayer(playerId);
      });
    });

    // Auto-draft expansion
    document.getElementById('auto-draft-expansion')?.addEventListener('click', () => {
      this.autoCompleteExpansionDraft();
    });

    // Finish expansion draft
    document.getElementById('finish-expansion-draft')?.addEventListener('click', () => {
      this.finishExpansionDraft();
    });

    // Start as expansion team
    document.getElementById('start-as-expansion')?.addEventListener('click', () => {
      if (this.expansionState.newTeam) {
        this.engine = createNewLeague(this.expansionState.newTeam.id);
        this.expansionState = {
          phase: 'create',
          config: {},
          draftState: null,
          newTeam: null
        };
        this.currentTab = 'dashboard';
        this.render();
      }
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

  // ==================== EXPANSION METHODS ====================

  private createExpansionTeam(): void {
    const config = this.expansionState.config;
    
    // Validation
    const errors = validateExpansionConfig(config);
    if (errors.length > 0) {
      this.showMessage(errors[0], true);
      return;
    }

    const state = this.engine.getState();
    const existingTeams = Object.values(state.teams);
    
    // Determine conference/division
    const { conference, division } = determineExpansionDivision(config.city!, existingTeams);
    
    // Create the team
    const newTeam = createExpansionTeam(
      config as ExpansionTeamConfig,
      conference,
      division,
      state.currentSeason.year
    );
    
    // Add to league
    state.teams[newTeam.id] = newTeam;
    
    // Initialize expansion draft
    const draftState = initializeExpansionDraft(existingTeams, state.players, 8);
    
    this.expansionState = {
      phase: 'draft',
      config,
      draftState,
      newTeam
    };
    
    this.showMessage(`${newTeam.city} ${newTeam.name} created! Time for the expansion draft.`);
    this.render();
  }

  private selectExpansionPlayer(playerId: string): void {
    if (!this.expansionState.draftState || !this.expansionState.newTeam) return;
    
    const state = this.engine.getState();
    
    this.expansionState.draftState = selectExpansionPlayer(
      this.expansionState.draftState,
      playerId,
      this.expansionState.newTeam,
      state.players,
      state.teams
    );
    
    const player = state.players[playerId];
    if (player) {
      this.showMessage(`Selected ${player.firstName} ${player.lastName}!`);
    }
    
    if (this.expansionState.draftState.phase === 'complete') {
      this.finishExpansionDraft();
    } else {
      this.render();
    }
  }

  private autoCompleteExpansionDraft(): void {
    if (!this.expansionState.draftState || !this.expansionState.newTeam) return;
    
    const state = this.engine.getState();
    
    while (this.expansionState.draftState.phase !== 'complete' && 
           this.expansionState.draftState.currentPick <= this.expansionState.draftState.maxPicks) {
      this.expansionState.draftState = autoSelectExpansionPlayer(
        this.expansionState.draftState,
        this.expansionState.newTeam,
        state.players,
        state.teams
      );
    }
    
    this.showMessage('Expansion draft auto-completed!');
    this.finishExpansionDraft();
  }

  private finishExpansionDraft(): void {
    if (!this.expansionState.newTeam) return;
    
    const state = this.engine.getState();
    
    // Fill remaining roster spots with free agents/generated players
    fillExpansionRoster(
      this.expansionState.newTeam,
      state.players,
      state.freeAgents,
      state
    );
    
    this.expansionState.phase = 'complete';
    this.showMessage(`${this.expansionState.newTeam.city} ${this.expansionState.newTeam.name} roster complete!`);
    this.render();
  }
}
