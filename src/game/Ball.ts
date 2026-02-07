import * as THREE from 'three';

export class Ball {
  public mesh: THREE.Mesh;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public isLoose: boolean = true;
  public isHeld: boolean = false;
  private gravity: number = -25;
  private bounciness: number = 0.7;
  private friction: number = 0.98;
  private radius: number = 0.12;
  
  constructor(scene: THREE.Scene, _physics: unknown) {
    
    // Create basketball mesh
    const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
    
    // Create basketball texture procedurally
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    // Orange base
    ctx.fillStyle = '#e86100';
    ctx.fillRect(0, 0, 256, 256);
    
    // Black lines
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 4;
    
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(0, 128);
    ctx.lineTo(256, 128);
    ctx.stroke();
    
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(128, 0);
    ctx.lineTo(128, 256);
    ctx.stroke();
    
    // Curved lines
    ctx.beginPath();
    ctx.arc(128, 128, 80, 0, Math.PI * 2);
    ctx.stroke();
    
    const texture = new THREE.CanvasTexture(canvas);
    
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.6,
      metalness: 0.1,
      bumpScale: 0.02,
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.position.set(0, 1, 0);
    scene.add(this.mesh);
  }

  get position(): THREE.Vector3 {
    return this.mesh.position;
  }

  public update(delta: number): void {
    if (this.isHeld) return;
    
    // Apply gravity
    this.velocity.y += this.gravity * delta;
    
    // Update position
    this.mesh.position.x += this.velocity.x * delta;
    this.mesh.position.y += this.velocity.y * delta;
    this.mesh.position.z += this.velocity.z * delta;
    
    // Floor collision
    if (this.mesh.position.y < this.radius) {
      this.mesh.position.y = this.radius;
      this.velocity.y = -this.velocity.y * this.bounciness;
      
      // Apply friction
      this.velocity.x *= this.friction;
      this.velocity.z *= this.friction;
      
      // Stop small bounces
      if (Math.abs(this.velocity.y) < 0.5) {
        this.velocity.y = 0;
      }
    }
    
    // Court boundary collisions
    const courtWidth = 14;
    const courtDepth = 7.5;
    
    if (Math.abs(this.mesh.position.x) > courtWidth) {
      this.mesh.position.x = Math.sign(this.mesh.position.x) * courtWidth;
      this.velocity.x = -this.velocity.x * this.bounciness;
    }
    
    if (Math.abs(this.mesh.position.z) > courtDepth) {
      this.mesh.position.z = Math.sign(this.mesh.position.z) * courtDepth;
      this.velocity.z = -this.velocity.z * this.bounciness;
    }
    
    // Backboard collision
    this.checkBackboardCollision(-14);
    this.checkBackboardCollision(14);
    
    // Rotate ball based on movement
    this.mesh.rotation.x += this.velocity.z * delta * 5;
    this.mesh.rotation.z -= this.velocity.x * delta * 5;
    
    // Air resistance
    this.velocity.multiplyScalar(0.999);
    
    // Check if ball is loose (on ground with low velocity)
    if (this.mesh.position.y < 0.2 && this.velocity.length() < 1) {
      this.isLoose = true;
    }
  }

  private checkBackboardCollision(hoopX: number): void {
    const backboardY = 3.55;
    const backboardHeight = 1.2;
    const backboardWidth = 1.8;
    
    const nearBackboard = 
      Math.abs(this.mesh.position.x - hoopX) < 0.2 &&
      this.mesh.position.y > backboardY - backboardHeight / 2 &&
      this.mesh.position.y < backboardY + backboardHeight / 2 &&
      Math.abs(this.mesh.position.z) < backboardWidth / 2;
    
    if (nearBackboard) {
      this.velocity.x = -this.velocity.x * 0.6;
      this.mesh.position.x = hoopX + (hoopX > 0 ? -0.3 : 0.3);
    }
  }

  public checkScore(hoopX: number, hoopY: number, hoopZ: number): boolean {
    const rimRadius = 0.23;
    const direction = hoopX > 0 ? -1 : 1;
    const rimX = hoopX + direction * 0.4;
    
    // Check if ball passes through hoop
    const dx = this.mesh.position.x - rimX;
    const dz = this.mesh.position.z - hoopZ;
    const distFromCenter = Math.sqrt(dx * dx + dz * dz);
    
    const isInRim = distFromCenter < rimRadius - this.radius;
    const isAtRimHeight = Math.abs(this.mesh.position.y - hoopY) < 0.3;
    const isMovingDown = this.velocity.y < 0;
    
    if (isInRim && isAtRimHeight && isMovingDown) {
      // Score! Add some downward velocity through the net
      this.velocity.y = -3;
      return true;
    }
    
    // Rim collision
    if (distFromCenter > rimRadius - this.radius && 
        distFromCenter < rimRadius + this.radius &&
        Math.abs(this.mesh.position.y - hoopY) < 0.15) {
      // Bounce off rim
      const bounceAngle = Math.atan2(dz, dx);
      const bounceSpeed = this.velocity.length() * 0.5;
      this.velocity.x = Math.cos(bounceAngle) * bounceSpeed;
      this.velocity.z = Math.sin(bounceAngle) * bounceSpeed;
      this.velocity.y = Math.abs(this.velocity.y) * 0.4;
    }
    
    return false;
  }

  public shoot(from: THREE.Vector3, to: THREE.Vector3, power: number): void {
    this.isHeld = false;
    this.isLoose = false;
    
    // Calculate shot trajectory
    const distance = from.distanceTo(to);
    const arcHeight = 3 + power * 2;
    
    // Calculate initial velocity for arc shot
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dz = to.z - from.z;
    
    const time = 0.7 + distance * 0.05; // Time to reach target
    
    this.velocity.x = dx / time;
    this.velocity.z = dz / time;
    
    // Calculate vertical velocity for arc
    // Using kinematic equation: vy = (dy + 0.5*g*t^2) / t
    this.velocity.y = (dy + arcHeight) / time + (-this.gravity * time) / 2;
    
    // Add some power influence
    this.velocity.multiplyScalar(0.8 + power * 0.4);
  }

  public passTo(target: THREE.Vector3): void {
    this.isHeld = false;
    this.isLoose = false;
    
    const from = this.mesh.position.clone();
    const dx = target.x - from.x;
    const dz = target.z - from.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    const time = 0.3 + distance * 0.04;
    
    this.velocity.x = dx / time;
    this.velocity.z = dz / time;
    this.velocity.y = 2; // Slight arc for passes
  }

  public reset(x: number, y: number, z: number): void {
    this.mesh.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    this.isLoose = true;
    this.isHeld = false;
  }

  public attachTo(position: THREE.Vector3, offset: THREE.Vector3): void {
    this.mesh.position.copy(position).add(offset);
    this.velocity.set(0, 0, 0);
    this.isHeld = true;
    this.isLoose = false;
  }
}
