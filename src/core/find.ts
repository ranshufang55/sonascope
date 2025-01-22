// Find helpers.

import { assertNonNegative, assertPositive } from './validation.js';

export interface MinMax {
  min: number;
  max: number;
  minIndex: number;
  maxIndex: number;
}

export function findMinMax(samples: ArrayLike<number>): MinMax {
  if (samples.length === 0) {
    return { min: 0, max: 0, minIndex: -1, maxIndex: -1 };
  }
  let mn = Infinity;
  let mx = -Infinity;
  let mnIdx = -1;
  let mxIdx = -1;
  for (let i = 0; i < samples.length; i++) {
    const v = samples[i] ?? 0;
    if (v < mn) {
      mn = v;
      mnIdx = i;
    }
    if (v > mx) {
      mx = v;
      mxIdx = i;
    }
  }
  return { min: mn, max: mx, minIndex: mnIdx, maxIndex: mxIdx };
}

export interface Peak {
  index: number;
  value: number;
}

export function findPeaks(
  samples: ArrayLike<number>,
  options: { minHeight?: number; minDistance?: number } = {},
): Peak[] {
  const minHeight = options.minHeight ?? 0;
  const minDistance = options.minDistance ?? 1;
  assertNonNegative(minHeight, 'minHeight');
  assertPositive(minDistance, 'minDistance');
  const peaks: Peak[] = [];
  for (let i = 1; i < samples.length - 1; i++) {
    const cur = samples[i] ?? 0;
    const prev = samples[i - 1] ?? 0;
    const next = samples[i + 1] ?? 0;
    if (cur > prev && cur > next && cur >= minHeight) {
      const last = peaks[peaks.length - 1];
      if (last && i - last.index < minDistance) {
        if (cur > last.value) {
          peaks[peaks.length - 1] = { index: i, value: cur };
        }
        continue;
      }
      peaks.push({ index: i, value: cur });
    }
  }
  return peaks;
}
