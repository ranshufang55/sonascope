import { describe, it, expect } from 'vitest';
import {
  PADDING_MODES,
  padConstant,
  padEdge,
  padReflect,
  padToPowerOfTwo,
  padZero,
} from './pad.js';

describe('padding', () => {
  it('padZero fills with zeros on both sides', () => {
    const out = padZero([1, 2, 3], 2, 3);
    expect(out.length).toBe(8);
    expect(Array.from(out)).toEqual([0, 0, 1, 2, 3, 0, 0, 0]);
  });

  it('padReflect mirrors the input', () => {
    const out = padReflect([1, 2, 3, 4], 2, 2);
    expect(out.length).toBe(8);
    expect(Array.from(out)).toEqual([3, 2, 1, 2, 3, 4, 3, 2]);
  });

  it('padEdge extends the last sample', () => {
    const out = padEdge([1, 2, 3], 1, 2);
    expect(Array.from(out)).toEqual([1, 1, 2, 3, 3, 3]);
  });

  it('padConstant uses the requested value', () => {
    const out = padConstant([1, 2], 2, 2, 9);
    expect(Array.from(out)).toEqual([9, 9, 1, 2, 9, 9]);
  });

  it('padToPowerOfTwo rounds up to the next power of two', () => {
    expect(padToPowerOfTwo([1, 2, 3]).length).toBe(4);
    expect(padToPowerOfTwo([1, 2, 3, 4, 5]).length).toBe(8);
    expect(padToPowerOfTwo(new Float32Array(0)).length).toBe(1);
  });

  it('PADDING_MODES lists supported modes', () => {
    expect(PADDING_MODES).toContain('zero');
    expect(PADDING_MODES).toContain('reflect');
  });
});
it('rejects malformed padding across every public padding mode', () => {
  for (const fn of [padZero, padReflect, padEdge, padConstant]) {
    expect(() => fn([1], 0.5, 1)).toThrow();
    expect(() => fn([1], 1, 0.5)).toThrow();
    expect(() => fn([NaN], 1, 1)).toThrow();
    expect(() => fn([1], 2 ** 24, 1)).toThrow();
  }
  expect(() => padConstant([1], 1, 1, Infinity)).toThrow();
  expect(() => ensureLength([1], 2 ** 24 + 1)).toThrow();
});
it('reflects both sides over arbitrary periods and handles singleton audio', () => {
  expect(Array.from(padReflect([1, 2, 3], 7, 7))).toEqual([
    2, 3, 2, 1, 2, 3, 2, 1, 2, 3, 2, 1, 2, 3, 2, 1, 2,
  ]);
  expect(Array.from(padReflect([4], 3, 3))).toEqual([4, 4, 4, 4, 4, 4, 4]);
  expect(Array.from(padReflect([], 2, 2))).toEqual([0, 0, 0, 0]);
});
