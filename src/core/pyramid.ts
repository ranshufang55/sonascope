import { assertFinite, assertFiniteSamples, assertInteger, assertInRange } from './validation.js';

export interface PyramidLevel {
  min: Float32Array;
  max: Float32Array;
}
export interface Pyramid {
  levels: PyramidLevel[];
  numSamples: number;
}
export interface PyramidRange {
  min: number;
  max: number;
}

/** Build min/max levels. The default reaches the root in at most 25 levels. */
export function buildPyramid(samples: ArrayLike<number>, levels = 32): Pyramid {
  assertInteger(levels, 'levels');
  assertInRange(levels, 1, 32, 'levels');
  assertFiniteSamples(samples);
  const initial = Float32Array.from(samples);
  assertFiniteSamples(initial);
  const result: PyramidLevel[] = [{ min: initial, max: initial.slice() }];
  while (result.length < levels) {
    const previous = result[result.length - 1]!;
    if (previous.min.length <= 1) break;
    const size = Math.ceil(previous.min.length / 2);
    const min = new Float32Array(size);
    const max = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      const left = i * 2;
      const right = Math.min(left + 1, previous.min.length - 1);
      min[i] = Math.min(previous.min[left]!, previous.min[right]!);
      max[i] = Math.max(previous.max[left]!, previous.max[right]!);
    }
    result.push({ min, max });
  }
  return { levels: result, numSamples: samples.length };
}

/** Query a clamped half-open range using only completely contained blocks. */
export function queryPyramid(
  pyramid: Pyramid,
  startSample: number,
  endSample: number,
): PyramidRange {
  assertFinite(startSample, 'startSample');
  assertFinite(endSample, 'endSample');
  let start = Math.max(0, Math.min(pyramid.numSamples, Math.floor(startSample)));
  const end = Math.max(start, Math.min(pyramid.numSamples, Math.ceil(endSample)));
  if (start >= end) return { min: 0, max: 0 };
  let min = Infinity;
  let max = -Infinity;
  while (start < end) {
    let level = pyramid.levels.length - 1;
    while (level > 0 && (start % 2 ** level !== 0 || start + 2 ** level > end)) level--;
    const selected = pyramid.levels[level];
    if (!selected) throw new RangeError('pyramid has no base level');
    const index = start / 2 ** level;
    if (index >= selected.min.length || index >= selected.max.length)
      throw new RangeError('invalid pyramid level');
    min = Math.min(min, selected.min[index]!);
    max = Math.max(max, selected.max[index]!);
    start += 2 ** level;
  }
  return { min, max };
}
