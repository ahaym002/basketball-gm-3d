import { Game } from './game/Game';
import './style.css';

// Initialize the game
const game = new Game();

// Start the game loop
game.start();

// Handle window resize
window.addEventListener('resize', () => {
  game.resize();
});

// Export for debugging
(window as any).game = game;
