export class InputManager {
  private keys: Set<string> = new Set();
  private shootStartTime: number = 0;
  private shootReleased: boolean = false;
  private passPressed: boolean = false;
  private switchPressed: boolean = false;

  constructor() {
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  private onKeyDown(e: KeyboardEvent): void {
    this.keys.add(e.code);
    
    // Shoot (space)
    if (e.code === 'Space' && this.shootStartTime === 0) {
      this.shootStartTime = Date.now();
    }
    
    // Pass (E)
    if (e.code === 'KeyE') {
      this.passPressed = true;
    }
    
    // Switch player (Q)
    if (e.code === 'KeyQ') {
      this.switchPressed = true;
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.code);
    
    if (e.code === 'Space' && this.shootStartTime > 0) {
      this.shootReleased = true;
    }
  }

  public getMoveDirection(): { x: number; z: number } {
    let x = 0;
    let z = 0;
    
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) z -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) z += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    
    // Normalize diagonal movement
    if (x !== 0 && z !== 0) {
      const len = Math.sqrt(x * x + z * z);
      x /= len;
      z /= len;
    }
    
    return { x, z };
  }

  public isShootHeld(): boolean {
    return this.shootStartTime > 0 && !this.shootReleased;
  }

  public wasShootReleased(): boolean {
    return this.shootReleased;
  }

  public getShotPower(): number {
    if (this.shootStartTime === 0) return 0;
    
    const elapsed = Date.now() - this.shootStartTime;
    // Max power at 1.5 seconds, then cycles
    const power = Math.sin((elapsed / 1500) * Math.PI / 2);
    return Math.max(0, Math.min(1, power));
  }

  public resetShot(): void {
    this.shootStartTime = 0;
    this.shootReleased = false;
  }

  public wasPassPressed(): boolean {
    const was = this.passPressed;
    this.passPressed = false;
    return was;
  }

  public wasSwitchPressed(): boolean {
    const was = this.switchPressed;
    this.switchPressed = false;
    return was;
  }
}
