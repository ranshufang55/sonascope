// Cooley-Tukey radix-2 FFT. Operates on a pair of Float32Arrays
// holding real and imaginary parts. Power-of-two sizes only.

import { isPow2 } from './pow2.js';
import { assertInteger, assertPositive } from './validation.js';

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
}

export function fftInPlace(re: Float32Array, im: Float32Array): void {
  const n = re.length;
  assertPowerOfTwo(n, 're.length');
  if (im.length !== n) {
    throw new RangeError(`fftInPlace: im length ${im.length} does not match re ${n}`);
  }
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
  const re = new Float32Array(n);
  const im = new Float32Array(n);
  for (let i = 0; i < n; i++) re[i] = samples[i] ?? 0;
  fftInPlace(re, im);
  return { re, im };
}

export function ifft(input: ComplexArray): ComplexArray {
  const n = input.re.length;
  assertPowerOfTwo(n, 'input.re.length');
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
  const n = samples.length;
  assertPowerOfTwo(n, 'samples.length');
  return fft(samples);
}

export function ifftReal(input: ComplexArray): Float32Array {
  const out = ifft(input);
  return out.re;
}
