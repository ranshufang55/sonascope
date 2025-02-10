// Autocorrelation and a simple pitch detector.

import { assertNonNegative, assertPositive } from './validation.js';

export function autocorrelation(samples: ArrayLike<number>): Float32Array {
  if (samples.length === 0) return new Float32Array(0);
  const N = samples.length;
  const out = new Float32Array(N);
  let energy = 0;
  for (let i = 0; i < N; i++) energy += (samples[i] ?? 0) * (samples[i] ?? 0);
  if (energy === 0) return out;
  for (let lag = 0; lag < N; lag++) {
    let s = 0;
    for (let i = 0; i < N - lag; i++) s += (samples[i] ?? 0) * (samples[i + lag] ?? 0);
    out[lag] = s / energy;
  }
  return out;
}

export function estimatePitch(
  samples: ArrayLike<number>,
  sampleRate: number,
  options: { minLag?: number; maxLag?: number } = {},
): { period: number; frequency: number; confidence: number } {
  assertPositive(sampleRate, 'sampleRate');
  const minLag = options.minLag ?? 2;
  const maxLag = options.maxLag ?? Math.floor(samples.length / 2);
  assertNonNegative(minLag, 'minLag');
  assertPositive(maxLag, 'maxLag');
  if (minLag >= maxLag) {
    return { period: 0, frequency: 0, confidence: 0 };
  }
  const ac = autocorrelation(samples);
  let bestLag = 0;
  let bestVal = -Infinity;
  for (let lag = minLag; lag <= maxLag; lag++) {
    const v = ac[lag] ?? 0;
    if (v > bestVal) {
      bestVal = v;
      bestLag = lag;
    }
  }
  const confidence = Math.max(0, bestVal);
  if (bestLag === 0) return { period: 0, frequency: 0, confidence };
  return { period: bestLag, frequency: sampleRate / bestLag, confidence };
}
