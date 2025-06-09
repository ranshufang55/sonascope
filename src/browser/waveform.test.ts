import { it, expect } from 'vitest';
import { waveformColumns } from './waveform.js';
it('retains positive and negative transients at every horizontal resolution', () => {
  const input = [0, 1, 0, 0, -1, 0, 0, 0];
  for (const width of [1, 2, 4, 8, 16]) {
    const columns = waveformColumns(input, width);
    expect(Math.max(...columns.map((c) => c.max))).toBe(1);
    expect(Math.min(...columns.map((c) => c.min))).toBe(-1);
  }
  expect(waveformColumns(input, 1, { start: 2, end: 4 })).toEqual([{ min: 0, max: 0 }]);
  expect(waveformColumns([], 2)).toEqual([
    { min: 0, max: 0 },
    { min: 0, max: 0 },
  ]);
});
