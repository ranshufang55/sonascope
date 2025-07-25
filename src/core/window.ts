// Window functions for STFT framing. All routines return Float32Array
// of the requested length. They are pure and have no side effects.
//
// All windows are well-defined at length 1: the singleton case is
// [1]. Hann, Hamming, Blackman, and Bartlett use a denominator of
// (length - 1) which is zero at length 1; we special-case that path.
// Triangular and Bartlett are kept distinct: triangular reaches
// nonzero endpoints and peaks at the centre, while
// bartlett is the symmetric ramp that touches zero at every endpoint.

import { assertFiniteSamples, assertInteger, assertPositive } from './validation.js';

const TWO_PI = Math.PI * 2;

export type WindowType =
  | 'hann'
  | 'hamming'
  | 'blackman'
  | 'rectangular'
  | 'triangular'
  | 'bartlett';

export function makeWindow(type: WindowType, length: number): Float32Array {
  assertInteger(length, 'length');
  assertPositive(length, 'length');
  const w = new Float32Array(length);
  if (length === 1) {
    w[0] = 1;
    return w;
  }
  const denom = length - 1;
  switch (type) {
    case 'rectangular':
      w.fill(1);
      return w;
    case 'hann':
      for (let i = 0; i < length; i++) w[i] = 0.5 * (1 - Math.cos((TWO_PI * i) / denom));
      return w;
    case 'hamming':
      for (let i = 0; i < length; i++) w[i] = 0.54 - 0.46 * Math.cos((TWO_PI * i) / denom);
      return w;
    case 'blackman':
      for (let i = 0; i < length; i++) {
        const x = (TWO_PI * i) / denom;
        w[i] = 0.42 - 0.5 * Math.cos(x) + 0.08 * Math.cos(2 * x);
      }
      return w;
    case 'triangular':
      for (let i = 0; i < length; i++) {
        const center = denom / 2;
        w[i] = 1 - Math.abs(i - center) / (length % 2 === 0 ? length / 2 : (length + 1) / 2);
      }
      return w;
    case 'bartlett':
      for (let i = 0; i < length; i++) {
        if (i <= denom / 2) w[i] = (2 * i) / denom;
        else w[i] = 2 - (2 * i) / denom;
      }
      return w;
    default:
      throw new RangeError(`makeWindow: unknown window type ${String(type)}`);
  }
}

export function hann(length: number): Float32Array {
  return makeWindow('hann', length);
}
export function hamming(length: number): Float32Array {
  return makeWindow('hamming', length);
}
export function blackman(length: number): Float32Array {
  return makeWindow('blackman', length);
}
export function rectangular(length: number): Float32Array {
  return makeWindow('rectangular', length);
}
export function triangular(length: number): Float32Array {
  return makeWindow('triangular', length);
}
export function bartlett(length: number): Float32Array {
  return makeWindow('bartlett', length);
}

export function applyWindow(samples: Float32Array, window: ArrayLike<number>): Float32Array {
  if (samples.length !== window.length) {
    throw new RangeError(`applyWindow: length mismatch ${samples.length} vs ${window.length}`);
  }
  for (let i = 0; i < samples.length; i++) samples[i] = (samples[i] ?? 0) * (window[i] ?? 0);
  return samples;
}

export function windowSum(window: ArrayLike<number>): number {
  assertFiniteSamples(window, 'window');
  let s = 0;
  for (let i = 0; i < window.length; i++) s += window[i] ?? 0;
  return s;
}

export function colaNormalize(window: ArrayLike<number>, hopSize: number): number {
  assertInteger(hopSize, 'hopSize');
  assertPositive(hopSize, 'hopSize');
  return windowSum(window) / hopSize;
}
