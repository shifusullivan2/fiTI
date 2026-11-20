import * as THREE from 'three';
import {
  createPerlageTexture,
  createGoldFoilTexture,
  createSolarGridTexture,
  createContactShadowTexture,
} from './proceduralTextures.ts';

export type FinishPreset = 'rose-gold' | 'titanium' | 'blued-steel' | 'obsidian' | 'cyber-emerald';

export interface MaterialLibrary {
  primary: THREE.MeshPhysicalMaterial;
  secondary: THREE.MeshStandardMaterial;
  accent: THREE.MeshStandardMaterial;
  perlage: THREE.MeshStandardMaterial;
  rubyJewel: THREE.MeshPhysicalMaterial;
  gearGold: THREE.MeshStandardMaterial;
  bluedSteel: THREE.MeshStandardMaterial;
  titaniumDark: THREE.MeshStandardMaterial;
  sapphireGlass: THREE.MeshPhysicalMaterial;
  goldFoil: THREE.MeshStandardMaterial;
  solarCell: THREE.MeshStandardMaterial;
  plasmaGlow: THREE.MeshStandardMaterial;
  shadowPlane: THREE.MeshBasicMaterial;
  setFinish: (preset: FinishPreset) => void;
  dispose: () => void;
}

export function createMaterialLibrary(isSoftwareGl: boolean): MaterialLibrary {
  const perlageTex = createPerlageTexture();
  const goldFoilTex = createGoldFoilTexture();
  const solarTex = createSolarGridTexture();
  const shadowTex = createContactShadowTexture();

  // Primary finish material (dynamically swappable)
  const primary = new THREE.MeshPhysicalMaterial({
    color: 0xE5A47C, // Default: Rose Gold
    metalness: 0.95,
    roughness: 0.18,
    clearcoat: 0.3,
    clearcoatRoughness: 0.1,
  });

  // Secondary structural material (contrast >= 0.25 roughness)
  const secondary = new THREE.MeshStandardMaterial({
    color: 0x475569, // Slate steel
    metalness: 0.75,
    roughness: 0.45,
  });

  // Accent detail material (bright machined bevels / rivets)
  const accent = new THREE.MeshStandardMaterial({
    color: 0xF1F5F9,
    metalness: 0.95,
    roughness: 0.08,
  });

  // Perlage circular-grained mainplate
  const perlage = new THREE.MeshStandardMaterial({
    color: 0xCBD5E1,
    map: perlageTex,
    metalness: 0.85,
    roughness: 0.3,
  });

  // Horological synthetic ruby jewel bearings
  const rubyJewel = new THREE.MeshPhysicalMaterial({
    color: 0xE11D48,
    metalness: 0.05,
    roughness: 0.05,
    transmission: isSoftwareGl ? 0 : 0.85,
    transparent: true,
    opacity: isSoftwareGl ? 0.6 : 0.95,
    ior: 1.76, // Genuine synthetic corundum / ruby IOR
  });

  // Polished horological brass/gold gear teeth
  const gearGold = new THREE.MeshStandardMaterial({
    color: 0xF59E0B,
    metalness: 0.92,
    roughness: 0.14,
  });

  // Heat-treated blued steel (hands, balance spring, fasteners)
  const bluedSteel = new THREE.MeshStandardMaterial({
    color: 0x1E40AF,
    metalness: 0.9,
    roughness: 0.12,
  });

  // Dark gunmetal / titanium alloy
  const titaniumDark = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.85,
    roughness: 0.35,
  });

  // Front exhibition sapphire dome
  const sapphireGlass = new THREE.MeshPhysicalMaterial({
    color: 0xF8FAFC,
    metalness: 0.05,
    roughness: 0.03,
    transmission: isSoftwareGl ? 0 : 0.96,
    transparent: true,
    opacity: isSoftwareGl ? 0.12 : 0.65,
    ior: 1.77, // Sapphire crystal IOR
    thickness: 1.2,
    depthWrite: false, // Prevents Z-sorting occlusion of inner mechanism
  });

  // Martian MLI gold insulation foil
  const goldFoil = new THREE.MeshStandardMaterial({
    color: 0xF59E0B,
    map: goldFoilTex,
    metalness: 0.92,
    roughness: 0.28,
  });

  // High-efficiency solar cell array
  const solarCell = new THREE.MeshStandardMaterial({
    color: 0x0284C7,
    map: solarTex,
    metalness: 0.5,
    roughness: 0.18,
  });

  // Plasma ionizing field ring
  const plasmaGlow = new THREE.MeshStandardMaterial({
    color: 0x06B6D4,
    emissive: 0x06B6D4,
    emissiveIntensity: 1.8,
    metalness: 0.1,
    roughness: 0.2,
  });

  // Ground radial contact shadow
  const shadowPlane = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });

  function setFinish(preset: FinishPreset) {
    switch (preset) {
      case 'rose-gold':
        primary.color.setHex(0xE5A47C);
        primary.metalness = 0.95;
        primary.roughness = 0.18;
        break;
      case 'titanium':
        primary.color.setHex(0x94A3B8);
        primary.metalness = 0.88;
        primary.roughness = 0.26;
        break;
      case 'blued-steel':
        primary.color.setHex(0x1D4ED8);
        primary.metalness = 0.92;
        primary.roughness = 0.14;
        break;
      case 'obsidian':
        primary.color.setHex(0x18181B);
        primary.metalness = 0.25;
        primary.roughness = 0.42;
        break;
      case 'cyber-emerald':
        primary.color.setHex(0x10B981);
        primary.metalness = 0.92;
        primary.roughness = 0.16;
        break;
    }
    primary.needsUpdate = true;
  }

  function dispose() {
    primary.dispose();
    secondary.dispose();
    accent.dispose();
    perlage.dispose();
    rubyJewel.dispose();
    gearGold.dispose();
    bluedSteel.dispose();
    titaniumDark.dispose();
    sapphireGlass.dispose();
    goldFoil.dispose();
    solarCell.dispose();
    plasmaGlow.dispose();
    shadowPlane.dispose();
  }

  return {
    primary,
    secondary,
    accent,
    perlage,
    rubyJewel,
    gearGold,
    bluedSteel,
    titaniumDark,
    sapphireGlass,
    goldFoil,
    solarCell,
    plasmaGlow,
    shadowPlane,
    setFinish,
    dispose,
  };
}
