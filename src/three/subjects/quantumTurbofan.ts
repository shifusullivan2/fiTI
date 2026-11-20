import * as THREE from 'three';
import { MaterialLibrary } from '../materials.ts';
import { calculateExplodedOffset } from '../../logic/kinematics.ts';

export interface ExplodedPart {
  mesh: THREE.Object3D;
  basePos: THREE.Vector3;
  explodeDir: [number, number, number];
  maxDistance: number;
}

export class QuantumTurbofanSubject {
  public group: THREE.Group;
  private parts: ExplodedPart[] = [];
  private rotorGroup: THREE.Group;
  private turbineGroup: THREE.Group;
  private compressorGroup: THREE.Group;
  private plasmaRing: THREE.Mesh;

  constructor(materials: MaterialLibrary) {
    this.group = new THREE.Group();
    this.group.name = 'QuantumTurbofan';

    // 1. Ground Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(10, 8);
    const shadowMesh = new THREE.Mesh(shadowGeo, materials.shadowPlane);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, 0.002, 0);
    this.group.add(shadowMesh);

    // 2. Heavy-Duty Ground Test Stand Mount
    const standGroup = new THREE.Group();
    const standBaseGeo = new THREE.BoxGeometry(3.5, 0.25, 4.0);
    const standBase = new THREE.Mesh(standBaseGeo, materials.secondary);
    standBase.position.y = 0.125;
    standBase.receiveShadow = true;
    standGroup.add(standBase);

    // Twin structural upright pylons
    const pylonGeo = new THREE.BoxGeometry(0.3, 1.8, 0.4);
    const pylonL = new THREE.Mesh(pylonGeo, materials.primary);
    pylonL.position.set(-1.4, 1.0, 0);
    pylonL.castShadow = true;
    const pylonR = new THREE.Mesh(pylonGeo, materials.primary);
    pylonR.position.set(1.4, 1.0, 0);
    pylonR.castShadow = true;
    standGroup.add(pylonL, pylonR);

    this.group.add(standGroup);
    this.registerPart(standGroup, [0, -1, 0], 1.5);

    // Engine center axis sits at y = 1.85
    const engineCenterY = 1.85;

    // 3. Titanium Intake Spinner Cone with Vortex Shape
    const spinnerPoints = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const r = Math.pow(t, 0.7) * 0.55;
      const z = (1 - t) * 0.9;
      spinnerPoints.push(new THREE.Vector2(r, z));
    }
    const spinnerGeo = new THREE.LatheGeometry(spinnerPoints, 32);
    const spinnerMesh = new THREE.Mesh(spinnerGeo, materials.accent);
    spinnerMesh.rotation.x = Math.PI / 2;

    this.rotorGroup = new THREE.Group();
    this.rotorGroup.position.set(0, engineCenterY, 1.4);
    this.rotorGroup.add(spinnerMesh);

    // 4. Primary Fan Rotor (22 Twisted Aerofoil Blades)
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0, 0);
    bladeShape.lineTo(0.14, 0.04);
    bladeShape.lineTo(0.18, 1.35);
    bladeShape.lineTo(-0.06, 1.38);
    bladeShape.lineTo(-0.08, 0.05);
    bladeShape.closePath();

    const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01 });
    const bladeMat = materials.primary;

    for (let b = 0; b < 22; b++) {
      const bAngle = (b * Math.PI * 2) / 22;
      const bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
      bladeMesh.rotation.z = bAngle;
      // Twist along radial span
      bladeMesh.rotation.y = 0.35 + Math.sin(bAngle * 3) * 0.05;
      bladeMesh.position.set(0, 0, 0.2);
      bladeMesh.castShadow = true;
      this.rotorGroup.add(bladeMesh);
    }
    this.group.add(this.rotorGroup);
    this.registerPart(this.rotorGroup, [0, 0, 1.2], 3.2);

    // 5. Stator Guide Vanes Assembly
    const statorGroup = new THREE.Group();
    statorGroup.position.set(0, engineCenterY, 0.8);
    const statorRingGeo = new THREE.TorusGeometry(1.45, 0.06, 12, 48);
    const statorRing = new THREE.Mesh(statorRingGeo, materials.titaniumDark);
    statorGroup.add(statorRing);

    for (let s = 0; s < 18; s++) {
      const sAngle = (s * Math.PI * 2) / 18;
      const vGeo = new THREE.BoxGeometry(0.04, 1.35, 0.15);
      const vane = new THREE.Mesh(vGeo, materials.titaniumDark);
      vane.rotation.z = sAngle;
      vane.position.set(Math.cos(sAngle) * 0.75, Math.sin(sAngle) * 0.75, 0);
      statorGroup.add(vane);
    }
    this.group.add(statorGroup);
    this.registerPart(statorGroup, [0, 0, 0.6], 2.2);

    // 6. Multi-Stage Axial Compressor Discs & Housing
    this.compressorGroup = new THREE.Group();
    this.compressorGroup.position.set(0, engineCenterY, 0.1);
    for (let c = 0; c < 3; c++) {
      const cZ = c * -0.35;
      const cDiscGeo = new THREE.CylinderGeometry(0.7 - c * 0.08, 0.7 - c * 0.08, 0.12, 32);
      const cDisc = new THREE.Mesh(cDiscGeo, materials.secondary);
      cDisc.rotation.x = Math.PI / 2;
      cDisc.position.z = cZ;
      this.compressorGroup.add(cDisc);

      // Micro blades on perimeter
      for (let m = 0; m < 20; m++) {
        const ma = (m * Math.PI * 2) / 20;
        const mbGeo = new THREE.BoxGeometry(0.02, 0.22, 0.08);
        const mb = new THREE.Mesh(mbGeo, materials.accent);
        mb.position.set(Math.cos(ma) * (0.8 - c * 0.08), Math.sin(ma) * (0.8 - c * 0.08), cZ);
        mb.rotation.z = ma;
        this.compressorGroup.add(mb);
      }
    }
    this.group.add(this.compressorGroup);
    this.registerPart(this.compressorGroup, [0, 0, 0.1], 1.8);

    // 7. Annular Combustion Chamber Liner with Fuel Nozzles
    const combustorGroup = new THREE.Group();
    combustorGroup.position.set(0, engineCenterY, -1.0);
    const linerGeo = new THREE.CylinderGeometry(0.65, 0.62, 0.8, 32, 1, true);
    const liner = new THREE.Mesh(linerGeo, materials.bluedSteel);
    liner.rotation.x = Math.PI / 2;
    combustorGroup.add(liner);

    // 12 Radial fuel injection manifolds
    for (let f = 0; f < 12; f++) {
      const fa = (f * Math.PI * 2) / 12;
      const injGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.25, 12);
      const inj = new THREE.Mesh(injGeo, materials.gearGold);
      inj.position.set(Math.cos(fa) * 0.75, Math.sin(fa) * 0.75, 0);
      inj.rotation.z = fa + Math.PI / 2;
      combustorGroup.add(inj);
    }
    this.group.add(combustorGroup);
    this.registerPart(combustorGroup, [0, 0, -0.6], 2.4);

    // 8. High-Pressure Turbine Stage
    this.turbineGroup = new THREE.Group();
    this.turbineGroup.position.set(0, engineCenterY, -1.6);
    const turbDiscGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.15, 32);
    const turbDisc = new THREE.Mesh(turbDiscGeo, materials.accent);
    turbDisc.rotation.x = Math.PI / 2;
    this.turbineGroup.add(turbDisc);

    // Serrated fir-tree blade roots
    for (let tb = 0; tb < 24; tb++) {
      const tba = (tb * Math.PI * 2) / 24;
      const tbladeGeo = new THREE.BoxGeometry(0.03, 0.35, 0.1);
      const tblade = new THREE.Mesh(tbladeGeo, materials.gearGold);
      tblade.position.set(Math.cos(tba) * 0.85, Math.sin(tba) * 0.85, 0);
      tblade.rotation.z = tba;
      this.turbineGroup.add(tblade);
    }
    this.group.add(this.turbineGroup);
    this.registerPart(this.turbineGroup, [0, 0, -1.2], 3.0);

    // 9. Coaxial Dual Drive Shafts & Bearing Supports
    const shaftGroup = new THREE.Group();
    shaftGroup.position.set(0, engineCenterY, 0);
    const shaftGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.4, 24);
    const shaft = new THREE.Mesh(shaftGeo, materials.secondary);
    shaft.rotation.x = Math.PI / 2;
    shaftGroup.add(shaft);
    this.group.add(shaftGroup);
    this.registerPart(shaftGroup, [0, 0.5, 0], 1.6);

    // 10. Articulated Thrust-Vectoring Exhaust Petals
    const nozzleGroup = new THREE.Group();
    nozzleGroup.position.set(0, engineCenterY, -2.2);
    for (let p = 0; p < 16; p++) {
      const pa = (p * Math.PI * 2) / 16;
      const petalGeo = new THREE.BoxGeometry(0.18, 0.04, 0.6);
      const petal = new THREE.Mesh(petalGeo, materials.titaniumDark);
      petal.position.set(Math.cos(pa) * 0.72, Math.sin(pa) * 0.72, -0.3);
      petal.rotation.z = pa;
      petal.rotation.x = -0.15; // convergent taper
      nozzleGroup.add(petal);
    }
    this.group.add(nozzleGroup);
    this.registerPart(nozzleGroup, [0, 0, -2.0], 3.6);

    // 11. Split Outer Bypass Cowling (Left & Right Gull-Wing Doors)
    const cowlGeo = new THREE.CylinderGeometry(1.6, 1.5, 3.2, 32, 1, true, 0, Math.PI * 0.95);
    const cowlL = new THREE.Mesh(cowlGeo, materials.primary);
    cowlL.rotation.x = Math.PI / 2;
    cowlL.rotation.z = Math.PI * 0.025;
    cowlL.position.set(0, engineCenterY, 0);
    this.group.add(cowlL);
    this.registerPart(cowlL, [1.4, 0.8, 0], 3.5);

    const cowlR = new THREE.Mesh(cowlGeo, materials.primary);
    cowlR.rotation.x = Math.PI / 2;
    cowlR.rotation.z = Math.PI * 1.025;
    cowlR.position.set(0, engineCenterY, 0);
    this.group.add(cowlR);
    this.registerPart(cowlR, [-1.4, 0.8, 0], 3.5);

    // 12. Ionizing Plasma Ring
    const plasmaGeo = new THREE.TorusGeometry(1.3, 0.04, 16, 64);
    this.plasmaRing = new THREE.Mesh(plasmaGeo, materials.plasmaGlow);
    this.plasmaRing.position.set(0, engineCenterY, -1.9);
    this.group.add(this.plasmaRing);
    this.registerPart(this.plasmaRing, [0, 0, -1.6], 3.2);
  }

  private registerPart(mesh: THREE.Object3D, explodeDir: [number, number, number], maxDistance: number) {
    this.parts.push({
      mesh,
      basePos: mesh.position.clone(),
      explodeDir,
      maxDistance,
    });
  }

  public update(timeSeconds: number, explosionFactor: number, speedMultiplier: number = 1.0) {
    // 1. Exploded view offset
    for (const part of this.parts) {
      const offset = calculateExplodedOffset(explosionFactor, part.explodeDir, part.maxDistance);
      part.mesh.position.set(
        part.basePos.x + offset[0],
        part.basePos.y + offset[1],
        part.basePos.z + offset[2]
      );
    }

    if (speedMultiplier <= 0) return;

    // 2. High-speed turbomachinery rotation
    const rotorRpm = 1200 * speedMultiplier;
    const rotorRadS = (rotorRpm * 2 * Math.PI) / 60;
    this.rotorGroup.rotation.z = timeSeconds * rotorRadS * 0.2;
    this.compressorGroup.rotation.z = timeSeconds * rotorRadS * 0.35;
    this.turbineGroup.rotation.z = timeSeconds * rotorRadS * 0.35;

    // Subtle plasma pulsation
    const glowScale = 1.0 + Math.sin(timeSeconds * 12) * 0.08;
    this.plasmaRing.scale.set(glowScale, glowScale, 1.0);
  }
}
