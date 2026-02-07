import * as THREE from 'three';
import { Court } from './Court';
import { Ball } from './Ball';
import { Player } from './Player';
import { InputManager } from './InputManager';
import { PhysicsWorld } from './PhysicsWorld';
import { GameState } from './GameState';
import { UI } from '../ui/UI';
import { GMMode } from '../gm/GMMode';

export class Game {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private _court: Court;
  private ball: Ball;
  private players: Player[] = [];
  private inputManager: InputManager;
  private physics: PhysicsWorld;
  private gameState: GameState;
  private ui: UI;
  private gmMode: GMMode;
  private clock: THREE.Clock;
  private isGMMode: boolean = false;

  constructor() {
    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    
    const app = document.querySelector<HTMLDivElement>('#app')!;
    app.appendChild(this.renderer.domElement);

    // Setup scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    // Setup camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 15, 25);
    this.camera.lookAt(0, 0, 0);

    // Initialize systems
    this.clock = new THREE.Clock();
    this.physics = new PhysicsWorld();
    this.gameState = new GameState();
    this.inputManager = new InputManager();
    
    // Create game objects
    this._court = new Court(this.scene);
    this.ball = new Ball(this.scene, this.physics);
    
    // Create players
    this.createPlayers();
    
    // Setup lighting
    this.setupLighting();
    
    // Setup UI
    this.ui = new UI(this.gameState, () => this.toggleGMMode());
    
    // Setup GM Mode
    this.gmMode = new GMMode(this.gameState);
  }

  private createPlayers(): void {
    // Create home team (blue)
    const homePositions = [
      { x: -8, z: 0 },   // Point Guard
      { x: -6, z: -4 },  // Shooting Guard
      { x: -6, z: 4 },   // Small Forward
      { x: -4, z: -6 },  // Power Forward
      { x: -3, z: 0 },   // Center
    ];

    homePositions.forEach((pos, idx) => {
      const player = new Player(
        this.scene,
        this.physics,
        pos.x,
        pos.z,
        0x3498db,
        true,
        idx === 0 // First player is controlled
      );
      this.players.push(player);
    });

    // Create away team (red)
    const awayPositions = [
      { x: 8, z: 0 },
      { x: 6, z: -4 },
      { x: 6, z: 4 },
      { x: 4, z: -6 },
      { x: 3, z: 0 },
    ];

    awayPositions.forEach((pos) => {
      const player = new Player(
        this.scene,
        this.physics,
        pos.x,
        pos.z,
        0xe74c3c,
        false,
        false
      );
      this.players.push(player);
    });
  }

  private setupLighting(): void {
    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambient);

    // Main spotlight (like arena lights)
    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(0, 30, 0);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 1;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.camera.left = -30;
    mainLight.shadow.camera.right = 30;
    mainLight.shadow.camera.top = 20;
    mainLight.shadow.camera.bottom = -20;
    this.scene.add(mainLight);

    // Side lights for atmosphere
    const leftLight = new THREE.PointLight(0x3498db, 0.5, 50);
    leftLight.position.set(-20, 15, 0);
    this.scene.add(leftLight);

    const rightLight = new THREE.PointLight(0xe74c3c, 0.5, 50);
    rightLight.position.set(20, 15, 0);
    this.scene.add(rightLight);

    // Hoop spotlights
    const hoopLight1 = new THREE.SpotLight(0xffffff, 0.8);
    hoopLight1.position.set(-14, 10, 0);
    hoopLight1.target.position.set(-14, 3, 0);
    hoopLight1.angle = Math.PI / 6;
    hoopLight1.penumbra = 0.3;
    this.scene.add(hoopLight1);
    this.scene.add(hoopLight1.target);

    const hoopLight2 = new THREE.SpotLight(0xffffff, 0.8);
    hoopLight2.position.set(14, 10, 0);
    hoopLight2.target.position.set(14, 3, 0);
    hoopLight2.angle = Math.PI / 6;
    hoopLight2.penumbra = 0.3;
    this.scene.add(hoopLight2);
    this.scene.add(hoopLight2.target);
  }

  private toggleGMMode(): void {
    this.isGMMode = !this.isGMMode;
    if (this.isGMMode) {
      this.gmMode.show();
    } else {
      this.gmMode.hide();
    }
  }

  public start(): void {
    this.animate();
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    if (this.isGMMode) return;

    const delta = this.clock.getDelta();

    // Get controlled player
    const controlledPlayer = this.players.find(p => p.isControlled);
    
    if (controlledPlayer) {
      // Handle movement
      const moveDir = this.inputManager.getMoveDirection();
      controlledPlayer.move(moveDir.x, moveDir.z, delta);

      // Handle shooting
      if (this.inputManager.isShootHeld() && controlledPlayer.hasBall) {
        this.ui.showShotPower(this.inputManager.getShotPower());
      }
      
      if (this.inputManager.wasShootReleased() && controlledPlayer.hasBall) {
        const power = this.inputManager.getShotPower();
        this.shoot(controlledPlayer, power);
        this.ui.hideShotPower();
        this.inputManager.resetShot();
      }

      // Handle passing
      if (this.inputManager.wasPassPressed() && controlledPlayer.hasBall) {
        this.pass(controlledPlayer);
      }

      // Handle player switch
      if (this.inputManager.wasSwitchPressed()) {
        this.switchPlayer();
      }

      // Pick up ball if close
      if (!controlledPlayer.hasBall && this.ball.isLoose) {
        const dist = controlledPlayer.position.distanceTo(this.ball.position);
        if (dist < 1.5) {
          controlledPlayer.pickUpBall(this.ball);
        }
      }

      // Update camera to follow controlled player
      this.updateCamera(controlledPlayer);
    }

    // Update physics
    this.physics.update(delta);
    
    // Update ball
    this.ball.update(delta);

    // Check for scoring
    this.checkScoring();

    // Update AI players
    this.updateAI(delta);

    // Update players
    this.players.forEach(p => p.update(delta));

    // Update UI
    this.ui.update();

    // Render
    this.renderer.render(this.scene, this.camera);
  };

  private shoot(player: Player, power: number): void {
    // Determine which hoop to aim for
    const targetHoop = player.isHomeTeam ? 
      new THREE.Vector3(14, 3.05, 0) :  // Away hoop
      new THREE.Vector3(-14, 3.05, 0);  // Home hoop

    player.shoot(this.ball, targetHoop, power);
  }

  private pass(player: Player): void {
    // Find nearest teammate
    const teammates = this.players.filter(
      p => p.isHomeTeam === player.isHomeTeam && p !== player
    );
    
    let nearest: Player | null = null;
    let minDist = Infinity;
    
    teammates.forEach(t => {
      const dist = player.position.distanceTo(t.position);
      if (dist < minDist) {
        minDist = dist;
        nearest = t;
      }
    });

    if (nearest) {
      player.pass(this.ball, nearest);
    }
  }

  private switchPlayer(): void {
    const homePlayers = this.players.filter(p => p.isHomeTeam);
    const currentIndex = homePlayers.findIndex(p => p.isControlled);
    
    homePlayers.forEach(p => p.isControlled = false);
    
    const nextIndex = (currentIndex + 1) % homePlayers.length;
    homePlayers[nextIndex].isControlled = true;
  }

  private updateCamera(player: Player): void {
    const targetPos = new THREE.Vector3(
      player.position.x * 0.3,
      12,
      player.position.z * 0.3 + 18
    );
    
    this.camera.position.lerp(targetPos, 0.05);
    
    const lookTarget = new THREE.Vector3(
      player.position.x * 0.5,
      2,
      player.position.z * 0.5
    );
    this.camera.lookAt(lookTarget);
  }

  private checkScoring(): void {
    // Home hoop at x = -14
    if (this.ball.checkScore(-14, 3.05, 0)) {
      this.gameState.scoreAway(this.determinePoints(-14));
      this.resetAfterScore();
    }
    
    // Away hoop at x = 14
    if (this.ball.checkScore(14, 3.05, 0)) {
      this.gameState.scoreHome(this.determinePoints(14));
      this.resetAfterScore();
    }
  }

  private determinePoints(hoopX: number): number {
    const shooter = this.players.find(p => p.justShot);
    if (!shooter) return 2;
    
    const threePointLine = 7.24; // NBA three-point distance
    const dist = Math.abs(shooter.shootPosition.x - hoopX);
    
    return dist > threePointLine ? 3 : 2;
  }

  private resetAfterScore(): void {
    // Reset ball to center
    this.ball.reset(0, 1, 0);
    
    // Reset player positions
    this.players.forEach(p => {
      p.justShot = false;
      p.hasBall = false;
    });
    
    // Give ball to home team point guard
    const pg = this.players[0];
    pg.pickUpBall(this.ball);
  }

  private updateAI(delta: number): void {
    this.players.forEach(player => {
      if (!player.isControlled && !player.hasBall) {
        player.updateAI(delta, this.ball, this.players);
      }
    });
  }

  public resize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
