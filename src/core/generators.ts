// Signal generators: sine, square, sawtooth, triangle, and white noise.
// These are the canonical workhorses for tests and demos — every analysis
// routine in the library is verified against known signals produced here.
//
// The shared `phase` option is interpreted as a *radian* offset on the
// underlying sinusoid for every periodic generator. Square, sawtooth, and
// triangle translate that into an equivalent cycle offset so the
// behaviour is consistent across the family. Negative phases are
// normalised by repeatedly adding the period until the result is in
// [0, 2π). All option values (amplitude, phase, duty, seed) must be
// finite; non-finite inputs are rejected. Negative frequencies and
// negative durations raise a RangeError. The product of duration and
// sample rate is bounded by MAX_SAMPLES_PER_BUFFER.

import { AudioBuffer } from './buffer.js';
import { MAX_SAMPLES_PER_BUFFER, assertDurationSeconds, assertSampleRate } from './sample-rate.js';
import { assertFinite } from './validation.js';

const TWO_PI = Math.PI * 2;

export interface GeneratorOptions {
  /** Output amplitude in [-1, 1] target. Defaults to 1. */
  amplitude?: number;
  /** Phase offset in radians. Defaults to 0. Negative values are normalised. */
  phase?: number;
}

function normalizeOptions(opts: GeneratorOptions | undefined): {
  amplitude: number;
  phase: number;
} {
  const amplitude = opts?.amplitude ?? 1;
  const phase = opts?.phase ?? 0;
  if (!Number.isFinite(amplitude)) {
    throw new RangeError(`generate: amplitude must be finite, got ${amplitude}`);
  }
  if (!Number.isFinite(phase)) {
    throw new RangeError(`generate: phase must be finite, got ${phase}`);
  }
  if (amplitude < 0) {
    throw new RangeError(`generate: amplitude must be >= 0, got ${amplitude}`);
  }
  return { amplitude, phase: ((phase % TWO_PI) + TWO_PI) % TWO_PI };
}

function requireDuration(durationSeconds: number, label: string): number {
  assertFinite(durationSeconds, label);
  if (durationSeconds < 0) {
    throw new RangeError(`${label} must be >= 0, got ${durationSeconds}`);
  }
  if (durationSeconds > 0 && !Number.isFinite(durationSeconds)) {
    throw new RangeError(`${label} must be finite, got ${durationSeconds}`);
  }
  return durationSeconds;
}

function requireFrequency(frequency: number, label: string): number {
  assertFinite(frequency, label);
  if (frequency < 0) {
    throw new RangeError(`${label} must be >= 0, got ${frequency}`);
  }
  return frequency;
}

function makeBuffer(sampleRate: number, durationSeconds: number): AudioBuffer {
  assertSampleRate(sampleRate);
  const duration = requireDuration(durationSeconds, 'durationSeconds');
  const numSamples = Math.round(duration * sampleRate);
  if (numSamples > MAX_SAMPLES_PER_BUFFER) {
    throw new RangeError(`generate: sample count ${numSamples} exceeds ${MAX_SAMPLES_PER_BUFFER}`);
  }
  return new AudioBuffer(sampleRate, 1, numSamples);
}

/** Pure sine wave at a fixed frequency. */
export function generateSine(
  sampleRate: number,
  durationSeconds: number,
  frequency: number,
  options?: GeneratorOptions,
): AudioBuffer {
  const freq = requireFrequency(frequency, 'frequency');
  const buf = makeBuffer(sampleRate, durationSeconds);
  const { amplitude, phase } = normalizeOptions(options);
  const data = buf.getChannel(0);
  const step = (TWO_PI * freq) / sampleRate;
  for (let i = 0; i < buf.numSamples; i++) {
    data[i] = amplitude * Math.sin(phase + step * i);
  }
  return buf;
}

/** Square wave in (-1, 1) with the requested duty cycle (0..1). */
export function generateSquare(
  sampleRate: number,
  durationSeconds: number,
  frequency: number,
  options?: GeneratorOptions & { duty?: number },
): AudioBuffer {
  const freq = requireFrequency(frequency, 'frequency');
  const buf = makeBuffer(sampleRate, durationSeconds);
  const { amplitude, phase } = normalizeOptions(options);
  const duty = options?.duty ?? 0.5;
  if (!Number.isFinite(duty)) {
    throw new RangeError(`generateSquare: duty must be finite, got ${duty}`);
  }
  if (duty <= 0 || duty >= 1) {
    throw new RangeError(`generateSquare: duty must be in (0, 1), got ${duty}`);
  }
  const data = buf.getChannel(0);
  if (freq === 0) {
    for (let i = 0; i < buf.numSamples; i++) data[i] = amplitude;
    return buf;
  }
  const periodSamples = sampleRate / freq;
  const phaseOffset = (phase / TWO_PI) * periodSamples;
  for (let i = 0; i < buf.numSamples; i++) {
    const t = (((i + phaseOffset) % periodSamples) + periodSamples) % periodSamples;
    data[i] = t < duty * periodSamples ? amplitude : -amplitude;
  }
  return buf;
}

/** Sawtooth wave ramping from -amp to +amp across each period. */
export function generateSawtooth(
  sampleRate: number,
  durationSeconds: number,
  frequency: number,
  options?: GeneratorOptions,
): AudioBuffer {
  const freq = requireFrequency(frequency, 'frequency');
  const buf = makeBuffer(sampleRate, durationSeconds);
  const { amplitude, phase } = normalizeOptions(options);
  const data = buf.getChannel(0);
  if (freq === 0) {
    for (let i = 0; i < buf.numSamples; i++) data[i] = -amplitude;
    return buf;
  }
  const periodSamples = sampleRate / freq;
  const phaseOffset = (phase / TWO_PI) * periodSamples;
  for (let i = 0; i < buf.numSamples; i++) {
    const t =
      ((((i + phaseOffset) % periodSamples) + periodSamples) % periodSamples) / periodSamples;
    data[i] = amplitude * (2 * t - 1);
  }
  return buf;
}

/** Symmetric triangle wave with peak at +/- amplitude. */
export function generateTriangle(
  sampleRate: number,
  durationSeconds: number,
  frequency: number,
  options?: GeneratorOptions,
): AudioBuffer {
  const freq = requireFrequency(frequency, 'frequency');
  const buf = makeBuffer(sampleRate, durationSeconds);
  const { amplitude, phase } = normalizeOptions(options);
  const data = buf.getChannel(0);
  if (freq === 0) {
    for (let i = 0; i < buf.numSamples; i++) data[i] = amplitude;
    return buf;
  }
  const periodSamples = sampleRate / freq;
  const phaseOffset = (phase / TWO_PI) * periodSamples;
  for (let i = 0; i < buf.numSamples; i++) {
    const t =
      ((((i + phaseOffset) % periodSamples) + periodSamples) % periodSamples) / periodSamples;
    data[i] = amplitude * (4 * Math.abs(t - 0.5) - 1);
  }
  return buf;
}

export interface NoiseOptions extends GeneratorOptions {
  seed?: number;
}

/** Mulberry32 — a small, deterministic PRNG suitable for tests and demos. */
function mulberry32(seed: number): () => number {
  if (!Number.isFinite(seed)) {
    throw new RangeError(`mulberry32: seed must be finite, got ${seed}`);
  }
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** White noise with uniform distribution in [-amplitude, +amplitude]. */
export function generateWhiteNoise(
  sampleRate: number,
  durationSeconds: number,
  options?: NoiseOptions,
): AudioBuffer {
  const buf = makeBuffer(sampleRate, durationSeconds);
  const { amplitude } = normalizeOptions(options);
  const seed = options?.seed ?? 1;
  if (!Number.isFinite(seed)) {
    throw new RangeError(`generateWhiteNoise: seed must be finite, got ${seed}`);
  }
  if (!Number.isInteger(seed)) {
    throw new RangeError(`generateWhiteNoise: seed must be an integer, got ${seed}`);
  }
  const rand = mulberry32(seed);
  const data = buf.getChannel(0);
  for (let i = 0; i < buf.numSamples; i++) {
    data[i] = amplitude * (rand() * 2 - 1);
  }
  return buf;
}

/** Gaussian white noise (Box-Muller) — distribution concentrated near 0. */
export function generateGaussianNoise(
  sampleRate: number,
  durationSeconds: number,
  options?: NoiseOptions,
): AudioBuffer {
  const buf = makeBuffer(sampleRate, durationSeconds);
  const { amplitude } = normalizeOptions(options);
  const seed = options?.seed ?? 1;
  if (!Number.isFinite(seed)) {
    throw new RangeError(`generateGaussianNoise: seed must be finite, got ${seed}`);
  }
  if (!Number.isInteger(seed)) {
    throw new RangeError(`generateGaussianNoise: seed must be an integer, got ${seed}`);
  }
  const rand = mulberry32(seed);
  const data = buf.getChannel(0);
  for (let i = 0; i < buf.numSamples; i++) {
    const u1 = Math.max(rand(), 1e-12);
    const u2 = rand();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(TWO_PI * u2);
    data[i] = amplitude * z;
  }
  return buf;
}

// Re-export the time guard so callers can validate the surface
// without depending on sample-rate.
export { assertDurationSeconds };
