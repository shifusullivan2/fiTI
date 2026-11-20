import * as THREE from 'three';
import { MaterialLibrary } from '../materials.ts';
import { createDialRingTexture } from '../proceduralTextures.ts';
import { calculateBalanceOscillation, calculateExplodedOffset } from '../../logic/kinematics.ts';

export interface ExplodedPart {
  mesh: THREE.Object3D;
  basePos: THREE.Vector3;
  explodeDir: [number, number, number];
  maxDistance: number;
}

export class ChronosTourbillonSubject {
  public group: THREE.Group;
  private parts: ExplodedPart[] = [];
  private cageGroup: THREE.Group;
  private balanceGroup: THREE.Group;
  private escapeWheelGroup: THREE.Group;
  private planetGroup: THREE.Group;
  private hourHand: THREE.Mesh;
  private minuteHand: THREE.Mesh;

  constructor(materials: MaterialLibrary, renderer?: THREE.WebGLRenderer) {
    this.group = new THREE.Group();
    this.group.name = 'ChronosTourbillon';

    // 1. Ground Contact Shadow (Bottom-center pivot grounding)
    const shadowGeo = new THREE.PlaneGeometry(8, 8);
    const shadowMesh = new THREE.Mesh(shadowGeo, materials.shadowPlane);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, 0.002, 0);
    this.group.add(shadowMesh);

    // 2. Outer Titanium Exhibition Case & Knurled Crown
    const caseGroup = new THREE.Group();
    const caseGeo = new THREE.CylinderGeometry(2.6, 2.7, 0.5, 64, 1, true);
    const caseMesh = new THREE.Mesh(caseGeo, materials.primary);
    caseMesh.castShadow = true;
    caseMesh.receiveShadow = true;
    caseMesh.position.y = 0.35;
    caseGroup.add(caseMesh);

    // Beveled bezel ring
    const bezelPoints = [];
    bezelPoints.push(new THREE.Vector2(2.5, 0));
    bezelPoints.push(new THREE.Vector2(2.65, 0.08));
    bezelPoints.push(new THREE.Vector2(2.6, 0.15));
    bezelPoints.push(new THREE.Vector2(2.45, 0.15));
    const bezelGeo = new THREE.LatheGeometry(bezelPoints, 64);
    const bezelMesh = new THREE.Mesh(bezelGeo, materials.accent);
    bezelMesh.position.y = 0.6;
    caseGroup.add(bezelMesh);

    // Knurled Winding Crown at 3 o'clock
    const crownGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.25, 32);
    const crownMesh = new THREE.Mesh(crownGeo, materials.accent);
    crownMesh.rotation.z = Math.PI / 2;
    crownMesh.position.set(2.8, 0.35, 0);
    caseGroup.add(crownMesh);

    this.group.add(caseGroup);
    this.registerPart(caseGroup, [0, -1, 0], 1.2);

    // 3. Perlage Mainplate with Escapement Aperture
    const mainplateGroup = new THREE.Group();
    const plateGeo = new THREE.CylinderGeometry(2.45, 2.45, 0.1, 64);
    const plateMesh = new THREE.Mesh(plateGeo, materials.perlage);
    plateMesh.position.y = 0.25;
    plateMesh.receiveShadow = true;
    mainplateGroup.add(plateMesh);

    // 4 decorative ruby jewel settings on mainplate
    const jewelGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.06, 16);
    const jewelChatonGeo = new THREE.TorusGeometry(0.12, 0.03, 8, 24);
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + 0.4;
      const jx = Math.cos(angle) * 1.5;
      const jz = Math.sin(angle) * 1.5;
      const jm = new THREE.Mesh(jewelGeo, materials.rubyJewel);
      jm.position.set(jx, 0.31, jz);
      const jc = new THREE.Mesh(jewelChatonGeo, materials.gearGold);
      jc.rotation.x = Math.PI / 2;
      jc.position.set(jx, 0.31, jz);
      mainplateGroup.add(jm, jc);
    }

    this.group.add(mainplateGroup);
    this.registerPart(mainplateGroup, [0, -0.6, 0], 1.8);

    // 4. Skeletal Bridge & Arched Arms
    const bridgeGroup = new THREE.Group();
    const bridgeShape = new THREE.Shape();
    bridgeShape.moveTo(-1.6, -0.2);
    bridgeShape.lineTo(1.6, -0.2);
    bridgeShape.lineTo(1.4, 0.2);
    bridgeShape.lineTo(-1.4, 0.2);
    bridgeShape.closePath();

    const extrudeSettings = { depth: 0.06, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 };
    const bridgeGeo = new THREE.ExtrudeGeometry(bridgeShape, extrudeSettings);
    const bridgeMesh = new THREE.Mesh(bridgeGeo, materials.primary);
    bridgeMesh.rotation.x = Math.PI / 2;
    bridgeMesh.position.set(0, 0.42, 0);
    bridgeMesh.castShadow = true;
    bridgeGroup.add(bridgeMesh);

    // Center jewel bearing
    const centerJewel = new THREE.Mesh(jewelGeo, materials.rubyJewel);
    centerJewel.position.set(0, 0.46, 0);
    bridgeGroup.add(centerJewel);

    this.group.add(bridgeGroup);
    this.registerPart(bridgeGroup, [0, 0.8, 0], 2.2);

    // 5. Epicyclic Planetary Gear Train
    this.planetGroup = new THREE.Group();
    // Sun gear (center)
    const sunGeo = this.createToothedGearGeometry(0.35, 18, 0.05);
    const sunMesh = new THREE.Mesh(sunGeo, materials.gearGold);
    sunMesh.rotation.x = Math.PI / 2;
    sunMesh.position.set(-0.8, 0.35, 0.4);
    this.planetGroup.add(sunMesh);

    // 3 Planet pinions
    const planetGeo = this.createToothedGearGeometry(0.25, 12, 0.05);
    for (let p = 0; p < 3; p++) {
      const pAngle = (p * Math.PI * 2) / 3;
      const pm = new THREE.Mesh(planetGeo, materials.secondary);
      pm.rotation.x = Math.PI / 2;
      pm.position.set(-0.8 + Math.cos(pAngle) * 0.6, 0.35, 0.4 + Math.sin(pAngle) * 0.6);
      this.planetGroup.add(pm);
    }
    this.group.add(this.planetGroup);
    this.registerPart(this.planetGroup, [-0.5, 0.3, 0.3], 2.0);

    // 6. Tourbillon Outer Cage (Rotates 360° continuously)
    this.cageGroup = new THREE.Group();
    this.cageGroup.position.set(0.6, 0.4, -0.3);

    // 3-arm cage bottom & top plates
    const cagePillarGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.45, 12);
    for (let i = 0; i < 3; i++) {
      const ca = (i * Math.PI * 2) / 3;
      const cx = Math.cos(ca) * 0.7;
      const cz = Math.sin(ca) * 0.7;
      const pillar = new THREE.Mesh(cagePillarGeo, materials.titaniumDark);
      pillar.position.set(cx, 0.22, cz);
      this.cageGroup.add(pillar);
    }

    // 7. Balance Wheel & Spiral Hairspring
    this.balanceGroup = new THREE.Group();
    this.balanceGroup.position.set(0, 0.25, 0);

    // Balance rim with poise weights
    const balanceRimGeo = new THREE.TorusGeometry(0.65, 0.04, 12, 48);
    const balanceRimMesh = new THREE.Mesh(balanceRimGeo, materials.gearGold);
    balanceRimMesh.rotation.x = Math.PI / 2;
    this.balanceGroup.add(balanceRimMesh);

    // 4 Cross-arms
    const armGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.3, 8);
    const arm1 = new THREE.Mesh(armGeo, materials.gearGold);
    arm1.rotation.z = Math.PI / 2;
    const arm2 = new THREE.Mesh(armGeo, materials.gearGold);
    arm2.rotation.x = Math.PI / 2;
    this.balanceGroup.add(arm1, arm2);

    // Spiral Hairspring (Procedural TubeGeometry)
    const spiralCurve = this.createSpiralCurve(0.08, 0.45, 4.5);
    const hairspringGeo = new THREE.TubeGeometry(spiralCurve, 64, 0.012, 8, false);
    const hairspringMesh = new THREE.Mesh(hairspringGeo, materials.bluedSteel);
    hairspringMesh.rotation.x = Math.PI / 2;
    hairspringMesh.position.y = 0.06;
    this.balanceGroup.add(hairspringMesh);

    this.cageGroup.add(this.balanceGroup);

    // 8. Escape Wheel & Pallet Fork
    this.escapeWheelGroup = new THREE.Group();
    this.escapeWheelGroup.position.set(0.3, 0.12, 0.3);
    const escapeGeo = this.createToothedGearGeometry(0.28, 15, 0.03);
    const escapeMesh = new THREE.Mesh(escapeGeo, materials.bluedSteel);
    escapeMesh.rotation.x = Math.PI / 2;
    this.escapeWheelGroup.add(escapeMesh);
    this.cageGroup.add(this.escapeWheelGroup);

    this.group.add(this.cageGroup);
    this.registerPart(this.cageGroup, [0.8, 0.5, -0.4], 2.8);

    // 9. Astrolabe Roman Numeral Dial Ring
    const dialTex = createDialRingTexture(renderer);
    const dialMat = new THREE.MeshStandardMaterial({
      map: dialTex,
      transparent: true,
      roughness: 0.2,
      metalness: 0.8,
    });
    const dialRingGeo = new THREE.RingGeometry(1.6, 2.4, 64);
    const dialMesh = new THREE.Mesh(dialRingGeo, dialMat);
    dialMesh.rotation.x = -Math.PI / 2;
    dialMesh.position.set(0, 0.52, 0);
    this.group.add(dialMesh);
    this.registerPart(dialMesh, [0, 1.2, 0], 3.2);

    // 10. Blued Breguet-style Openworked Hands
    const handsGroup = new THREE.Group();
    handsGroup.position.set(0, 0.56, 0);

    const minuteShape = new THREE.Shape();
    minuteShape.moveTo(-0.06, 0);
    minuteShape.lineTo(0.06, 0);
    minuteShape.lineTo(0.04, 1.5);
    minuteShape.absarc(0, 1.6, 0.12, -Math.PI / 2, Math.PI * 1.5, false);
    minuteShape.lineTo(0, 1.9);
    minuteShape.lineTo(-0.04, 1.5);
    minuteShape.closePath();
    const minuteGeo = new THREE.ExtrudeGeometry(minuteShape, { depth: 0.02, bevelEnabled: false });
    this.minuteHand = new THREE.Mesh(minuteGeo, materials.bluedSteel);
    this.minuteHand.rotation.x = -Math.PI / 2;
    handsGroup.add(this.minuteHand);

    const hourShape = new THREE.Shape();
    hourShape.moveTo(-0.08, 0);
    hourShape.lineTo(0.08, 0);
    hourShape.lineTo(0.05, 1.0);
    hourShape.absarc(0, 1.1, 0.15, -Math.PI / 2, Math.PI * 1.5, false);
    hourShape.lineTo(0, 1.35);
    hourShape.lineTo(-0.05, 1.0);
    hourShape.closePath();
    const hourGeo = new THREE.ExtrudeGeometry(hourShape, { depth: 0.02, bevelEnabled: false });
    this.hourHand = new THREE.Mesh(hourGeo, materials.bluedSteel);
    this.hourHand.rotation.x = -Math.PI / 2;
    this.hourHand.position.y = -0.01;
    handsGroup.add(this.hourHand);

    this.group.add(handsGroup);
    this.registerPart(handsGroup, [0, 1.5, 0], 3.8);

    // 11. Winding Mainspring Barrel & Geneva Ratchet
    const barrelGroup = new THREE.Group();
    const barrelGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.22, 32);
    const barrelMesh = new THREE.Mesh(barrelGeo, materials.gearGold);
    barrelMesh.position.set(-1.1, 0.35, -0.9);
    barrelGroup.add(barrelMesh);
    this.group.add(barrelGroup);
    this.registerPart(barrelGroup, [-1.2, 0.4, -0.8], 2.4);

    // 12. Sapphire Front Exhibition Dome
    const domeGeo = new THREE.SphereGeometry(2.55, 48, 24, 0, Math.PI * 2, 0, Math.PI / 4.5);
    const domeMesh = new THREE.Mesh(domeGeo, materials.sapphireGlass);
    domeMesh.position.set(0, -1.15, 0);
    this.group.add(domeMesh);
    this.registerPart(domeMesh, [0, 1.8, 0], 3.8);
  }

  private registerPart(mesh: THREE.Object3D, explodeDir: [number, number, number], maxDistance: number) {
    this.parts.push({
      mesh,
      basePos: mesh.position.clone(),
      explodeDir,
      maxDistance,
    });
  }

  private createToothedGearGeometry(radius: number, teeth: number, thickness: number): THREE.BufferGeometry {
    const shape = new THREE.Shape();
    const innerRadius = radius * 0.85;
    const outerRadius = radius * 1.15;
    const totalSteps = teeth * 2;

    for (let i = 0; i < totalSteps; i++) {
      const angle = (i * Math.PI * 2) / totalSteps;
      const isTip = i % 2 === 0;
      const r = isTip ? outerRadius : innerRadius;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();

    // Center arbor hole
    const holePath = new THREE.Path();
    holePath.absarc(0, 0, radius * 0.25, 0, Math.PI * 2, true);
    shape.holes.push(holePath);

    return new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.015,
      bevelThickness: 0.015,
    });
  }

  private createSpiralCurve(innerR: number, outerR: number, turns: number): THREE.Curve<THREE.Vector3> {
    const points: THREE.Vector3[] = [];
    const steps = 80;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const theta = t * turns * Math.PI * 2;
      const r = innerR + (outerR - innerR) * t;
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      const z = t * 0.02;
      points.push(new THREE.Vector3(x, y, z));
    }
    return new THREE.CatmullRomCurve3(points);
  }

  public update(timeSeconds: number, explosionFactor: number, speedMultiplier: number = 1.0) {
    // 1. Update Exploded view positions with smooth cubic easing
    for (const part of this.parts) {
      const offset = calculateExplodedOffset(explosionFactor, part.explodeDir, part.maxDistance);
      part.mesh.position.set(
        part.basePos.x + offset[0],
        part.basePos.y + offset[1],
        part.basePos.z + offset[2]
      );
    }

    if (speedMultiplier <= 0) return;

    // 2. Kinematic updates
    // Tourbillon cage rotates 1 revolution per 60s (scaled by multiplier)
    const cageSpeed = (Math.PI * 2 * speedMultiplier) / 60;
    this.cageGroup.rotation.y = timeSeconds * cageSpeed * 6; // slightly accelerated for engaging visual preview

    // Balance wheel harmonic oscillation (~3.5 Hz)
    const osc = calculateBalanceOscillation(timeSeconds * speedMultiplier, 3.5, 4.8);
    this.balanceGroup.rotation.y = osc.angle;

    // Escape wheel advances on escapement ticks
    this.escapeWheelGroup.rotation.z = timeSeconds * speedMultiplier * 8;

    // Epicyclic planetary rotation
    this.planetGroup.rotation.y = timeSeconds * speedMultiplier * 0.5;

    // Horological hands rotation
    this.minuteHand.rotation.z = -timeSeconds * speedMultiplier * 0.15;
    this.hourHand.rotation.z = -timeSeconds * speedMultiplier * 0.0125;
  }
}
