import { describe, it, expect } from 'vitest';
import {
  clipHard,
  clipSoft,
  dcRemoveHpf,
  dcRemoveMean,
  deEmphasis,
  normalizePeak,
  normalizeRms,
  preEmphasis,
} from './process.js';

describe('signal processing primitives', () => {
  it('normalizePeak scales so the absolute peak equals the target', () => {
    const a = new Float32Array([0.1, 0.4, -0.2, 0.5]);
    normalizePeak(a, 1);
    let max = 0;
    for (const v of a) max = Math.max(max, Math.abs(v));
    expect(max).toBeCloseTo(1, 6);
  });

  it('normalizePeak on silent input is a no-op', () => {
    const a = new Float32Array([0, 0, 0]);
    expect(Array.from(normalizePeak(a, 1))).toEqual([0, 0, 0]);
  });

  it('normalizePeak rejects non-positive target', () => {
    expect(() => normalizePeak(new Float32Array(2), 0)).toThrow();
  });

  it('normalizeRms scales the RMS to the target', () => {
    const a = new Float32Array([1, -1, 1, -1]);
    normalizeRms(a, 0.5);
    let sum = 0;
    for (const v of a) sum += v * v;
    const r = Math.sqrt(sum / a.length);
    expect(r).toBeCloseTo(0.5, 5);
  });

  it('dcRemoveMean zeroes the mean', () => {
    const a = new Float32Array([1, 2, 3, 4, 5, 6, 7]);
    dcRemoveMean(a);
    let sum = 0;
    for (const v of a) sum += v;
    expect(sum / a.length).toBeCloseTo(0, 6);
  });

  it('dcRemoveHpf removes DC component', () => {
    const a = new Float32Array(8000);
    for (let i = 0; i < a.length; i++) a[i] = 0.5 + 0.1 * Math.sin((2 * Math.PI * 50 * i) / 2000);
    dcRemoveHpf(a, 0.995);
    let sum = 0;
    for (const v of a) sum += v;
    expect(Math.abs(sum / a.length)).toBeLessThan(0.05);
  });

  it('clipHard clamps the signal to the limit', () => {
    const a = new Float32Array([-2, -0.5, 0, 0.5, 2]);
    clipHard(a, 1);
    expect(Array.from(a)).toEqual([-1, -0.5, 0, 0.5, 1]);
  });

  it('clipSoft is monotonic and bounded by limit', () => {
    const a = new Float32Array([-3, -1, 0, 1, 3]);
    clipSoft(a, 1);
    for (const v of a) {
      expect(v).toBeLessThanOrEqual(1);
      expect(v).toBeGreaterThanOrEqual(-1);
    }
    expect(a[0]).toBeLessThan(-0.9);
  });

  it('preEmphasis followed by deEmphasis reconstructs the signal', () => {
    const a = new Float32Array([1, 2, 3, 2, 1, 0, -1, 0, 1, 2]);
    const orig = new Float32Array(a);
    preEmphasis(a, 0.95);
    deEmphasis(a, 0.95);
    for (let i = 0; i < orig.length; i++) {
      expect(a[i] ?? 0).toBeCloseTo(orig[i] ?? 0, 4);
    }
  });

  it('preEmphasis rejects invalid coefficient', () => {
    expect(() => preEmphasis(new Float32Array(4), -0.1)).toThrow();
    expect(() => preEmphasis(new Float32Array(4), 1)).toThrow();
  });
});
it('preserves input when peak normalization encounters invalid samples', () => {
  const samples = new Float32Array([1, NaN]);
  expect(() => normalizePeak(samples)).toThrow();
  expect(samples[0]).toBe(1);
  expect(Number.isNaN(samples[1])).toBe(true);
  expect(Array.from(normalizePeak(new Float32Array([-2, 1]), 0.5))).toEqual([-0.5, 0.25]);
});
it('preserves input when RMS normalization encounters invalid samples', () => {
  const samples = new Float32Array([1, NaN]);
  expect(() => normalizeRms(samples)).toThrow();
  expect(samples[0]).toBe(1);
  expect(Number.isNaN(samples[1])).toBe(true);
  expect(Array.from(normalizeRms(new Float32Array([1, -1]), 0.5))).toEqual([0.5, -0.5]);
});
it('preserves input when mean removal encounters invalid samples', () => {
  const samples = new Float32Array([1, NaN]);
  expect(() => dcRemoveMean(samples)).toThrow();
  expect(samples[0]).toBe(1);
  expect(Number.isNaN(samples[1])).toBe(true);
  expect(Array.from(dcRemoveMean(new Float32Array([1, 2, 3])))).toEqual([-1, 0, 1]);
});
it('preserves input when high-pass DC removal encounters invalid samples', () => {
  const samples = new Float32Array([1, NaN]);
  expect(() => dcRemoveHpf(samples)).toThrow();
  expect(samples[0]).toBe(1);
  expect(Number.isNaN(samples[1])).toBe(true);
  expect(dcRemoveHpf(new Float32Array([1, 1, 1]), 0.5)).toEqual(new Float32Array([1, 0.5, 0.25]));
});
it('preserves input when hard clipping encounters invalid samples', () => {
  const samples = new Float32Array([1, NaN]);
  expect(() => clipHard(samples)).toThrow();
  expect(samples[0]).toBe(1);
  expect(Number.isNaN(samples[1])).toBe(true);
  expect(clipHard(new Float32Array([-2, 0, 2]), 0.5)).toEqual(new Float32Array([-0.5, 0, 0.5]));
});
it('preserves input when soft clipping encounters invalid samples', () => {
  const samples = new Float32Array([1, NaN]);
  expect(() => clipSoft(samples)).toThrow();
  expect(samples[0]).toBe(1);
  expect(Number.isNaN(samples[1])).toBe(true);
  const soft = clipSoft(new Float32Array([-2, 0, 2]), 0.5);
  expect(soft[0]).toBeCloseTo(-soft[2]!, 7);
});
