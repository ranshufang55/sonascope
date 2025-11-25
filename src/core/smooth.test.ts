import { describe, it, expect } from 'vitest';
import {
  emaSmooth,
  energyEnvelope,
  medianSmooth,
  onePoleSmooth,
  peakEnvelope,
  rmsEnvelope,
} from './smooth.js';

describe('smoothing', () => {
  it('onePoleSmooth smooths a step input towards the new value', () => {
    const a = new Float32Array(32);
    for (let i = 0; i < 16; i++) a[i] = 0;
    for (let i = 16; i < 32; i++) a[i] = 1;
    onePoleSmooth(a, 0.8);
    expect(a[16]).toBeLessThan(0.3);
    expect(a[20]).toBeGreaterThan(0.5);
    expect(a[31]).toBeGreaterThan(0.95);
  });

  it('onePoleSmooth rejects out-of-range coefficient', () => {
    const a = new Float32Array(4);
    expect(() => onePoleSmooth(a, -0.1)).toThrow();
    expect(() => onePoleSmooth(a, 1.5)).toThrow();
  });

  it('emaSmooth keeps the first sample value with high alpha', () => {
    const a = new Float32Array([1, 2, 3, 4]);
    emaSmooth(a, 0.5);
    expect(a[0]).toBeCloseTo(1, 6);
    expect(a[3]).toBeGreaterThan(3);
  });

  it('medianSmooth returns the middle sample for odd windows', () => {
    const a = new Float32Array([1, 5, 3, 2, 4]);
    const out = medianSmooth(a, 3);
    expect(out[2]).toBe(3);
  });

  it('peakEnvelope returns the local max over the window', () => {
    const a = [0, 0, 1, 0, 0];
    const out = peakEnvelope(a, 3);
    expect(out[2]).toBe(1);
  });

  it('rmsEnvelope is non-negative', () => {
    const a = new Float32Array(8).fill(1);
    const out = rmsEnvelope(a, 4);
    for (const v of out) expect(v).toBeGreaterThanOrEqual(0);
  });

  it('energyEnvelope sums squared samples in the window', () => {
    const a = [1, 1, 1, 1];
    const out = energyEnvelope(a, 2);
    for (let i = 0; i < 4; i++) {
      expect(out[i]).toBe(i === 3 ? 1 : 2);
    }
  });
});
it('rejects nonfinite smoothing data and fractional windows before work begins', () => {
  for (const fn of [onePoleSmooth, emaSmooth])
    expect(() => fn(new Float32Array([1, NaN]), 0.5)).toThrow();
  for (const fn of [medianSmooth, peakEnvelope, rmsEnvelope, energyEnvelope]) {
    expect(() => fn(new Float32Array([1, 2, 3]), 1.5)).toThrow();
    expect(() => fn(new Float32Array([NaN]), 1)).toThrow();
  }
});
it('defines both EMA endpoint weights consistently with the recurrence', () => {
  expect(emaSmooth(new Float32Array([1, 2, 3]), 0)).toEqual(new Float32Array([1, 1, 1]));
  expect(emaSmooth(new Float32Array([1, 2, 3]), 1)).toEqual(new Float32Array([1, 2, 3]));
});
it('computes even medians over exactly the requested local samples', () => {
  expect(medianSmooth(new Float32Array([1, 3, 5, 7]), 2)).toEqual(new Float32Array([2, 4, 6, 7]));
  expect(medianSmooth(new Float32Array([1, 5, 3]), 3)).toEqual(new Float32Array([3, 3, 4]));
});
it('uses symmetric clipped neighborhoods for odd envelope windows', () => {
  const input = new Float32Array([0, 1, 2, 3, 4]);
  for (const fn of [peakEnvelope, rmsEnvelope, energyEnvelope])
    expect(fn(input, 3)).toEqual(fn(input.slice().reverse(), 3).reverse());
});
