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
