import * as THREE from 'three';

/**
 * Procedural texture generator for AetherForge 3D scenes.
 * Generates 100% code-driven textures with zero external file dependencies (no 404s).
 * Enforces SRGBColorSpace and maximum anisotropy for grazing-angle clarity.
 */

// Cache for generated textures to prevent duplicate allocations
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Creates a high-resolution Roman numeral & celestial astrolabe dial ring texture.
 */
export function createDialRingTexture(renderer?: THREE.WebGLRenderer): THREE.CanvasTexture {
  const cacheKey = 'dial_ring_texture';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;

  // Background ring with subtle circular metallic brushing
  ctx.clearRect(0, 0, size, size);

  // Outer circular track
  ctx.beginPath();
  ctx.arc(cx, cy, 470, 0, Math.PI * 2);
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(230, 235, 245, 0.85)';
  ctx.stroke();

  // Minute track (60 tick marks)
  for (let i = 0; i < 60; i++) {
    const angle = (i * Math.PI * 2) / 60 - Math.PI / 2;
    const isFive = i % 5 === 0;
    const rOuter = 460;
    const rInner = isFive ? 425 : 445;

    const x1 = cx + Math.cos(angle) * rOuter;
    const y1 = cy + Math.sin(angle) * rOuter;
    const x2 = cx + Math.cos(angle) * rInner;
    const y2 = cy + Math.sin(angle) * rInner;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = isFive ? 5 : 2;
    ctx.strokeStyle = isFive ? '#F5F8FA' : 'rgba(200, 215, 230, 0.7)';
    ctx.stroke();
  }

  // Roman numerals (I to XII)
  const numerals = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  ctx.font = 'bold 36px "Cinzel", "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FFFFFF';

  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI * 2) / 12 - Math.PI / 2;
    const rText = 385;
    const tx = cx + Math.cos(angle) * rText;
    const ty = cy + Math.sin(angle) * rText;

    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillText(numerals[i], 0, 0);
    ctx.restore();
  }

  // Inner celestial constellation track
  ctx.beginPath();
  ctx.arc(cx, cy, 335, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(160, 200, 255, 0.6)';
  ctx.stroke();

  // Subtle celestial star dots
  ctx.fillStyle = 'rgba(220, 240, 255, 0.9)';
  for (let i = 0; i < 24; i++) {
    const angle = (i * Math.PI * 2) / 24;
    const rStar = 310 + ((i * 17) % 35);
    const sx = cx + Math.cos(angle) * rStar;
    const sy = cy + Math.sin(angle) * rStar;
    ctx.beginPath();
    ctx.arc(sx, sy, (i % 3 === 0) ? 3 : 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  if (renderer) {
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Creates perlage (circular graining / guilloché) texture for high-end watch mainplates.
 */
export function createPerlageTexture(): THREE.CanvasTexture {
  const cacheKey = 'perlage_texture';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#8B939C';
  ctx.fillRect(0, 0, size, size);

  // Overlapping circular brushed discs
  const spacing = 32;
  const radius = 24;

  for (let y = -radius; y <= size + radius; y += spacing) {
    const xOffset = ((Math.floor(y / spacing) % 2) * spacing) / 2;
    for (let x = -radius; x <= size + radius; x += spacing) {
      const grad = ctx.createRadialGradient(x + xOffset, y, 0, x + xOffset, y, radius);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
      grad.addColorStop(0.5, 'rgba(200, 210, 220, 0.25)');
      grad.addColorStop(0.9, 'rgba(90, 100, 110, 0.35)');
      grad.addColorStop(1, 'rgba(40, 45, 50, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x + xOffset, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Creates gold thermal MLI (multi-layer insulation) foil bump map for Mars rover avionics.
 */
export function createGoldFoilTexture(): THREE.CanvasTexture {
  const cacheKey = 'gold_foil_texture';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base amber-gold
  ctx.fillStyle = '#D4A017';
  ctx.fillRect(0, 0, size, size);

  // Procedural crinkles and faceted wrinkles
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const w = 20 + Math.random() * 40;
    const h = 20 + Math.random() * 40;

    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, 'rgba(255, 235, 140, 0.45)');
    grad.addColorStop(0.5, 'rgba(180, 120, 10, 0.3)');
    grad.addColorStop(1, 'rgba(80, 40, 5, 0.4)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y + Math.random() * 10);
    ctx.lineTo(x + w * 0.8, y + h);
    ctx.lineTo(x - Math.random() * 10, y + h * 0.9);
    ctx.closePath();
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Creates solar cell grid texture for rover photovoltaic panels.
 */
export function createSolarGridTexture(): THREE.CanvasTexture {
  const cacheKey = 'solar_grid_texture';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Deep silicon blue
  ctx.fillStyle = '#0F1A2C';
  ctx.fillRect(0, 0, size, size);

  const cells = 8;
  const cellSize = size / cells;

  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 2;

  for (let i = 0; i <= cells; i++) {
    // Grid lines
    ctx.beginPath();
    ctx.moveTo(i * cellSize, 0);
    ctx.lineTo(i * cellSize, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * cellSize);
    ctx.lineTo(size, i * cellSize);
    ctx.stroke();
  }

  // Fine busbars
  ctx.strokeStyle = 'rgba(220, 240, 255, 0.7)';
  ctx.lineWidth = 1;
  for (let c = 0; c < cells; c++) {
    for (let r = 0; r < cells; r++) {
      const bx = c * cellSize + cellSize / 2;
      ctx.beginPath();
      ctx.moveTo(bx, r * cellSize + 4);
      ctx.lineTo(bx, (r + 1) * cellSize - 4);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Creates a soft radial contact shadow texture for grounding 3D subjects.
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const cacheKey = 'contact_shadow_texture';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2;

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
  grad.addColorStop(0.3, 'rgba(0, 0, 0, 0.45)');
  grad.addColorStop(0.65, 'rgba(0, 0, 0, 0.15)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(cacheKey, texture);
  return texture;
}
