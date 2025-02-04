// Signal smoothing and envelope followers.

import { assertFinite, assertInRange, assertNonNegative, assertPositive } from './validation.js';

export function onePoleSmooth(samples: Float32Array, coefficient: number): Float32Array {
  assertInRange(coefficient, 0, 1, 'coefficient');
  let y = 0;
  for (let i = 0; i < samples.length; i++) {
    const x = samples[i] ?? 0;
    y = (1 - coefficient) * x + coefficient * y;
    samples[i] = y;
  }
  return samples;
}

export function emaSmooth(samples: Float32Array, alpha: number): Float32Array {
  assertInRange(alpha, 0, 1, 'alpha');
  if (alpha === 0) {
    for (let i = 0; i < samples.length; i++) samples[i] = samples[i] ?? 0;
    return samples;
  }
  let y = samples[0] ?? 0;
  for (let i = 0; i < samples.length; i++) {
    y = alpha * (samples[i] ?? 0) + (1 - alpha) * y;
    samples[i] = y;
  }
  return samples;
}

export function medianSmooth(samples: Float32Array, window: number): Float32Array {
  assertPositive(window, 'window');
  assertInRange(window, 1, samples.length || 1, 'window');
  const half = Math.floor(window / 2);
  const out = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const lo = Math.max(0, i - half);
    const hi = Math.min(samples.length, i + half + 1);
    const slice: number[] = [];
    for (let k = lo; k < hi; k++) slice.push(samples[k] ?? 0);
    slice.sort((a, b) => a - b);
    out[i] = slice[Math.floor(slice.length / 2)] ?? 0;
  }
  return out;
}

export function peakEnvelope(samples: ArrayLike<number>, windowSize: number): Float32Array {
  assertPositive(windowSize, 'windowSize');
  const out = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    let p = 0;
    const lo = Math.max(0, i - Math.floor(windowSize / 2));
    const hi = Math.min(samples.length, lo + windowSize);
    for (let k = lo; k < hi; k++) {
      const v = Math.abs(samples[k] ?? 0);
      if (v > p) p = v;
    }
    out[i] = p;
  }
  return out;
}

export function rmsEnvelope(samples: ArrayLike<number>, windowSize: number): Float32Array {
  assertPositive(windowSize, 'windowSize');
  const out = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    let sum = 0;
    const lo = Math.max(0, i - Math.floor(windowSize / 2));
    const hi = Math.min(samples.length, lo + windowSize);
    for (let k = lo; k < hi; k++) sum += (samples[k] ?? 0) * (samples[k] ?? 0);
    out[i] = Math.sqrt(sum / Math.max(1, hi - lo));
  }
  return out;
}

export function energyEnvelope(samples: ArrayLike<number>, windowSize: number): Float32Array {
  assertPositive(windowSize, 'windowSize');
  const out = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    let sum = 0;
    const lo = Math.max(0, i - Math.floor(windowSize / 2));
    const hi = Math.min(samples.length, lo + windowSize);
    for (let k = lo; k < hi; sum += (samples[k] ?? 0) * (samples[k] ?? 0), k++);
    out[i] = sum;
  }
  return out;
}

export function assertNonEmptyWindow(window: number, label: string): void {
  assertNonNegative(window, label);
  assertFinite(window, label);
}
