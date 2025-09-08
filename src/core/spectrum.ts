import { assertFinite, assertFiniteSamples, assertNonNegative } from './validation.js';
// Magnitude, power, and dB conversions for FFT bins.

import type { ComplexArray } from './fft.js';

export function magnitude(input: ComplexArray): Float32Array {
  if (input.re.length !== input.im.length) throw new RangeError('Complex spectrum shape mismatch');
  assertFiniteSamples(input.re);
  assertFiniteSamples(input.im);
  const n = input.re.length;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const re = input.re[i] ?? 0;
    const im = input.im[i] ?? 0;
    const value = Math.hypot(re, im);
    if (!Number.isFinite(Math.fround(value))) throw new RangeError('Magnitude exceeds Float32');
    out[i] = value;
  }
  return out;
}

export function powerSpectrum(input: ComplexArray): Float32Array {
  if (input.re.length !== input.im.length) throw new RangeError('Complex spectrum shape mismatch');
  assertFiniteSamples(input.re);
  assertFiniteSamples(input.im);
  const n = input.re.length;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const re = input.re[i] ?? 0;
    const im = input.im[i] ?? 0;
    const value = re * re + im * im;
    if (!Number.isFinite(Math.fround(value))) throw new RangeError('Power exceeds Float32');
    out[i] = value;
  }
  return out;
}

export function linToDb(value: number, floor: number = -120): number {
  assertNonNegative(value, 'value');
  assertFinite(floor, 'floor');
  return value === 0 ? floor : Math.max(floor, 20 * Math.log10(value));
}

export function toDb(magnitudes: ArrayLike<number>, floor: number = -120): Float32Array {
  assertFiniteSamples(magnitudes);
  assertFinite(floor, 'floor');
  const out = new Float32Array(magnitudes.length);
  for (let i = 0; i < magnitudes.length; i++) {
    const v = magnitudes[i] ?? 0;
    out[i] = linToDb(v, floor);
  }
  return out;
}

export function toDbPower(powerVals: ArrayLike<number>, floor: number = -120): Float32Array {
  assertFiniteSamples(powerVals);
  assertFinite(floor, 'floor');
  const out = new Float32Array(powerVals.length);
  for (let i = 0; i < powerVals.length; i++) {
    const v = powerVals[i] ?? 0;
    assertNonNegative(v, 'power');
    out[i] = v === 0 ? floor : Math.max(floor, 10 * Math.log10(v));
  }
  return out;
}

export function halfSpectrum(magnitudes: ArrayLike<number>): Float32Array {
  const n = magnitudes.length === 0 ? 0 : Math.floor(magnitudes.length / 2) + 1;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = magnitudes[i] ?? 0;
  return out;
}
