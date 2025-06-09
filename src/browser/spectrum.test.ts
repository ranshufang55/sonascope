import { it, expect } from 'vitest';
import { spectrumColumns } from './spectrum.js';
it('preserves narrow peaks when many bins share a pixel', () => {
  expect(Array.from(spectrumColumns([-100, 0, -100, -100], 2))).toEqual([1, 0]);
  expect(Array.from(spectrumColumns([-Infinity, -50], 4))).toEqual([0, 0, 0.5, 0.5]);
  expect(Array.from(spectrumColumns([], 3))).toEqual([0, 0, 0]);
  expect(() => spectrumColumns([NaN], 2)).toThrow();
});
