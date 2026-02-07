import { GameState } from '../game/GameState';

export class UI {
  private gameState: GameState;
  private scoreBoard: HTMLElement;
  private shotPower: HTMLElement;
  private shotPowerFill: HTMLElement;

  constructor(gameState: GameState, onGMToggle: () => void) {
    this.gameState = gameState;
    
    // Create UI container
    const ui = document.createElement('div');
    ui.id = 'game-ui';
    ui.innerHTML = `
      <div id="score-board">
        <div class="team">
          <div class="team-name">${gameState.homeTeam.abbreviation}</div>
          <div class="score" id="home-score">${gameState.homeTeam.score}</div>
        </div>
        <div class="separator">-</div>
        <div class="team">
          <div class="team-name">${gameState.awayTeam.abbreviation}</div>
          <div class="score" id="away-score">${gameState.awayTeam.score}</div>
        </div>
      </div>
      
      <div id="shot-power">
        <div id="shot-power-fill"></div>
      </div>
      
      <div id="controls-help">
        <h3>🏀 Controls</h3>
        <div><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Move</div>
        <div><kbd>Space</kbd> Shoot (hold for power)</div>
        <div><kbd>E</kbd> Pass</div>
        <div><kbd>Q</kbd> Switch Player</div>
      </div>
      
      <div id="game-mode-toggle">
        <button id="gm-button">📋 GM Mode</button>
      </div>
      
      <div id="message-toast"></div>
    `;
    
    document.querySelector('#app')!.appendChild(ui);
    
    this.scoreBoard = document.getElementById('score-board')!;
    this.shotPower = document.getElementById('shot-power')!;
    this.shotPowerFill = document.getElementById('shot-power-fill')!;
    
    // GM mode toggle
    document.getElementById('gm-button')!.addEventListener('click', onGMToggle);
    
    // Score change callback
    gameState.onScore(() => this.updateScore());
  }

  public update(): void {
    // Update periodically if needed
  }

  private updateScore(): void {
    document.getElementById('home-score')!.textContent = String(this.gameState.homeTeam.score);
    document.getElementById('away-score')!.textContent = String(this.gameState.awayTeam.score);
    
    // Flash effect on score
    this.scoreBoard.style.transform = 'translateX(-50%) scale(1.1)';
    setTimeout(() => {
      this.scoreBoard.style.transform = 'translateX(-50%) scale(1)';
    }, 200);
  }

  public showShotPower(power: number): void {
    this.shotPower.style.display = 'block';
    this.shotPowerFill.style.width = `${power * 100}%`;
  }

  public hideShotPower(): void {
    this.shotPower.style.display = 'none';
    this.shotPowerFill.style.width = '0%';
  }

  public showMessage(message: string, isError: boolean = false): void {
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
