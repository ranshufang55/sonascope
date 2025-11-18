// Padding helpers for STFT framing and IFFT synthesis. Each
// function returns a new array padded to the requested length on
// either side. The input is never modified.

import {
  assertInteger,
  assertNonNegative,
  assertFiniteSamples,
  assertFinite,
} from './validation.js';

export type PaddingMode = 'zero' | 'reflect' | 'edge' | 'constant';

export function padZero(samples: ArrayLike<number>, left: number, right: number): Float32Array {
  assertNonNegative(left, 'left');
  assertNonNegative(right, 'right');
  return padSamples(samples, left, right, 'zero', 0);
}

export function padReflect(samples: ArrayLike<number>, left: number, right: number): Float32Array {
  assertNonNegative(left, 'left');
  assertNonNegative(right, 'right');
  return padSamples(samples, left, right, 'reflect', 0);
}

export function padEdge(samples: ArrayLike<number>, left: number, right: number): Float32Array {
  assertNonNegative(left, 'left');
  assertNonNegative(right, 'right');
  return padSamples(samples, left, right, 'edge', 0);
}

export function padConstant(
  samples: ArrayLike<number>,
  left: number,
  right: number,
  value: number = 0,
): Float32Array {
  assertNonNegative(left, 'left');
  assertNonNegative(right, 'right');
  return padSamples(samples, left, right, 'constant', value);
}

function padSamples(
  samples: ArrayLike<number>,
  left: number,
  right: number,
  mode: PaddingMode,
  constant: number,
): Float32Array {
  assertInteger(left, 'left');
  assertInteger(right, 'right');
  assertFiniteSamples(samples);
  assertFinite(constant, 'constant');
  if (samples.length + left + right > 2 ** 24 || !Number.isFinite(Math.fround(constant)))
    throw new RangeError('Padding exceeds Float32 sample budget');
  const out = new Float32Array(samples.length + left + right);
  for (let i = 0; i < left; i++) {
    out[i] = sampleAt(samples, indexFor(samples.length, i - left, mode), constant);
  }
  for (let i = 0; i < samples.length; i++) {
    out[left + i] = samples[i] ?? 0;
  }
  for (let i = 0; i < right; i++) {
    out[left + samples.length + i] = sampleAt(
      samples,
      indexFor(samples.length, samples.length + i, mode),
      constant,
    );
  }
  return out;
}

function indexFor(len: number, idx: number, mode: PaddingMode): number {
  if (mode === 'zero' || mode === 'constant') return -1;
  if (mode === 'edge') return Math.max(0, Math.min(len - 1, idx));
  if (mode === 'reflect') {
    if (len <= 1) return len === 0 ? -1 : 0;
    const period = 2 * (len - 1),
      wrapped = ((idx % period) + period) % period;
    return wrapped < len ? wrapped : period - wrapped;
  }
  return -1;
}

function sampleAt(samples: ArrayLike<number>, idx: number, constant: number): number {
  if (idx < 0) return constant;
  return samples[idx] ?? constant;
}

export function ensureLength(samples: ArrayLike<number>, length: number): Float32Array {
  assertInteger(length, 'length');
  assertFiniteSamples(samples);
  if (length > 2 ** 24) throw new RangeError('Output exceeds sample budget');
  assertNonNegative(length, 'length');
  if (samples.length === length) {
    const out = new Float32Array(length);
    for (let i = 0; i < length; i++) out[i] = samples[i] ?? 0;
    return out;
  }
  if (samples.length > length) {
    return new Float32Array(samples as Float32Array).slice(0, length);
  }
  return padZero(samples, 0, length - samples.length);
}

export function padToPowerOfTwo(samples: ArrayLike<number>): Float32Array {
  const target = Math.max(1, Math.pow(2, Math.ceil(Math.log2(Math.max(1, samples.length)))));
  return ensureLength(samples, target);
}

export const PADDING_MODES: readonly PaddingMode[] = Object.freeze([
  'zero',
  'reflect',
  'edge',
  'constant',
]);
export function assertPaddingMode(value: string): asserts value is PaddingMode {
  if (!(PADDING_MODES as readonly string[]).includes(value)) {
    throw new RangeError(`padding mode must be one of ${PADDING_MODES.join('|')}, got ${value}`);
  }
}
