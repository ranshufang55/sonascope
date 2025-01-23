// Magnitude, power, and dB conversions for FFT bins.

import type { ComplexArray } from './fft.js';

export function magnitude(input: ComplexArray): Float32Array {
  const n = input.re.length;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const re = input.re[i] ?? 0;
    const im = input.im[i] ?? 0;
    out[i] = Math.hypot(re, im);
  }
  return out;
}

export function powerSpectrum(input: ComplexArray): Float32Array {
  const n = input.re.length;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const re = input.re[i] ?? 0;
    const im = input.im[i] ?? 0;
    out[i] = re * re + im * im;
  }
  return out;
}

export function linToDb(value: number, floor: number = -120): number {
  if (value <= 0) return floor;
  return 20 * Math.log10(value);
}

export function toDb(magnitudes: ArrayLike<number>, floor: number = -120): Float32Array {
  const out = new Float32Array(magnitudes.length);
  for (let i = 0; i < magnitudes.length; i++) {
    const v = magnitudes[i] ?? 0;
    out[i] = v > 0 ? 20 * Math.log10(v) : floor;
  }
  return out;
}

export function toDbPower(powerVals: ArrayLike<number>, floor: number = -120): Float32Array {
  const out = new Float32Array(powerVals.length);
  for (let i = 0; i < powerVals.length; i++) {
    const v = powerVals[i] ?? 0;
    out[i] = v > 0 ? 10 * Math.log10(v) : floor;
  }
  return out;
}

export function halfSpectrum(magnitudes: ArrayLike<number>): Float32Array {
  const n = Math.floor((magnitudes.length + 1) / 2);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = magnitudes[i] ?? 0;
  return out;
}
