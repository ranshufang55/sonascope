// Cooley-Tukey radix-2 FFT. Operates on a pair of Float32Arrays
// holding real and imaginary parts. Power-of-two sizes only, with
// a documented upper bound (MAX_FFT_SIZE = 2^20) to keep the loop
// counters and bit-reversal table inside safe integer ranges.
//
// Every public entry point validates its arguments before mutating
// any input. ifftInPlace in particular validates the lengths first
// so that a failed call leaves both arrays unchanged.

import { isPow2 } from './pow2.js';
import { assertFiniteSamples, assertInteger, assertPositive } from './validation.js';

export const MAX_FFT_SIZE = 1 << 20; // 1,048,576

export interface ComplexArray {
  re: Float32Array;
  im: Float32Array;
}

const bitReversalCache = new Map<number, Uint32Array>();

function bitReversalTable(n: number): Uint32Array {
  const cached = bitReversalCache.get(n);
  if (cached) return cached;
  const bits = Math.log2(n);
  const table = new Uint32Array(n);
  for (let i = 0; i < n; i++) {
    let x = i;
    let r = 0;
    for (let j = 0; j < bits; j++) {
      r = (r << 1) | (x & 1);
      x >>= 1;
    }
    table[i] = r;
  }
  bitReversalCache.set(n, table);
  return table;
}

function assertPowerOfTwo(n: number, label: string): void {
  assertInteger(n, label);
  assertPositive(n, label);
  if (!isPow2(n)) {
    throw new RangeError(`${label} must be a power of two, got ${n}`);
  }
  if (n > MAX_FFT_SIZE) {
    throw new RangeError(`${label} must be <= ${MAX_FFT_SIZE}, got ${n}`);
  }
}

function assertTransformRange(re: Float32Array, im: Float32Array): void {
  let bound = 0;
  for (let i = 0; i < re.length; i++) bound += Math.hypot(re[i]!, im[i]!);
  if (bound > 1.7e38) throw new RangeError('FFT input may overflow Float32');
}

function assertMatchingLengths(re: ArrayLike<number>, im: ArrayLike<number>): void {
  if (re.length !== im.length) {
    throw new RangeError(`re/im length mismatch: ${re.length} vs ${im.length}`);
  }
}

export function fftInPlace(re: Float32Array, im: Float32Array): void {
  assertPowerOfTwo(re.length, 're.length');
  assertMatchingLengths(re, im);
  assertFiniteSamples(re, 're');
  assertFiniteSamples(im, 'im');
  assertTransformRange(re, im);
  if (
    re.buffer === im.buffer &&
    re.byteOffset < im.byteOffset + im.byteLength &&
    im.byteOffset < re.byteOffset + re.byteLength
  )
    throw new RangeError('Complex planes must not overlap');
  const n = re.length;
  const table = bitReversalTable(n);
  for (let i = 0; i < n; i++) {
    const j = table[i] ?? 0;
    if (j > i) {
      const tr = re[i] ?? 0;
      const ti = im[i] ?? 0;
      re[i] = re[j] ?? 0;
      im[i] = im[j] ?? 0;
      re[j] = tr;
      im[j] = ti;
    }
  }
  for (let size = 2; size <= n; size <<= 1) {
    const half = size >> 1;
    const angleStep = (-2 * Math.PI) / size;
    for (let i = 0; i < n; i += size) {
      for (let k = 0; k < half; k++) {
        const angle = angleStep * k;
        const wr = Math.cos(angle);
        const wi = Math.sin(angle);
        const aRe = re[i + k] ?? 0;
        const aIm = im[i + k] ?? 0;
        const bRe = re[i + k + half] ?? 0;
        const bIm = im[i + k + half] ?? 0;
        const tRe = bRe * wr - bIm * wi;
        const tIm = bRe * wi + bIm * wr;
        re[i + k] = aRe + tRe;
        im[i + k] = aIm + tIm;
        re[i + k + half] = aRe - tRe;
        im[i + k + half] = aIm - tIm;
      }
    }
  }
}

export function ifftInPlace(re: Float32Array, im: Float32Array): void {
  // Validate before any mutation so a failed call leaves both arrays
  // untouched.
  assertPowerOfTwo(re.length, 're.length');
  assertMatchingLengths(re, im);
  assertFiniteSamples(re, 're');
  assertFiniteSamples(im, 'im');
  assertTransformRange(re, im);
  if (
    re.buffer === im.buffer &&
    re.byteOffset < im.byteOffset + im.byteLength &&
    im.byteOffset < re.byteOffset + re.byteLength
  )
    throw new RangeError('Complex planes must not overlap');
  const n = re.length;
  for (let i = 0; i < n; i++) im[i] = -(im[i] ?? 0);
  fftInPlace(re, im);
  for (let i = 0; i < n; i++) {
    re[i] = (re[i] ?? 0) / n;
    im[i] = -(im[i] ?? 0) / n;
  }
}

export function fft(samples: ArrayLike<number>): ComplexArray {
  const n = samples.length;
  assertPowerOfTwo(n, 'samples.length');
  assertFiniteSamples(samples, 'samples');
  const re = new Float32Array(n);
  const im = new Float32Array(n);
  for (let i = 0; i < n; i++) re[i] = samples[i] ?? 0;
  fftInPlace(re, im);
  return { re, im };
}

export function ifft(input: ComplexArray): ComplexArray {
  if (!input || !(input.re instanceof Float32Array) || !(input.im instanceof Float32Array)) {
    throw new RangeError('ifft: input.re and input.im must be Float32Array');
  }
  assertMatchingLengths(input.re, input.im);
  assertPowerOfTwo(input.re.length, 'input.re.length');
  assertFiniteSamples(input.re, 'input.re');
  assertFiniteSamples(input.im, 'input.im');
  const n = input.re.length;
  const re = new Float32Array(n);
  const im = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    re[i] = input.re[i] ?? 0;
    im[i] = input.im[i] ?? 0;
  }
  ifftInPlace(re, im);
  return { re, im };
}

export function fftReal(samples: ArrayLike<number>): ComplexArray {
  return fft(samples);
}

export function ifftReal(input: ComplexArray): Float32Array {
  const out = ifft(input);
  return out.re;
}
