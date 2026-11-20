import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createMaterialLibrary, MaterialLibrary, FinishPreset } from './materials.ts';
import { ChronosTourbillonSubject } from './subjects/chronosTourbillon.ts';
import { QuantumTurbofanSubject } from './subjects/quantumTurbofan.ts';
import { KeplerRoverSubject } from './subjects/keplerRover.ts';
import { dampExp } from '../logic/kinematics.ts';

export type SubjectId = 'chronos' | 'turbofan' | 'rover';
export type CameraPreset = 'hero' | 'macro' | 'ortho-top' | 'low-rake';

export interface SceneManagerOptions {
  container: HTMLDivElement;
  onSubjectChange?: (subjectId: SubjectId) => void;
}

export class SceneManager {
  private container: HTMLDivElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private materials: MaterialLibrary;
  private isSoftwareGl: boolean;

  private currentSubjectId: SubjectId = 'chronos';
  private chronosSubject: ChronosTourbillonSubject;
  private turbofanSubject: QuantumTurbofanSubject;
  private roverSubject: KeplerRoverSubject;

  private explosionFactor = 0.0;
  private targetExplosionFactor = 0.0;
  private speedMultiplier = 1.0;
  private isWireframe = false;

  private animFrameId = 0;
  private isRunning = true;
  private clock = new THREE.Clock();

  // Smooth camera preset interpolation
  private isTransitioningCamera = false;
  private targetCameraPos = new THREE.Vector3();
  private targetControlsTarget = new THREE.Vector3();

  constructor(options: SceneManagerOptions) {
    this.container = options.container;

    // 1. Software-WebGL Probe (Renderer string, not user-agent)
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // 2. High-Performance PBR Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);
    this.container.appendChild(this.renderer.domElement);

    // 3. Scene & Horizon Fog
    this.scene = new THREE.Scene();
    const bgColor = 0x0A0D14; // Deep aerospace obsidian
    this.scene.background = new THREE.Color(bgColor);
    this.scene.fog = new THREE.FogExp2(bgColor, 0.025);

    // 4. Procedural Studio Environment Reflection
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Camera & Damped Controls
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(4.5, 3.2, 5.0);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.05; // allow slightly below ground glancing
    this.controls.minDistance = 1.0;
    this.controls.maxDistance = 25.0;
    this.controls.target.set(0, 0.8, 0);
    this.controls.update();

    // Cancel camera preset transition on manual user orbit
    this.controls.addEventListener('start', () => {
      this.isTransitioningCamera = false;
    });

    // 6. Studio 3-Point Lighting Rig
    // Warm Key Light (Tight Shadow Frustum)
    const keyLight = new THREE.DirectionalLight(0xFFF1DC, 2.6);
    keyLight.position.set(5, 8, 4);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 20;
    keyLight.shadow.camera.left = -4.5;
    keyLight.shadow.camera.right = 4.5;
    keyLight.shadow.camera.top = 4.5;
    keyLight.shadow.camera.bottom = -4.5;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    this.scene.add(keyLight);

    // Cool Sky/Ground Fill Light
    const fillLight = new THREE.HemisphereLight(0xDBEAFE, 0x1E293B, 1.2);
    fillLight.position.set(0, 10, 0);
    this.scene.add(fillLight);

    // Crisp Blue Rim / Back Light
    const rimLight = new THREE.DirectionalLight(0x60A5FA, 1.4);
    rimLight.position.set(-6, 5, -6);
    this.scene.add(rimLight);

    // 7. Materials & 3D Procedural Subjects
    this.materials = createMaterialLibrary(this.isSoftwareGl);

    this.chronosSubject = new ChronosTourbillonSubject(this.materials, this.renderer);
    this.turbofanSubject = new QuantumTurbofanSubject(this.materials);
    this.roverSubject = new KeplerRoverSubject(this.materials);

    // Initially show Chronos Tourbillon
    this.scene.add(this.chronosSubject.group);

    // Pre-warm shaders
    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    // 8. Window resize handler
    window.addEventListener('resize', this.onResize);

    // 9. Start continuous animation loop
    this.tick();
  }

  private onResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  /**
   * Software-WebGL frame pacing: waits for CPU draw to finish, then pauses 80ms.
   */
  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.animFrameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.animFrameId = window.setTimeout(cb, 80);
      }
    };
    this.animFrameId = window.setTimeout(poll, 5);
  }

  private tick = () => {
    if (!this.isRunning) return;

    const dt = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Exponential damping for exploded view transition
    this.explosionFactor = dampExp(this.explosionFactor, this.targetExplosionFactor, 6.0, dt);

    // 2. Exponential damping for camera preset transitions
    if (this.isTransitioningCamera) {
      this.camera.position.x = dampExp(this.camera.position.x, this.targetCameraPos.x, 4.0, dt);
      this.camera.position.y = dampExp(this.camera.position.y, this.targetCameraPos.y, 4.0, dt);
      this.camera.position.z = dampExp(this.camera.position.z, this.targetCameraPos.z, 4.0, dt);

      this.controls.target.x = dampExp(this.controls.target.x, this.targetControlsTarget.x, 4.0, dt);
      this.controls.target.y = dampExp(this.controls.target.y, this.targetControlsTarget.y, 4.0, dt);
      this.controls.target.z = dampExp(this.controls.target.z, this.targetControlsTarget.z, 4.0, dt);

      if (this.camera.position.distanceTo(this.targetCameraPos) < 0.05) {
        this.isTransitioningCamera = false;
      }
    }

    this.controls.update();

    // 3. Update active subject kinematics
    if (this.currentSubjectId === 'chronos') {
      this.chronosSubject.update(elapsedTime, this.explosionFactor, this.speedMultiplier);
    } else if (this.currentSubjectId === 'turbofan') {
      this.turbofanSubject.update(elapsedTime, this.explosionFactor, this.speedMultiplier);
    } else if (this.currentSubjectId === 'rover') {
      this.roverSubject.update(elapsedTime, this.explosionFactor, this.speedMultiplier);
    }

    // 4. Render
    this.renderer.render(this.scene, this.camera);

    // 5. Pace next frame
    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.animFrameId = requestAnimationFrame(this.tick);
    }
  };

  public setSubject(id: SubjectId) {
    if (id === this.currentSubjectId) return;

    // Remove old subject
    this.scene.remove(this.chronosSubject.group);
    this.scene.remove(this.turbofanSubject.group);
    this.scene.remove(this.roverSubject.group);

    this.currentSubjectId = id;

    // Add new subject & adjust camera target height
    if (id === 'chronos') {
      this.scene.add(this.chronosSubject.group);
      this.setCameraPreset('hero');
    } else if (id === 'turbofan') {
      this.scene.add(this.turbofanSubject.group);
      this.targetControlsTarget.set(0, 1.8, 0);
      this.targetCameraPos.set(4.8, 3.5, 4.8);
      this.isTransitioningCamera = true;
    } else if (id === 'rover') {
      this.scene.add(this.roverSubject.group);
      this.targetControlsTarget.set(0, 1.0, 0);
      this.targetCameraPos.set(4.5, 3.0, 4.5);
      this.isTransitioningCamera = true;
    }
  }

  public setExplosionFactor(factor: number) {
    this.targetExplosionFactor = Math.max(0, Math.min(1, factor));
  }

  public setSpeedMultiplier(multiplier: number) {
    this.speedMultiplier = Math.max(0, multiplier);
  }

  public setFinish(preset: FinishPreset) {
    this.materials.setFinish(preset);
  }

  public setWireframe(enable: boolean) {
    this.isWireframe = enable;
    this.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => {
            if ('wireframe' in m) (m as any).wireframe = enable;
          });
        } else if (mesh.material && 'wireframe' in mesh.material) {
          (mesh.material as any).wireframe = enable;
        }
      }
    });
  }

  public setCameraPreset(preset: CameraPreset) {
    this.isTransitioningCamera = true;
    const targetY = this.currentSubjectId === 'turbofan' ? 1.8 : this.currentSubjectId === 'rover' ? 1.0 : 0.6;

    switch (preset) {
      case 'hero':
        this.targetCameraPos.set(4.5, targetY + 2.2, 5.0);
        this.targetControlsTarget.set(0, targetY, 0);
        break;
      case 'macro':
        this.targetCameraPos.set(1.4, targetY + 0.8, 1.6);
        this.targetControlsTarget.set(0.3, targetY, 0);
        break;
      case 'ortho-top':
        this.targetCameraPos.set(0.01, targetY + 6.5, 0.01);
        this.targetControlsTarget.set(0, targetY, 0);
        break;
      case 'low-rake':
        this.targetCameraPos.set(4.8, targetY - 0.2, 2.2);
        this.targetControlsTarget.set(0, targetY, 0);
        break;
    }
  }

  public getCurrentKinematicsData() {
    return {
      currentSubject: this.currentSubjectId,
      explosionFactor: this.targetExplosionFactor,
      speedMultiplier: this.speedMultiplier,
      isSoftwareGl: this.isSoftwareGl,
      cameraPos: [
        Number(this.camera.position.x.toFixed(2)),
        Number(this.camera.position.y.toFixed(2)),
        Number(this.camera.position.z.toFixed(2)),
      ],
      wireframe: this.isWireframe,
    };
  }

  public dispose() {
    this.isRunning = false;
    window.removeEventListener('resize', this.onResize);
    cancelAnimationFrame(this.animFrameId);
    clearTimeout(this.animFrameId);
    this.controls.dispose();
    this.materials.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
