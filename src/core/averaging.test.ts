import { describe, it, expect } from 'vitest';
import {
  maxHoldSpectrum,
  meanSpectrum,
  medianSpectrum,
  spectrumDiff,
  spectrumL2,
} from './averaging.js';

describe('spectrum averaging', () => {
  it('meanSpectrum averages across frames', () => {
    const a = new Float32Array([1, 2, 3]);
    const b = new Float32Array([3, 4, 5]);
    const out = meanSpectrum([a, b]);
    expect(Array.from(out)).toEqual([2, 3, 4]);
  });

  it('maxHoldSpectrum takes the per-bin max', () => {
    const a = new Float32Array([1, 5, 3]);
    const b = new Float32Array([4, 2, 6]);
    const out = maxHoldSpectrum([a, b]);
    expect(Array.from(out)).toEqual([4, 5, 6]);
  });

  it('medianSpectrum returns the central value for an odd count', () => {
    const a = new Float32Array([1, 2, 3]);
    const b = new Float32Array([3, 4, 5]);
    const c = new Float32Array([5, 6, 7]);
    const out = medianSpectrum([a, b, c]);
    expect(Array.from(out)).toEqual([3, 4, 5]);
  });

  it('spectrumDiff is the absolute difference', () => {
    const a = [1, 2, 3];
    const b = [4, 5, 7];
    const out = spectrumDiff(a, b);
    expect(Array.from(out)).toEqual([3, 3, 4]);
  });

  it('spectrumL2 is the Euclidean distance', () => {
    const d = spectrumL2([0, 0, 0], [3, 4, 0]);
    expect(d).toBe(5);
  });

  it('averaging on an empty input is empty', () => {
    expect(meanSpectrum([]).length).toBe(0);
    expect(medianSpectrum([]).length).toBe(0);
    expect(maxHoldSpectrum([]).length).toBe(0);
  });
});
it('enforces matrix shape and finite samples for every reduction', () => {
  for (const reduce of [meanSpectrum, medianSpectrum, maxHoldSpectrum])
    for (const input of [[[1], [1, 2]], [[1, 2], [1]], [[1, NaN]], [[Infinity]]])
      expect(() => reduce(input)).toThrow();
});
it('avoids overflow while averaging large representable spectra', () => {
  const value = Math.fround(3e38);
  expect(meanSpectrum([[value], [value]])[0]).toBe(value);
  expect(meanSpectrum([[1e8], [1], [-1e8]])[0]).toBeCloseTo(1 / 3, 5);
});
