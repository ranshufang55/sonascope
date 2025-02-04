// Waveform min/max pyramid. Pre-computes per-pixel min/max pairs at
// multiple resolutions so a render call can ask for any sample range
// in O(levels).

import { assertNonNegative, assertPositive } from './validation.js';

export interface PyramidLevel {
  min: Float32Array;
  max: Float32Array;
}

export interface Pyramid {
  levels: PyramidLevel[];
  numSamples: number;
}

export function buildPyramid(samples: ArrayLike<number>, levels: number = 6): Pyramid {
  assertNonNegative(levels, 'levels');
  assertPositive(levels, 'levels');
  const out: PyramidLevel[] = [];
  let currentMin = new Float32Array(samples.length);
  let currentMax = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    currentMin[i] = samples[i] ?? 0;
    currentMax[i] = samples[i] ?? 0;
  }
  out.push({ min: currentMin, max: currentMax });
  for (let l = 1; l < levels; l++) {
    const prev = out[l - 1];
    if (!prev) break;
    const len = prev.min.length;
    const nextLen = Math.max(1, Math.ceil(len / 2));
    const nextMin = new Float32Array(nextLen);
    const nextMax = new Float32Array(nextLen);
    for (let i = 0; i < nextLen; i++) {
      const a = i * 2;
      const b = Math.min(len - 1, a + 1);
      const mn = Math.min(prev.min[a] ?? 0, prev.min[b] ?? 0);
      const mx = Math.max(prev.max[a] ?? 0, prev.max[b] ?? 0);
      nextMin[i] = mn;
      nextMax[i] = mx;
    }
    out.push({ min: nextMin, max: nextMax });
    if (nextLen <= 1) break;
  }
  return { levels: out, numSamples: samples.length };
}

export function queryPyramid(
  pyramid: Pyramid,
  startSample: number,
  endSample: number,
): { min: number; max: number } {
  if (pyramid.levels.length === 0) return { min: 0, max: 0 };
  const lo = Math.max(0, Math.min(pyramid.numSamples, Math.floor(startSample)));
  const hi = Math.max(lo, Math.min(pyramid.numSamples, Math.ceil(endSample)));
  let mn = Infinity;
  let mx = -Infinity;
  for (let l = 0; l < pyramid.levels.length; l++) {
    const level = pyramid.levels[l];
    if (!level) continue;
    const stride = 1 << l;
    const a = Math.floor(lo / stride);
    const b = Math.min(level.min.length - 1, Math.ceil(hi / stride));
    if (a > b) continue;
    for (let i = a; i <= b; i++) {
      const a2 = level.min[i] ?? 0;
      const b2 = level.max[i] ?? 0;
      if (a2 < mn) mn = a2;
      if (b2 > mx) mx = b2;
    }
  }
  if (mn === Infinity) mn = 0;
  if (mx === -Infinity) mx = 0;
  return { min: mn, max: mx };
}
