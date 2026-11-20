import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePlanetaryGears,
  calculateBalanceOscillation,
  calculateTurbofanMetrics,
  calculateRockerBogiePitch,
  calculateExplodedOffset,
  dampExp,
  calculateThermalExpansion,
} from './kinematics.ts';

test('calculatePlanetaryGears computes correct planet teeth and speed ratios', () => {
  // Sun: 24 teeth, Ring: 72 teeth -> Planet: (72 - 24)/2 = 24 teeth
  const system = calculatePlanetaryGears(24, 72, 3);
  assert.equal(system.planetTeeth, 24);
  // carrierRatio = 24 / (24 + 72) = 24 / 96 = 0.25
  assert.equal(system.carrierRatio, 0.25);
  // planetSpeedRatio = -(1 - 0.25) * (24 / 24) = -0.75
  assert.equal(system.planetSpeedRatio, -0.75);
});

test('calculatePlanetaryGears throws on invalid inputs', () => {
  assert.throws(() => calculatePlanetaryGears(-10, 50));
  assert.throws(() => calculatePlanetaryGears(50, 40));
  // Odd difference: 51 - 24 = 27 (cannot have half-tooth planet)
  assert.throws(() => calculatePlanetaryGears(24, 51));
});

test('calculateBalanceOscillation follows harmonic motion', () => {
  const atZero = calculateBalanceOscillation(0, 4, 5.0);
  assert.equal(atZero.angle, 0);
  assert.ok(Math.abs(atZero.velocity - 5.0 * 2 * Math.PI * 4) < 1e-4);

  // At quarter period: t = 1 / (4 * 4) = 1/16 = 0.0625s -> angle should be max amplitude (5.0)
  const atQuarter = calculateBalanceOscillation(0.0625, 4, 5.0);
  assert.ok(Math.abs(atQuarter.angle - 5.0) < 1e-4);
  assert.ok(Math.abs(atQuarter.velocity) < 1e-4);
});

test('calculateTurbofanMetrics computes tip speed and g-forces', () => {
  const metrics = calculateTurbofanMetrics(3000, 1.0);
  assert.equal(metrics.rpm, 3000);
  // omega = 3000 * 2 * pi / 60 = 100 * pi =~ 314.159 rad/s
  assert.ok(Math.abs(metrics.omega - 314.159) < 0.1);
  // tipSpeed = omega * 1.0 = ~314.16 m/s
  assert.ok(Math.abs(metrics.tipSpeed - 314.16) < 0.1);
  // tipMach = tipSpeed / 340.29 =~ 0.923 (high subsonic transonic tip)
  assert.ok(metrics.tipMach > 0.9 && metrics.tipMach < 0.95);
  // gForce = omega^2 * r / 9.80665 =~ 314.16^2 / 9.8 =~ 10,064 g
  assert.ok(metrics.gForce > 9000 && metrics.gForce < 11000);
});

test('calculateRockerBogiePitch calculates differential average pitch', () => {
  const pitch = calculateRockerBogiePitch(0.12, -0.04);
  assert.ok(Math.abs(pitch - 0.04) < 1e-6);
});

test('calculateExplodedOffset handles boundaries and cubic easing', () => {
  // At progress 0, offset is 0
  const zero = calculateExplodedOffset(0, [0, 1, 0], 50);
  assert.deepEqual(zero, [0, 0, 0]);

  // At progress 1, offset is full distance
  const full = calculateExplodedOffset(1, [0, 1, 0], 50);
  assert.deepEqual(full, [0, 50, 0]);

  // At progress 0.5, cubic ease out 1 - (1 - 0.5)^3 = 1 - 0.125 = 0.875
  const half = calculateExplodedOffset(0.5, [1, 0, 0], 100);
  assert.equal(half[0], 87.5);
  assert.equal(half[1], 0);
  assert.equal(half[2], 0);
});

test('dampExp smoothly converges towards target without overshoot', () => {
  let val = 0;
  val = dampExp(val, 100, 10, 0.1);
  assert.ok(val > 50 && val < 100);
  // After enough time, reaches very close to target
  val = dampExp(val, 100, 10, 2.0);
  assert.ok(Math.abs(val - 100) < 1e-4);
});

test('calculateThermalExpansion calculates accurate micron-level expansion', () => {
  // Titanium 30mm component with +50C delta, alpha = 8.6 ppm/K
  // deltaL = 30 * 8.6e-6 * 50 = 0.0129 mm = 12.9 microns
  const delta = calculateThermalExpansion(30, 50, 8.6);
  assert.ok(Math.abs(delta - 0.0129) < 1e-5);
});
