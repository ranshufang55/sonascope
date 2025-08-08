import { describe, it, expect } from 'vitest';
import {
  spectralCentroid,
  spectralEntropy,
  spectralFlatness,
  spectralFlux,
  spectralRolloff,
  spectralSpread,
} from './features-spectral.js';

describe('spectral features', () => {
  it('spectralCentroid of an impulse at bin 10 equals 10 * sampleRate / fftSize', () => {
    const m = new Float32Array(64);
    m[10] = 1;
    expect(spectralCentroid(m, 64, 32000)).toBeCloseTo((10 * 32000) / 64, 4);
  });

  it('spectralRolloff(0.85) of energy in low bins is below the Nyquist', () => {
    const m = new Float32Array(64);
    m[0] = 1;
    m[1] = 1;
    m[2] = 1;
    const r = spectralRolloff(m, 64, 32000, 0.85);
    expect(r).toBeLessThan(32000 / 2);
  });

  it('spectralFlatness is 1 for uniform magnitudes and lower for peaked', () => {
    const flat = new Float32Array(8).fill(1);
    const peaked = new Float32Array(8);
    peaked[0] = 1;
    expect(spectralFlatness(flat)).toBeCloseTo(1, 4);
    expect(spectralFlatness(peaked)).toBeLessThan(0.5);
  });

  it('spectralFlux is zero for identical spectra', () => {
    const a = new Float32Array(8).fill(1);
    const b = new Float32Array(8).fill(1);
    expect(spectralFlux(a, b)).toBeCloseTo(0, 6);
  });

  it('spectralEntropy is zero for a single-bin spectrum and positive for spread', () => {
    const a = new Float32Array(8);
    a[0] = 1;
    const b = new Float32Array(8).fill(0.125);
    expect(spectralEntropy(a)).toBeCloseTo(0, 4);
    expect(spectralEntropy(b)).toBeGreaterThan(0);
  });

  it('spectralSpread is non-negative', () => {
    const m = new Float32Array(16);
    m[4] = 1;
    m[5] = 1;
    expect(spectralSpread(m, 16, 16000)).toBeGreaterThanOrEqual(0);
  });
});
it('keeps flatness bounded and invariant for extremely quiet spectra', () => {
  for (const amplitude of [1, 1e-10, 1e-30])
    expect(spectralFlatness([amplitude, amplitude, amplitude])).toBeCloseTo(1, 6);
  expect(spectralFlatness([0, 1, 1])).toBe(0);
  expect(spectralFlatness([0, 0])).toBe(0);
});
