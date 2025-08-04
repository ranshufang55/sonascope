import { describe, it, expect } from 'vitest';
import {
  applyMelFilterbank,
  hzToMel,
  linearBands,
  logBands,
  melFilterbank,
  melToHz,
} from './bands.js';

describe('bands', () => {
  it('hzToMel and melToHz are inverses around 1 kHz', () => {
    expect(hzToMel(1000)).toBeCloseTo(15, 4);
    expect(melToHz(15)).toBeCloseTo(1000, 4);
  });

  it('linearBands returns the requested edges', () => {
    const b = linearBands(4, 0, 1000);
    expect(b.length).toBe(5);
    expect(b[0]).toBe(0);
    expect(b[4]).toBe(1000);
  });

  it('linearBands rejects inverted range', () => {
    expect(() => linearBands(4, 1000, 100)).toThrow();
  });

  it('logBands returns logarithmically spaced edges', () => {
    const b = logBands(4, 100, 10000);
    expect(b[0]).toBeCloseTo(100, 4);
    expect(b[4]).toBeCloseTo(10000, 4);
  });

  it('melFilterbank produces the right number of filters', () => {
    const fb = melFilterbank(10, 512, 16000);
    expect(fb.numFilters).toBe(10);
    expect(fb.filters[0]?.length).toBe(257);
  });

  it('applyMelFilterbank returns one number per filter', () => {
    const fb = melFilterbank(8, 64, 16000);
    const power = new Float32Array(33).fill(1);
    const out = applyMelFilterbank(power, fb);
    expect(out.length).toBe(8);
  });
});
it('matches Slaney high-frequency landmarks and the complete inverse curve', () => {
  expect(hzToMel(6400)).toBeCloseTo(42, 10);
  expect(melToHz(42)).toBeCloseTo(6400, 8);
  for (const hz of [0, 60, 440, 999, 1000, 1001, 2000, 4000, 6400, 12000, 24000])
    expect(melToHz(hzToMel(hz))).toBeCloseTo(hz, 7);
});
it('rejects invalid band and mel inputs across forward and inverse helpers', () => {
  for (const value of [-1, NaN, Infinity]) {
    expect(() => hzToMel(value)).toThrow();
    expect(() => melToHz(value)).toThrow();
  }
  for (const count of [0, 1.5, Infinity, 65537]) {
    expect(() => linearBands(count, 0, 1000)).toThrow();
    expect(() => logBands(count, 1, 1000)).toThrow();
  }
  expect(() => linearBands(2, 0, Infinity)).toThrow();
  expect(() => logBands(2, NaN, 1000)).toThrow();
});
