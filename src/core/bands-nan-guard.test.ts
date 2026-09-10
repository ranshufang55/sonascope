import { describe, it, expect } from 'vitest';
import { melFilterbank, applyMelFilterbank } from './bands.js';

describe('melFilterbank collapsed frequency points', () => {
  it.each([
    ['both slopes at zero', 0, 1e-50],
    ['left slope', 500, 500.00002],
    ['right slope', 499.99998, 500],
    ['both slopes at an interior bin', 500, 500.0000000001],
    ['both slopes at Nyquist', 3999.99999, 4000],
  ] as const)('returns zero weights for %s', (_name, minHz, maxHz) => {
    const bank = melFilterbank(1, 128, 8000, minHz, maxHz);
    expect(bank.filters).toHaveLength(1);
    expect(Array.from(bank.filters[0]!)).toEqual(new Array(65).fill(0));
    expect(Array.from(applyMelFilterbank(new Float32Array(65).fill(1), bank))).toEqual([0]);
  });

  it('preserves every bin of an ordinary triangular filter', () => {
    const bank = melFilterbank(1, 16, 8000, 0, 1000);
    expect(Array.from(bank.centerFrequencies)).toEqual([500]);
    expect(Array.from(bank.filters[0]!)).toEqual([0, 1, 0, 0, 0, 0, 0, 0, 0]);
    expect(Array.from(applyMelFilterbank(new Float32Array(9).fill(2), bank))).toEqual([2]);
  });

  it.each([1, 2, 40, 512])('keeps all %i narrow filters finite and bounded', (count) => {
    const bank = melFilterbank(count, 128, 8000, 499.99, 500.01);
    expect(bank.filters).toHaveLength(count);
    expect(bank.centerFrequencies).toHaveLength(count);
    for (const filter of bank.filters) {
      expect(filter).toHaveLength(65);
      for (const weight of filter) {
        expect(Number.isFinite(weight)).toBe(true);
        expect(weight).toBeGreaterThanOrEqual(0);
        expect(weight).toBeLessThanOrEqual(1);
      }
    }
    for (const value of applyMelFilterbank(new Float32Array(65).fill(1), bank)) {
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
    }
  });
});
