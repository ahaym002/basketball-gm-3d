import * as THREE from 'three';

export class Court {
  private scene: THREE.Scene;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.createCourt();
    this.createHoops();
    this.createLines();
    this.createBleachers();
  }

  private createCourt(): void {
    // Court floor (NBA regulation: 94ft x 50ft = 28.65m x 15.24m)
    const courtWidth = 28;
    const courtDepth = 15;
    
    const courtGeometry = new THREE.PlaneGeometry(courtWidth, courtDepth);
    const courtMaterial = new THREE.MeshStandardMaterial({
      color: 0xcd853f, // Hardwood color
      roughness: 0.8,
      metalness: 0.1,
    });
    
    const court = new THREE.Mesh(courtGeometry, courtMaterial);
    court.rotation.x = -Math.PI / 2;
    court.receiveShadow = true;
    this.scene.add(court);

    // Court border/out of bounds
    const borderGeometry = new THREE.PlaneGeometry(32, 19);
    const borderMaterial = new THREE.MeshStandardMaterial({
      color: 0x2c3e50,
      roughness: 0.9,
    });
    
    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.rotation.x = -Math.PI / 2;
    border.position.y = -0.01;
    border.receiveShadow = true;
    this.scene.add(border);
  }

  private createLines(): void {
    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const lineHeight = 0.01;
    
    // Center circle
    const centerCircle = this.createCircle(1.8, 0.05);
    centerCircle.position.set(0, lineHeight, 0);
    this.scene.add(centerCircle);

    // Center line
    const centerLine = new THREE.Mesh(
      new THREE.PlaneGeometry(0.1, 15),
      lineMaterial
    );
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.y = lineHeight;
    this.scene.add(centerLine);

    // Three-point lines (simplified arcs)
    this.createThreePointLine(-14, lineHeight);
    this.createThreePointLine(14, lineHeight);

    // Free throw lines and key
    this.createKey(-14, lineHeight);
    this.createKey(14, lineHeight);

    // Court boundary lines
    const boundaryLines = [
      { pos: [0, lineHeight, 7.5], size: [28, 0.1] },
      { pos: [0, lineHeight, -7.5], size: [28, 0.1] },
      { pos: [14, lineHeight, 0], size: [0.1, 15] },
      { pos: [-14, lineHeight, 0], size: [0.1, 15] },
    ];

    boundaryLines.forEach(line => {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(line.size[0], line.size[1]),
        lineMaterial
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(line.pos[0], line.pos[1], line.pos[2]);
      this.scene.add(mesh);
    });
  }

  private createCircle(radius: number, lineWidth: number): THREE.Mesh {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, radius + lineWidth, 0, Math.PI * 2, false);
    shape.absarc(0, 0, radius, 0, Math.PI * 2, true);

    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    const circle = new THREE.Mesh(geometry, material);
    circle.rotation.x = -Math.PI / 2;
    
    return circle;
  }

  private createThreePointLine(hoopX: number, y: number): void {
    const points: THREE.Vector3[] = [];
    const radius = 7.24;
    const direction = hoopX > 0 ? -1 : 1;
    
    // Arc portion
    for (let angle = -Math.PI / 2; angle <= Math.PI / 2; angle += 0.1) {
      points.push(new THREE.Vector3(
        hoopX + direction * Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      ));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0xffffff });
    const line = new THREE.Line(geometry, material);
    this.scene.add(line);
  }

  private createKey(hoopX: number, y: number): void {
    const keyWidth = 4.9;
    const keyLength = 5.8;
    const direction = hoopX > 0 ? -1 : 1;
    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Key rectangle
    const keyLines = [
      // Sides
      { pos: [hoopX + direction * keyLength / 2, y, keyWidth / 2], size: [keyLength, 0.1] },
      { pos: [hoopX + direction * keyLength / 2, y, -keyWidth / 2], size: [keyLength, 0.1] },
      // Free throw line
      { pos: [hoopX + direction * keyLength, y, 0], size: [0.1, keyWidth] },
    ];

    keyLines.forEach(line => {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(line.size[0], line.size[1]),
        lineMaterial
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(line.pos[0], line.pos[1], line.pos[2]);
      this.scene.add(mesh);
    });

    // Free throw circle
    const ftCircle = this.createCircle(1.8, 0.05);
    ftCircle.position.set(hoopX + direction * keyLength, y, 0);
    this.scene.add(ftCircle);

    // Paint/key area (colored)
    const paintGeometry = new THREE.PlaneGeometry(keyLength, keyWidth);
    const paintMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.9,
      transparent: true,
      opacity: 0.7,
    });
    const paint = new THREE.Mesh(paintGeometry, paintMaterial);
    paint.rotation.x = -Math.PI / 2;
    paint.position.set(hoopX + direction * keyLength / 2, 0.005, 0);
    this.scene.add(paint);
  }

  private createHoops(): void {
    this.createHoop(-14, 3.05, 0);
    this.createHoop(14, 3.05, 0);
  }

  private createHoop(x: number, y: number, z: number): void {
    const direction = x > 0 ? -1 : 1;
    
    // Backboard
    const backboardGeometry = new THREE.BoxGeometry(0.1, 1.2, 1.8);
    const backboardMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
      roughness: 0.1,
      metalness: 0.5,
    });
    const backboard = new THREE.Mesh(backboardGeometry, backboardMaterial);
    backboard.position.set(x, y + 0.5, z);
    backboard.castShadow = true;
    this.scene.add(backboard);

    // Backboard frame
    const frameGeometry = new THREE.BoxGeometry(0.12, 1.25, 1.85);
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      roughness: 0.5,
      metalness: 0.5,
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(x - direction * 0.01, y + 0.5, z);
    this.scene.add(frame);

    // Rim
    const rimGeometry = new THREE.TorusGeometry(0.23, 0.02, 16, 32);
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4500,
      roughness: 0.3,
      metalness: 0.7,
    });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(x + direction * 0.4, y, z);
    rim.castShadow = true;
    this.scene.add(rim);

    // Rim connector
    const connectorGeometry = new THREE.BoxGeometry(0.4, 0.05, 0.05);
    const connector = new THREE.Mesh(connectorGeometry, rimMaterial);
    connector.position.set(x + direction * 0.2, y, z);
    this.scene.add(connector);

    // Net (simplified)
    const netGeometry = new THREE.CylinderGeometry(0.23, 0.15, 0.4, 12, 1, true);
    const netMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.7,
    });
    const net = new THREE.Mesh(netGeometry, netMaterial);
    net.position.set(x + direction * 0.4, y - 0.2, z);
    this.scene.add(net);

    // Pole
    const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, y + 1, 16);
    const poleMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.5,
      metalness: 0.5,
    });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(x - direction * 1.5, (y + 1) / 2 - 1, z);
    pole.castShadow = true;
    this.scene.add(pole);

    // Support arm
    const armGeometry = new THREE.BoxGeometry(1.5, 0.15, 0.15);
    const arm = new THREE.Mesh(armGeometry, poleMaterial);
    arm.position.set(x - direction * 0.75, y + 1, z);
    arm.castShadow = true;
    this.scene.add(arm);
  }

  private createBleachers(): void {
    // Create simple bleacher stands around the court
    const bleacherMaterial = new THREE.MeshStandardMaterial({
      color: 0x2c3e50,
      roughness: 0.9,
    });

    // Side bleachers
    [-1, 1].forEach(side => {
      const bleacherGeometry = new THREE.BoxGeometry(30, 4, 6);
      const bleacher = new THREE.Mesh(bleacherGeometry, bleacherMaterial);
      bleacher.position.set(0, 2, side * 13);
      this.scene.add(bleacher);
    });

    // End bleachers
    [-1, 1].forEach(side => {
      const bleacherGeometry = new THREE.BoxGeometry(4, 4, 20);
      const bleacher = new THREE.Mesh(bleacherGeometry, bleacherMaterial);
      bleacher.position.set(side * 18, 2, 0);
      this.scene.add(bleacher);
    });
  }
}
