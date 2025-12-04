import { it, expect } from 'vitest';
import {
  rms,
  peak,
  crestFactor,
  dcOffset,
  energy,
  mean,
  variance,
  zeroCrossingRate,
} from './features-time.js';
it('rejects invalid samples consistently across all scalar time features', () => {
  for (const value of [NaN, Infinity, -Infinity])
    for (const fn of [
      rms,
      peak,
      crestFactor,
      dcOffset,
      energy,
      mean,
      variance,
      (samples: ArrayLike<number>) => zeroCrossingRate(samples, 8000),
    ])
      expect(() => fn([0, value])).toThrow();
});
it('keeps zero-crossing counts invariant under reversal, including exact zeros', () => {
  for (let code = 0; code < 81; code++) {
    let n = code;
    const samples = Float32Array.from({ length: 4 }, () => {
      const value = (n % 3) - 1;
      n = Math.floor(n / 3);
      return value;
    });
    expect(zeroCrossingRate(samples, 8000)).toBe(zeroCrossingRate(samples.slice().reverse(), 8000));
  }
  expect(zeroCrossingRate([0, 1, 0], 8)).toBe(0);
  expect(zeroCrossingRate([0, -1, 0], 8)).toBe(8);
});
