import { describe, it, expect } from 'vitest';
import { fft } from './fft.js';
import { halfSpectrum, linToDb, magnitude, powerSpectrum, toDb, toDbPower } from './spectrum.js';

describe('spectrum', () => {
  it('magnitude returns absolute bin values', () => {
    const data = new Float32Array(4);
    data.set([1, 0, 0, 0]);
    const f = fft(data);
    const m = magnitude(f);
    expect(m[0]).toBeCloseTo(1, 4);
    expect(m[1]).toBeCloseTo(1, 4);
    expect(m[2]).toBeCloseTo(1, 4);
    expect(m[3]).toBeCloseTo(1, 4);
  });

  it('power squares the magnitude', () => {
    const data = new Float32Array(8);
    data.set([2, 0, 0, 0, 0, 0, 0, 0]);
    const f = fft(data);
    const m = magnitude(f);
    const p = powerSpectrum(f);
    expect(p[0]).toBeCloseTo((m[0] ?? 0) * (m[0] ?? 0), 4);
  });

  it('toDb maps 1.0 to 0 dB and small values to the floor', () => {
    const out = toDb([1, 0, 0.5], -60);
    expect(out[0]).toBeCloseTo(0, 4);
    expect(out[1]).toBe(-60);
    expect(out[2]).toBeCloseTo(20 * Math.log10(0.5), 4);
  });

  it('toDbPower uses 10*log10', () => {
    expect(toDbPower([1])[0]).toBeCloseTo(0, 4);
    expect(toDbPower([10])[0]).toBeCloseTo(10, 4);
    expect(toDbPower([100])[0]).toBeCloseTo(20, 4);
  });

  it('linToDb is consistent with toDb', () => {
    expect(linToDb(0.5)).toBeCloseTo(toDb([0.5])[0] ?? 0, 4);
  });

  it('halfSpectrum returns nonnegative frequencies including Nyquist', () => {
    const m = new Float32Array(16).map((_, i) => i);
    const h = halfSpectrum(m);
    expect(h.length).toBe(9);
    expect(Array.from(h)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

it('includes every nonnegative bin for odd, even, singleton and empty spectra', () => {
  for (let size = 0; size < 17; size++) {
    const input = Float32Array.from({ length: size }, (_, i) => i);
    expect(halfSpectrum(input)).toEqual(input.slice(0, size === 0 ? 0 : Math.floor(size / 2) + 1));
  }
});

it('applies the same lower floor to scalar, magnitude and power conversions', () => {
  expect(linToDb(1e-12, -60)).toBe(-60);
  expect(Array.from(toDb([0, 1e-12, 1], -60))).toEqual([-60, -60, 0]);
  expect(Array.from(toDbPower([0, 1e-12, 1], -60))).toEqual([-60, -60, 0]);
  for (const value of [-1, NaN, Infinity]) {
    expect(() => linToDb(value)).toThrow();
    expect(() => toDb([value])).toThrow();
    expect(() => toDbPower([value])).toThrow();
  }
});
it('rejects malformed complex shapes, nonfinite bins and output overflow', () => {
  for (const fn of [magnitude, powerSpectrum]) {
    expect(() => fn({ re: new Float32Array(2), im: new Float32Array(1) })).toThrow();
    expect(() => fn({ re: new Float32Array([NaN]), im: new Float32Array([0]) })).toThrow();
  }
  expect(() =>
    powerSpectrum({ re: new Float32Array([1e30]), im: new Float32Array([0]) }),
  ).toThrow();
});
