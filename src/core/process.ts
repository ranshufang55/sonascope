import { assertFiniteSamples } from './validation.js';
// Signal-processing primitives: normalization, DC removal, clipping,
// and pre-emphasis. Each routine is in-place, returns the same array
// for fluent composition, and is safe on empty input.

import { rms as computeRms } from './features-time.js';

function normalizePeakUnchecked(samples: Float32Array, target: number = 1): Float32Array {
  if (!Number.isFinite(target) || target <= 0) {
    throw new RangeError(`normalizePeak: target must be > 0, got ${target}`);
  }
  let max = 0;
  for (let i = 0; i < samples.length; i++) {
    const v = Math.abs(samples[i] ?? 0);
    if (v > max) max = v;
  }
  if (max === 0) return samples;
  const gain = target / max;
  for (let i = 0; i < samples.length; i++) samples[i] = (samples[i] ?? 0) * gain;
  return samples;
}

function normalizeRmsUnchecked(samples: Float32Array, target: number = 0.1): Float32Array {
  if (!Number.isFinite(target) || target <= 0) {
    throw new RangeError(`normalizeRms: target must be > 0, got ${target}`);
  }
  const r = computeRms(samples);
  if (r === 0) return samples;
  const gain = target / r;
  for (let i = 0; i < samples.length; i++) samples[i] = (samples[i] ?? 0) * gain;
  return samples;
}

function dcRemoveMeanUnchecked(samples: Float32Array): Float32Array {
  if (samples.length === 0) return samples;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] ?? 0;
  const mean = sum / samples.length;
  for (let i = 0; i < samples.length; i++) samples[i] = (samples[i] ?? 0) - mean;
  return samples;
}

export function dcRemoveHpf(samples: Float32Array, coefficient: number = 0.995): Float32Array {
  if (!(coefficient > 0 && coefficient < 1)) {
    throw new RangeError(`dcRemoveHpf: coefficient must be in (0, 1), got ${coefficient}`);
  }
  let prev = 0;
  let out = 0;
  for (let i = 0; i < samples.length; i++) {
    const cur = samples[i] ?? 0;
    out = cur - prev + coefficient * out;
    prev = cur;
    samples[i] = out;
  }
  return samples;
}

export function clipHard(samples: Float32Array, limit: number = 1): Float32Array {
  if (!(limit > 0)) {
    throw new RangeError(`clipHard: limit must be > 0, got ${limit}`);
  }
  for (let i = 0; i < samples.length; i++) {
    const v = samples[i] ?? 0;
    if (v > limit) samples[i] = limit;
    else if (v < -limit) samples[i] = -limit;
  }
  return samples;
}

export function clipSoft(samples: Float32Array, limit: number = 1): Float32Array {
  if (!(limit > 0)) {
    throw new RangeError(`clipSoft: limit must be > 0, got ${limit}`);
  }
  const k = 1 / limit;
  for (let i = 0; i < samples.length; i++) {
    const v = (samples[i] ?? 0) * k;
    samples[i] = limit * Math.tanh(v);
  }
  return samples;
}

export function preEmphasis(samples: Float32Array, coefficient: number = 0.97): Float32Array {
  if (!Number.isFinite(coefficient) || coefficient < 0 || coefficient >= 1) {
    throw new RangeError(`preEmphasis: coefficient must be in [0, 1), got ${coefficient}`);
  }
  let prev = 0;
  for (let i = 0; i < samples.length; i++) {
    const cur = samples[i] ?? 0;
    samples[i] = cur - coefficient * prev;
    prev = cur;
  }
  return samples;
}

export function deEmphasis(samples: Float32Array, coefficient: number = 0.97): Float32Array {
  if (!Number.isFinite(coefficient) || coefficient < 0 || coefficient >= 1) {
    throw new RangeError(`deEmphasis: coefficient must be in [0, 1), got ${coefficient}`);
  }
  let prev = 0;
  for (let i = 0; i < samples.length; i++) {
    const cur = samples[i] ?? 0;
    samples[i] = cur + coefficient * prev;
    prev = samples[i] ?? 0;
  }
  return samples;
}

/** Stage edits so any numeric failure leaves the caller's samples intact. */
function processSafely(
  samples: Float32Array,
  transform: (copy: Float32Array) => Float32Array,
): Float32Array {
  assertFiniteSamples(samples);
  const copy = transform(new Float32Array(samples));
  assertFiniteSamples(copy);
  samples.set(copy);
  return samples;
}

export function normalizePeak(samples: Float32Array, target: number = 1): Float32Array {
  return processSafely(samples, (copy) => normalizePeakUnchecked(copy, target));
}

export function normalizeRms(samples: Float32Array, target: number = 0.1): Float32Array {
  return processSafely(samples, (copy) => normalizeRmsUnchecked(copy, target));
}

export function dcRemoveMean(samples: Float32Array): Float32Array {
  return processSafely(samples, (copy) => dcRemoveMeanUnchecked(copy));
}
