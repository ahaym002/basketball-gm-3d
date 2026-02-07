import * as THREE from 'three';
import { Ball } from './Ball';

export class Player {
  public mesh: THREE.Group;
  public isControlled: boolean;
  public isHomeTeam: boolean;
  public hasBall: boolean = false;
  public justShot: boolean = false;
  public shootPosition: THREE.Vector3 = new THREE.Vector3();
  
  private speed: number = 8;
  private ball: Ball | null = null;
  private ballOffset: THREE.Vector3 = new THREE.Vector3(0.5, 1, 0);
  private dribbleTime: number = 0;
  
  // Player stats (for GM mode)
  public stats = {
    speed: 70 + Math.random() * 30,
    shooting: 60 + Math.random() * 40,
    defense: 60 + Math.random() * 40,
    passing: 60 + Math.random() * 40,
    rebounding: 60 + Math.random() * 40,
  };

  constructor(
    scene: THREE.Scene,
    _physics: unknown,
    x: number,
    z: number,
    color: number,
    isHomeTeam: boolean,
    isControlled: boolean
  ) {
    this.isHomeTeam = isHomeTeam;
    this.isControlled = isControlled;
    
    this.mesh = new THREE.Group();
    this.mesh.position.set(x, 0, z);
    
    // Body
    const bodyGeometry = new THREE.CapsuleGeometry(0.35, 1, 8, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.7,
      metalness: 0.1,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    body.castShadow = true;
    this.mesh.add(body);
    
    // Head
    const headGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xdeb887,
      roughness: 0.8,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.85;
    head.castShadow = true;
    this.mesh.add(head);
    
    // Jersey number
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(Math.floor(Math.random() * 99) + 1), 32, 32);
    
    const numberTexture = new THREE.CanvasTexture(canvas);
    const numberMaterial = new THREE.MeshBasicMaterial({
      map: numberTexture,
      transparent: true,
    });
    const numberGeometry = new THREE.PlaneGeometry(0.4, 0.4);
    const number = new THREE.Mesh(numberGeometry, numberMaterial);
    number.position.set(0, 1.2, 0.36);
    this.mesh.add(number);
    
    // Controlled player indicator
    if (isControlled) {
      this.addControlIndicator();
    }
    
    scene.add(this.mesh);
  }

  private addControlIndicator(): void {
    const ringGeometry = new THREE.RingGeometry(0.5, 0.6, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    ring.name = 'controlIndicator';
    this.mesh.add(ring);
  }

  get position(): THREE.Vector3 {
    return this.mesh.position;
  }

  public move(x: number, z: number, delta: number): void {
    const actualSpeed = this.speed * (this.stats.speed / 100);
    
    this.mesh.position.x += x * actualSpeed * delta;
    this.mesh.position.z += z * actualSpeed * delta;
    
    // Court boundaries
    this.mesh.position.x = Math.max(-13.5, Math.min(13.5, this.mesh.position.x));
    this.mesh.position.z = Math.max(-7, Math.min(7, this.mesh.position.z));
    
    // Face movement direction
    if (x !== 0 || z !== 0) {
      this.mesh.rotation.y = Math.atan2(x, z);
    }
    
    // Update ball position if holding
    if (this.hasBall && this.ball) {
      this.updateBallPosition();
    }
  }

  public update(delta: number): void {
    // Update control indicator
    const indicator = this.mesh.getObjectByName('controlIndicator');
    if (indicator) {
      if (this.isControlled) {
        indicator.visible = true;
        (indicator as THREE.Mesh).rotation.z += delta * 2;
      } else {
        indicator.visible = false;
      }
    } else if (this.isControlled) {
      this.addControlIndicator();
    }
    
    // Dribble animation
    if (this.hasBall && this.ball) {
      this.dribbleTime += delta * 8;
      this.updateBallPosition();
    }
  }

  private updateBallPosition(): void {
    if (!this.ball) return;
    
    const dribbleHeight = Math.abs(Math.sin(this.dribbleTime)) * 0.3;
    const offset = this.ballOffset.clone();
    offset.y += dribbleHeight;
    offset.applyQuaternion(this.mesh.quaternion);
    
    this.ball.attachTo(this.mesh.position, offset);
  }

  public pickUpBall(ball: Ball): void {
    this.ball = ball;
    this.hasBall = true;
    ball.isHeld = true;
    ball.isLoose = false;
    this.updateBallPosition();
  }

  public shoot(ball: Ball, target: THREE.Vector3, power: number): void {
    if (!this.hasBall || !this.ball) return;
    
    this.justShot = true;
    this.shootPosition.copy(this.mesh.position);
    
    const from = ball.position.clone();
    
    // Apply shooting skill influence
    const accuracy = this.stats.shooting / 100;
    const randomOffset = (1 - accuracy) * 0.5;
    
    target.x += (Math.random() - 0.5) * randomOffset;
    target.z += (Math.random() - 0.5) * randomOffset;
    
    ball.shoot(from, target, power);
    
    this.ball = null;
    this.hasBall = false;
  }

  public pass(ball: Ball, target: Player): void {
    if (!this.hasBall || !this.ball) return;
    
    const targetPos = target.position.clone();
    targetPos.y = 1.2;
    
    // Apply passing skill influence
    const accuracy = this.stats.passing / 100;
    const randomOffset = (1 - accuracy) * 0.3;
    
    targetPos.x += (Math.random() - 0.5) * randomOffset;
    targetPos.z += (Math.random() - 0.5) * randomOffset;
    
    ball.passTo(targetPos);
    
    this.ball = null;
    this.hasBall = false;
  }

  public updateAI(delta: number, ball: Ball, allPlayers: Player[]): void {
    const isOnBallTeam = allPlayers.some(
      p => p.isHomeTeam === this.isHomeTeam && p.hasBall
    );
    
    if (this.isHomeTeam) {
      // Home team AI (offensive)
      if (isOnBallTeam) {
        // Move to open space
        this.moveToOpenSpace(delta, allPlayers);
      } else {
        // Chase ball
        this.chaseBall(delta, ball);
      }
    } else {
      // Away team AI (defensive)
      if (isOnBallTeam) {
        // Defend
        this.defend(delta, ball, allPlayers);
      } else {
        // Mark closest opponent
        this.markOpponent(delta, allPlayers);
      }
    }
  }

  private moveToOpenSpace(delta: number, allPlayers: Player[]): void {
    // Find a good position away from defenders
    const defenders = allPlayers.filter(p => p.isHomeTeam !== this.isHomeTeam);
    
    let bestDir = new THREE.Vector3();
    let maxDistance = 0;
    
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
      const testPos = new THREE.Vector3(
        this.mesh.position.x + Math.cos(angle) * 3,
        0,
        this.mesh.position.z + Math.sin(angle) * 3
      );
      
      let minDefenderDist = Infinity;
      defenders.forEach(d => {
        const dist = testPos.distanceTo(d.position);
        if (dist < minDefenderDist) minDefenderDist = dist;
      });
      
      if (minDefenderDist > maxDistance) {
        maxDistance = minDefenderDist;
        bestDir.set(Math.cos(angle), 0, Math.sin(angle));
      }
    }
    
    if (maxDistance > 2) {
      this.move(bestDir.x * 0.5, bestDir.z * 0.5, delta);
    }
  }

  private chaseBall(delta: number, ball: Ball): void {
    if (!ball.isLoose) return;
    
    const dir = ball.position.clone().sub(this.mesh.position).normalize();
    this.move(dir.x, dir.z, delta);
  }

  private defend(delta: number, _ball: Ball, allPlayers: Player[]): void {
    const ballHandler = allPlayers.find(p => p.hasBall);
    if (!ballHandler) return;
    
    // Position between ball handler and basket
    const basketPos = new THREE.Vector3(-14, 0, 0);
    const defendPos = ballHandler.position.clone().lerp(basketPos, 0.3);
    
    const dir = defendPos.sub(this.mesh.position).normalize();
    this.move(dir.x * 0.7, dir.z * 0.7, delta);
  }

  private markOpponent(delta: number, allPlayers: Player[]): void {
    // Find nearest opponent without ball
    const opponents = allPlayers.filter(
      p => p.isHomeTeam !== this.isHomeTeam && !p.hasBall
    );
    
    if (opponents.length === 0) return;
    
    let nearestOpponent = opponents[0];
    let minDist = this.position.distanceTo(nearestOpponent.position);
    
    for (let i = 1; i < opponents.length; i++) {
      const dist = this.position.distanceTo(opponents[i].position);
      if (dist < minDist) {
        minDist = dist;
        nearestOpponent = opponents[i];
      }
    }
    
    const dir = nearestOpponent.position.clone().sub(this.mesh.position).normalize();
    this.move(dir.x * 0.5, dir.z * 0.5, delta);
  }
}
