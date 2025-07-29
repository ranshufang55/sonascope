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
    expect(w[0]).toBeCloseTo(1 / 3, 4);
    expect(w[2]).toBeCloseTo(1, 4);
    expect(w[4]).toBeCloseTo(1 / 3, 4);
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

  it('every window type is [1] at length 1', () => {
    for (const w of [
      rectangular(1),
      hann(1),
      hamming(1),
      blackman(1),
      triangular(1),
      bartlett(1),
    ]) {
      expect(w.length).toBe(1);
      expect(w[0]).toBe(1);
    }
  });

  it('triangular and bartlett are symmetric with distinct endpoints', () => {
    const t = triangular(7);
    const b = bartlett(7);
    for (const w of [t, b]) {
      expect(w[0]).toBeCloseTo(w === t ? 0.25 : 0, 6);
      expect(w[6]).toBeCloseTo(w === t ? 0.25 : 0, 6);
      expect(Math.abs(w[1] - w[5])).toBeLessThan(1e-6);
      expect(Math.abs(w[2] - w[4])).toBeLessThan(1e-6);
    }
  });

  it('colaNormalize rejects non-positive hop and non-finite windows', () => {
    expect(() => colaNormalize(hann(8), 0)).toThrow();
    expect(() => colaNormalize(hann(8), -1)).toThrow();
    expect(() => colaNormalize(hann(8), 1.5)).toThrow();
    expect(() => colaNormalize(new Float32Array([1, NaN]), 2)).toThrow();
  });
});
it('pins odd and even triangular window coefficients independently of Bartlett', () => {
  expect(Array.from(triangular(4))).toEqual([0.25, 0.75, 0.75, 0.25]);
  expect(Array.from(triangular(3))).toEqual([0.5, 1, 0.5]);
  expect(Array.from(bartlett(3))).toEqual([0, 1, 0]);
});
it('rejects invalid window names at singleton length and excessive allocations', () => {
  for (const size of [1, 4]) expect(() => makeWindow('unknown' as never, size)).toThrow();
  expect(() => hann(2 ** 20 + 1)).toThrow();
});
it('leaves input intact when a later window coefficient is invalid or overflows', () => {
  for (const coefficient of [NaN, Infinity, 1e40]) {
    const samples = new Float32Array([1, 2]);
    expect(() => applyWindow(samples, [1, coefficient])).toThrow();
    expect(Array.from(samples)).toEqual([1, 2]);
  }
});
