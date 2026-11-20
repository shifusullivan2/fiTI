import * as THREE from 'three';
import { MaterialLibrary } from '../materials.ts';
import { calculateExplodedOffset } from '../../logic/kinematics.ts';

export interface ExplodedPart {
  mesh: THREE.Object3D;
  basePos: THREE.Vector3;
  explodeDir: [number, number, number];
  maxDistance: number;
}

export class KeplerRoverSubject {
  public group: THREE.Group;
  private parts: ExplodedPart[] = [];
  private wheels: THREE.Mesh[] = [];
  private mastGroup: THREE.Group;
  private roboticArm: THREE.Group;
  private dishGroup: THREE.Group;

  constructor(materials: MaterialLibrary) {
    this.group = new THREE.Group();
    this.group.name = 'KeplerRover';

    // 1. Ground Contact Shadow & Base
    const shadowGeo = new THREE.PlaneGeometry(9, 9);
    const shadowMesh = new THREE.Mesh(shadowGeo, materials.shadowPlane);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, 0.002, 0);
    this.group.add(shadowMesh);

    // Rover chassis center height at y = 1.2
    const chassisY = 1.2;

    // 2. Rocker-Bogie Titanium Suspension Wishbones (Left & Right)
    const suspensionGroup = new THREE.Group();
    const tubeGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.8, 12);

    // Left rocker
    const rockerL = new THREE.Mesh(tubeGeo, materials.secondary);
    rockerL.rotation.z = 0.55;
    rockerL.position.set(-1.3, 0.85, 0);
    suspensionGroup.add(rockerL);

    // Right rocker
    const rockerR = new THREE.Mesh(tubeGeo, materials.secondary);
    rockerR.rotation.z = -0.55;
    rockerR.position.set(1.3, 0.85, 0);
    suspensionGroup.add(rockerR);

    // Differential crossbar
    const diffBarGeo = new THREE.BoxGeometry(2.6, 0.08, 0.1);
    const diffBar = new THREE.Mesh(diffBarGeo, materials.titaniumDark);
    diffBar.position.set(0, 1.35, -0.4);
    suspensionGroup.add(diffBar);

    this.group.add(suspensionGroup);
    this.registerPart(suspensionGroup, [0, -0.5, 0], 1.6);

    // 3. 6 Deep-Cleat Terrain Wheels with Hub Motors
    const wheelGroup = new THREE.Group();
    const wheelPositions: [number, number, number][] = [
      [-1.6, 0.45, 1.3],  // Front Left
      [1.6, 0.45, 1.3],   // Front Right
      [-1.8, 0.45, 0.0],  // Middle Left
      [1.8, 0.45, 0.0],   // Middle Right
      [-1.6, 0.45, -1.3], // Rear Left
      [1.6, 0.45, -1.3],  // Rear Right
    ];

    const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 24);
    for (const pos of wheelPositions) {
      const wheel = new THREE.Mesh(wheelGeo, materials.primary);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.castShadow = true;
      wheel.receiveShadow = true;

      // Hub motor detail
      const hubGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.36, 16);
      const hub = new THREE.Mesh(hubGeo, materials.accent);
      wheel.add(hub);

      this.wheels.push(wheel);
      wheelGroup.add(wheel);
    }
    this.group.add(wheelGroup);
    this.registerPart(wheelGroup, [0, -0.8, 0], 1.8);

    // 4. Central Warm Electronics Box (WEB) with Gold MLI Foil
    const webGroup = new THREE.Group();
    webGroup.position.set(0, chassisY, 0);
    const webGeo = new THREE.BoxGeometry(1.8, 0.75, 2.2);
    const webMesh = new THREE.Mesh(webGeo, materials.goldFoil);
    webMesh.castShadow = true;
    webMesh.receiveShadow = true;
    webGroup.add(webMesh);

    // Top deck mounting plate
    const deckGeo = new THREE.BoxGeometry(1.9, 0.06, 2.3);
    const deck = new THREE.Mesh(deckGeo, materials.secondary);
    deck.position.y = 0.4;
    webGroup.add(deck);

    this.group.add(webGroup);
    this.registerPart(webGroup, [0, 0.4, 0], 1.4);

    // 5. Panoramic Mastcam Head & Articulated Mast
    this.mastGroup = new THREE.Group();
    this.mastGroup.position.set(-0.55, chassisY + 0.4, 0.75);

    const mastGeo = new THREE.CylinderGeometry(0.04, 0.05, 1.2, 12);
    const mast = new THREE.Mesh(mastGeo, materials.primary);
    mast.position.y = 0.6;
    mast.castShadow = true;
    this.mastGroup.add(mast);

    // Mastcam stereoscopic head
    const headGeo = new THREE.BoxGeometry(0.4, 0.2, 0.25);
    const head = new THREE.Mesh(headGeo, materials.titaniumDark);
    head.position.y = 1.25;
    this.mastGroup.add(head);

    // Dual lenses
    const lensGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.08, 16);
    const lensL = new THREE.Mesh(lensGeo, materials.sapphireGlass);
    lensL.rotation.x = Math.PI / 2;
    lensL.position.set(-0.12, 1.25, 0.15);
    const lensR = new THREE.Mesh(lensGeo, materials.sapphireGlass);
    lensR.rotation.x = Math.PI / 2;
    lensR.position.set(0.12, 1.25, 0.15);
    this.mastGroup.add(lensL, lensR);

    this.group.add(this.mastGroup);
    this.registerPart(this.mastGroup, [-0.6, 1.2, 0.8], 3.0);

    // 6. Steerable High-Gain Parabolic Dish Antenna
    this.dishGroup = new THREE.Group();
    this.dishGroup.position.set(0.55, chassisY + 0.45, -0.6);

    const dishPoints = [];
    for (let i = 0; i <= 16; i++) {
      const u = i / 16;
      dishPoints.push(new THREE.Vector2(u * 0.45, Math.pow(u, 2) * 0.18));
    }
    const dishGeo = new THREE.LatheGeometry(dishPoints, 32);
    const dish = new THREE.Mesh(dishGeo, materials.accent);
    dish.rotation.x = -0.4;
    this.dishGroup.add(dish);

    // Feedhorn sub-reflector
    const hornGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.25, 8);
    const horn = new THREE.Mesh(hornGeo, materials.gearGold);
    horn.rotation.x = -0.4;
    horn.position.set(0, 0.12, 0.1);
    this.dishGroup.add(horn);

    this.group.add(this.dishGroup);
    this.registerPart(this.dishGroup, [0.8, 1.4, -0.8], 2.8);

    // 7. 5-DOF Articulated Robotic Sample Arm
    this.roboticArm = new THREE.Group();
    this.roboticArm.position.set(-0.7, chassisY + 0.2, 1.0);

    // Shoulder segment
    const bicepGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 12);
    const bicep = new THREE.Mesh(bicepGeo, materials.primary);
    bicep.rotation.z = -0.6;
    bicep.position.set(0.25, 0.3, 0.1);
    this.roboticArm.add(bicep);

    // Forearm
    const forearmGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.75, 12);
    const forearm = new THREE.Mesh(forearmGeo, materials.secondary);
    forearm.rotation.x = 0.7;
    forearm.position.set(0.5, 0.45, 0.4);
    this.roboticArm.add(forearm);

    // Turret drill & sensor payload
    const drillGeo = new THREE.CylinderGeometry(0.08, 0.04, 0.28, 12);
    const drill = new THREE.Mesh(drillGeo, materials.titaniumDark);
    drill.position.set(0.5, 0.2, 0.8);
    drill.rotation.x = Math.PI / 2;
    this.roboticArm.add(drill);

    this.group.add(this.roboticArm);
    this.registerPart(this.roboticArm, [-1.2, 0.6, 1.6], 3.2);

    // 8. Radioisotope Thermoelectric Generator (RTG)
    const rtgGroup = new THREE.Group();
    rtgGroup.position.set(0, chassisY + 0.2, -1.45);
    const rtgBodyGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.7, 24);
    const rtgBody = new THREE.Mesh(rtgBodyGeo, materials.titaniumDark);
    rtgBody.rotation.x = Math.PI / 2;
    rtgGroup.add(rtgBody);

    // Radial cooling fins
    for (let f = 0; f < 8; f++) {
      const fa = (f * Math.PI * 2) / 8;
      const finGeo = new THREE.BoxGeometry(0.02, 0.18, 0.65);
      const fin = new THREE.Mesh(finGeo, materials.accent);
      fin.position.set(Math.cos(fa) * 0.28, Math.sin(fa) * 0.28, 0);
      fin.rotation.z = fa;
      rtgGroup.add(fin);
    }
    this.group.add(rtgGroup);
    this.registerPart(rtgGroup, [0, 0.2, -1.8], 2.5);

    // 9. Ultra-High Efficiency Solar Wing Arrays
    const solarGroup = new THREE.Group();
    solarGroup.position.set(0, chassisY + 0.44, 0);

    const wingGeo = new THREE.BoxGeometry(1.2, 0.03, 1.8);
    const wingL = new THREE.Mesh(wingGeo, materials.solarCell);
    wingL.position.set(-1.45, 0, 0);
    const wingR = new THREE.Mesh(wingGeo, materials.solarCell);
    wingR.position.set(1.45, 0, 0);
    solarGroup.add(wingL, wingR);

    this.group.add(solarGroup);
    this.registerPart(solarGroup, [0, 1.0, 0], 2.6);

    // 10. Fore and Aft Hazcam Sensors
    const hazcamGroup = new THREE.Group();
    const hcGeo = new THREE.BoxGeometry(0.22, 0.08, 0.08);
    const hcFront = new THREE.Mesh(hcGeo, materials.titaniumDark);
    hcFront.position.set(0, chassisY - 0.25, 1.15);
    const hcRear = new THREE.Mesh(hcGeo, materials.titaniumDark);
    hcRear.position.set(0, chassisY - 0.25, -1.15);
    hazcamGroup.add(hcFront, hcRear);
    this.group.add(hazcamGroup);
    this.registerPart(hazcamGroup, [0, -0.4, 0], 1.2);

    // 11. Front Bumper Winch & Skid Plate
    const bumperGroup = new THREE.Group();
    const bumperGeo = new THREE.BoxGeometry(1.6, 0.1, 0.12);
    const bumper = new THREE.Mesh(bumperGeo, materials.accent);
    bumper.position.set(0, chassisY - 0.35, 1.35);
    bumperGroup.add(bumper);
    this.group.add(bumperGroup);
    this.registerPart(bumperGroup, [0, -0.2, 1.0], 2.0);

    // 12. Specimen Collection Tube Carousel
    const sampleGroup = new THREE.Group();
    const carouselGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.15, 16);
    const carousel = new THREE.Mesh(carouselGeo, materials.gearGold);
    carousel.position.set(0, chassisY + 0.35, -0.1);
    sampleGroup.add(carousel);
    this.group.add(sampleGroup);
    this.registerPart(sampleGroup, [0, 0.8, 0], 2.2);
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

    // 2. Slow exploratory wheel crawl
    const wheelRot = timeSeconds * speedMultiplier * 1.5;
    for (const w of this.wheels) {
      w.rotation.x = wheelRot;
    }

    // Panoramic Mastcam panning sweep
    this.mastGroup.rotation.y = Math.sin(timeSeconds * 0.4 * speedMultiplier) * 0.8;

    // High gain dish tracking sweep
    this.dishGroup.rotation.y = Math.cos(timeSeconds * 0.25 * speedMultiplier) * 0.5;

    // Robotic arm articulation
    this.roboticArm.rotation.y = Math.sin(timeSeconds * 0.3 * speedMultiplier) * 0.25;
  }
}
