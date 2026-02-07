import { Game } from './game/Game';
import { GMMode, createNewLeague, LeagueEngine } from './gm';
import './style.css';
import './gm/styles.css';

// Initialize the game
const game = new Game();

// Initialize GM Mode
let gmMode: GMMode | null = null;

// Start the game loop
game.start();

// Handle window resize
window.addEventListener('resize', () => {
  game.resize();
});

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Create team selection modal
  createTeamSelectionModal();
});

function createTeamSelectionModal(): void {
  const modal = document.createElement('div');
  modal.id = 'team-select-modal';
  modal.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-content">
        <h2>🏀 Basketball GM 3D</h2>
        <p>Select your team to begin your GM journey</p>
        <div class="team-grid" id="team-grid"></div>
        <button id="start-gm" class="start-btn" disabled>Start GM Mode</button>
        <button id="play-quick" class="quick-btn">Quick Play (3D Game)</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Add modal styles
  const style = document.createElement('style');
  style.textContent = `
    #team-select-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 5000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-overlay {
      background: rgba(0,0,0,0.9);
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-content {
      background: linear-gradient(135deg, #1a1f2e, #0f1419);
      border-radius: 16px;
      padding: 32px;
      max-width: 800px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      color: white;
      text-align: center;
    }
    .modal-content h2 {
      font-size: 32px;
      margin-bottom: 8px;
    }
    .modal-content p {
      color: #a0aec0;
      margin-bottom: 24px;
    }
    .team-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
      max-height: 400px;
      overflow-y: auto;
    }
    .team-btn {
      padding: 16px 8px;
      border: 2px solid #2d3748;
      border-radius: 8px;
      background: rgba(255,255,255,0.05);
      color: white;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 12px;
      font-weight: 600;
    }
    .team-btn:hover {
      background: rgba(255,255,255,0.1);
    }
    .team-btn.selected {
      border-color: #f97316;
      background: rgba(249,115,22,0.2);
    }
    .team-btn .abbr {
      font-size: 18px;
      font-weight: 700;
      display: block;
      margin-bottom: 4px;
    }
    .start-btn {
      background: #f97316;
      color: white;
      border: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      margin-right: 12px;
    }
    .start-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .quick-btn {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);
  
  // NBA Teams
  const teams = [
    { id: 'ATL', name: 'Hawks', color: '#E03A3E' },
    { id: 'BOS', name: 'Celtics', color: '#007A33' },
    { id: 'BKN', name: 'Nets', color: '#000000' },
    { id: 'CHA', name: 'Hornets', color: '#1D1160' },
    { id: 'CHI', name: 'Bulls', color: '#CE1141' },
    { id: 'CLE', name: 'Cavaliers', color: '#860038' },
    { id: 'DAL', name: 'Mavericks', color: '#00538C' },
    { id: 'DEN', name: 'Nuggets', color: '#0E2240' },
    { id: 'DET', name: 'Pistons', color: '#C8102E' },
    { id: 'GSW', name: 'Warriors', color: '#1D428A' },
    { id: 'HOU', name: 'Rockets', color: '#CE1141' },
    { id: 'IND', name: 'Pacers', color: '#002D62' },
    { id: 'LAC', name: 'Clippers', color: '#C8102E' },
    { id: 'LAL', name: 'Lakers', color: '#552583' },
    { id: 'MEM', name: 'Grizzlies', color: '#5D76A9' },
    { id: 'MIA', name: 'Heat', color: '#98002E' },
    { id: 'MIL', name: 'Bucks', color: '#00471B' },
    { id: 'MIN', name: 'Timberwolves', color: '#0C2340' },
    { id: 'NOP', name: 'Pelicans', color: '#0C2340' },
    { id: 'NYK', name: 'Knicks', color: '#006BB6' },
    { id: 'OKC', name: 'Thunder', color: '#007AC1' },
    { id: 'ORL', name: 'Magic', color: '#0077C0' },
    { id: 'PHI', name: '76ers', color: '#006BB6' },
    { id: 'PHX', name: 'Suns', color: '#1D1160' },
    { id: 'POR', name: 'Trail Blazers', color: '#E03A3E' },
    { id: 'SAC', name: 'Kings', color: '#5A2D81' },
    { id: 'SAS', name: 'Spurs', color: '#C4CED4' },
    { id: 'TOR', name: 'Raptors', color: '#CE1141' },
    { id: 'UTA', name: 'Jazz', color: '#002B5C' },
    { id: 'WAS', name: 'Wizards', color: '#002B5C' },
  ];
  
  const grid = document.getElementById('team-grid')!;
  let selectedTeam: string | null = null;
  
  teams.forEach(team => {
    const btn = document.createElement('button');
    btn.className = 'team-btn';
    btn.innerHTML = `<span class="abbr" style="color: ${team.color}">${team.id}</span>${team.name}`;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.team-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedTeam = team.id;
      (document.getElementById('start-gm') as HTMLButtonElement).disabled = false;
    });
    grid.appendChild(btn);
  });
  
  document.getElementById('start-gm')!.addEventListener('click', () => {
    if (selectedTeam) {
      modal.remove();
      createNewLeague(selectedTeam);
      gmMode = new GMMode();
      gmMode.show();
    }
  });
  
  document.getElementById('play-quick')!.addEventListener('click', () => {
    modal.remove();
    // Just play the 3D game without GM mode
  });
}

// Setup GM mode toggle button
setTimeout(() => {
  const toggle = document.getElementById('game-mode-toggle');
  if (toggle) {
    toggle.innerHTML = '<button id="open-gm">📊 GM Mode</button>';
    document.getElementById('open-gm')?.addEventListener('click', () => {
      if (!gmMode) {
        gmMode = new GMMode();
      }
      gmMode.show();
    });
  }
}, 100);

// Export for debugging
(window as any).game = game;
(window as any).gmMode = () => {
  if (!gmMode) {
    gmMode = new GMMode();
  }
  return gmMode;
};
