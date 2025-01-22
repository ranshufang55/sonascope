import { describe, it, expect } from 'vitest';
import {
  applyWindow,
  bartlett,
  blackman,
  colaNormalize,
  hamming,
  hann,
  makeWindow,
  rectangular,
  triangular,
  windowSum,
} from './window.js';

describe('windows', () => {
  it('rectangular is all ones', () => {
    const w = rectangular(8);
    for (const v of w) expect(v).toBe(1);
  });

  it('hann starts near zero and ends near zero with peak in the middle', () => {
    const w = hann(64);
    expect(w[0]).toBeCloseTo(0, 4);
    expect(w[63]).toBeCloseTo(0, 4);
    let max = 0;
    for (const v of w) if (v > max) max = v;
    expect(max).toBeGreaterThan(0.99);
    expect(max).toBeLessThanOrEqual(1);
  });

  it('hamming endpoints are 0.08, not 0', () => {
    const w = hamming(64);
    expect(w[0]).toBeCloseTo(0.08, 4);
  });

  it('blackman endpoints are near zero', () => {
    const w = blackman(64);
    expect(w[0]).toBeCloseTo(0, 4);
    expect(w[63]).toBeCloseTo(0, 4);
  });

  it('triangular is symmetric and peaks at center', () => {
    const w = triangular(5);
    expect(w[0]).toBeCloseTo(0, 4);
    expect(w[2]).toBeCloseTo(1, 4);
    expect(w[4]).toBeCloseTo(0, 4);
  });

  it('bartlett endpoints are zero with linear ramp', () => {
    const w = bartlett(5);
    expect(w[0]).toBeCloseTo(0, 4);
    expect(w[4]).toBeCloseTo(0, 4);
  });

  it('applyWindow multiplies element-wise', () => {
    const s = new Float32Array([1, 1, 1, 1]);
    const w = new Float32Array([0.5, 0.5, 0.5, 0.5]);
    applyWindow(s, w);
    expect(Array.from(s)).toEqual([0.5, 0.5, 0.5, 0.5]);
  });

  it('applyWindow throws on length mismatch', () => {
    expect(() => applyWindow(new Float32Array(4), new Float32Array(5))).toThrow();
  });

  it('windowSum sums elements', () => {
    expect(windowSum(new Float32Array([1, 2, 3]))).toBe(6);
  });

  it('COLA normalization divides window sum by hop size', () => {
    const w = hann(8);
    expect(colaNormalize(w, 4)).toBeCloseTo(windowSum(w) / 4, 8);
  });

  it('makeWindow accepts string type', () => {
    const w = makeWindow('hann', 16);
    expect(w.length).toBe(16);
  });

  it('makeWindow rejects unknown type', () => {
    expect(() => makeWindow('unknown' as never, 4)).toThrow();
  });
});
