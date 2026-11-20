/**
 * Kinematic calculations, gear ratios, and physics utilities for AetherForge 3D scenes.
 * Decoupled pure logic for fast unit testing and deterministic 60fps simulation.
 */

export interface PlanetaryGearSystem {
  sunTeeth: number;
  ringTeeth: number;
  planetTeeth: number;
  numPlanets: number;
  carrierRatio: number; // Ratio of carrier speed to sun speed with ring stationary
  planetSpeedRatio: number; // Speed of planet on its own axis relative to carrier
}

/**
 * Calculates planetary gear ratios for an epicyclic gear system with fixed ring gear.
 */
export function calculatePlanetaryGears(sunTeeth: number, ringTeeth: number, numPlanets: number = 3): PlanetaryGearSystem {
  if (sunTeeth <= 0 || ringTeeth <= 0) {
    throw new Error('Teeth counts must be positive integers');
  }
  if (ringTeeth <= sunTeeth) {
    throw new Error('Ring gear teeth must be greater than sun gear teeth');
  }
  const diff = ringTeeth - sunTeeth;
  if (diff % 2 !== 0) {
    throw new Error('Ring teeth minus sun teeth must be an even integer for symmetric planets');
  }
  const planetTeeth = diff / 2;

  // When ring is stationary:
  // (omega_sun - omega_carrier) / (0 - omega_carrier) = -ringTeeth / sunTeeth
  // omega_sun / omega_carrier - 1 = ringTeeth / sunTeeth
  // omega_carrier / omega_sun = sunTeeth / (sunTeeth + ringTeeth)
  const carrierRatio = sunTeeth / (sunTeeth + ringTeeth);

  // Planet angular velocity relative to carrier:
  // omega_planet_rel = -(omega_sun - omega_carrier) * (sunTeeth / planetTeeth)
  const planetSpeedRatio = -(1 - carrierRatio) * (sunTeeth / planetTeeth);

  return {
    sunTeeth,
    ringTeeth,
    planetTeeth,
    numPlanets,
    carrierRatio,
    planetSpeedRatio,
  };
}

/**
 * Calculates tourbillon balance spring oscillation angle (harmonic motion in radians).
 * @param timeSeconds Elapsed time in seconds
 * @param frequencyHz Oscillation frequency (typically 3Hz to 4Hz for modern high-beat tourbillons, 21,600 to 28,800 vph)
 * @param amplitudeRad Maximum swing amplitude in radians (~270° - 300° = ~4.7 - 5.2 rad)
 */
export function calculateBalanceOscillation(
  timeSeconds: number,
  frequencyHz: number = 3.5,
  amplitudeRad: number = 4.8
): { angle: number; velocity: number } {
  const omega = 2 * Math.PI * frequencyHz;
  const angle = amplitudeRad * Math.sin(omega * timeSeconds);
  const velocity = amplitudeRad * omega * Math.cos(omega * timeSeconds);
  return { angle, velocity };
}

/**
 * Calculates turbofan rotor aerodynamic and kinetic metrics.
 * @param rpm Rotor speed in revolutions per minute
 * @param fanRadiusM Fan radius in meters
 */
export function calculateTurbofanMetrics(rpm: number, fanRadiusM: number = 1.1) {
  const omega = (rpm * 2 * Math.PI) / 60; // rad/s
  const tipSpeed = omega * fanRadiusM; // m/s
  const speedOfSoundAtSeaLevel = 340.29; // m/s
  const tipMach = tipSpeed / speedOfSoundAtSeaLevel;

  // Approximate centripetal acceleration on outer blade tip (m/s^2)
  const centripetalAcc = omega * omega * fanRadiusM;
  const gForce = centripetalAcc / 9.80665;

  return {
    rpm,
    omega,
    tipSpeed,
    tipMach,
    gForce,
  };
}

/**
 * Rocker-bogie pitch and differential geometry resolver.
 * Computes body pitch angle based on left and right rocker angles.
 */
export function calculateRockerBogiePitch(leftRockerPitch: number, rightRockerPitch: number): number {
  // The differential mechanism averages left and right rocker pitches to maintain chassis stability
  return (leftRockerPitch + rightRockerPitch) * 0.5;
}

/**
 * Computes 3D exploded view offset vector components.
 * Applies a smooth cubic ease-out curve to the explosion factor.
 * @param progress 0.0 (assembled) to 1.0 (fully exploded)
 * @param dir [x, y, z] direction vector (e.g. [0, 1, 0] or [1, 0, 0])
 * @param distance Maximum exploded travel distance
 */
export function calculateExplodedOffset(
  progress: number,
  dir: [number, number, number],
  distance: number
): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, progress));
  // Smooth cubic ease-out: 1 - (1 - t)^3
  const eased = 1 - Math.pow(1 - clamped, 3);
  const offset = eased * distance;
  return [dir[0] * offset, dir[1] * offset, dir[2] * offset];
}

/**
 * Frame-rate independent exponential damping helper.
 * target - current approaches 0 smoothly: current + (target - current) * (1 - Math.exp(-lambda * dt))
 */
export function dampExp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

/**
 * Calculates linear thermal expansion for precision horology / aerospace tolerances.
 * deltaL = L0 * alpha * deltaT
 */
export function calculateThermalExpansion(
  initialLengthMm: number,
  tempDeltaC: number,
  coefExpPpmPerK: number // e.g. Titanium ~8.6 ppm/K, Invar ~1.2 ppm/K
): number {
  return initialLengthMm * (coefExpPpmPerK * 1e-6) * tempDeltaC;
}
