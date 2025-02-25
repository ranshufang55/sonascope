import { it, expect } from 'vitest';
import { asDataView, readFourCC, writeFourCC } from './bytes.js';
it('limits reads and writes to a sliced byte view', () => {
  const all = new Uint8Array(12).fill(9);
  const view = asDataView(all.subarray(4, 8));
  writeFourCC(view, 0, 'RIFF');
  expect(readFourCC(view, 0)).toBe('RIFF');
  expect(Array.from(all.subarray(0, 4))).toEqual([9, 9, 9, 9]);
  expect(Array.from(all.subarray(8))).toEqual([9, 9, 9, 9]);
  for (const offset of [-1, 0.5, 1, NaN, Infinity])
    expect(() => readFourCC(view, offset)).toThrow();
  expect(() => writeFourCC(view, 0, 'longer')).toThrow();
});
