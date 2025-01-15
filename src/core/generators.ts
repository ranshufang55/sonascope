// Signal generators: sine, square, sawtooth, triangle, and white noise.
// These are the canonical workhorses for tests and demos — every analysis
// routine in the library is verified against known signals produced here.

import { AudioBuffer } from './buffer.js';
import { assertFinite, assertPositive } from './validation.js';

const TWO_PI = Math.PI * 2;

export interface GeneratorOptions {
  amplitude?: number;
  phase?: number;
}

function normalizeOptions(opts: GeneratorOptions | undefined): {
  amplitude: number;
  phase: number;
} {
  return {
    amplitude: opts?.amplitude ?? 1,
    phase: opts?.phase ?? 0,
  };
}

/** Pure sine wave at a fixed frequency. */
export function generateSine(
  sampleRate: number,
  durationSeconds: number,
  frequency: number,
  options?: GeneratorOptions,
): AudioBuffer {
  assertPositive(sampleRate, 'sampleRate');
  assertFinite(durationSeconds, 'durationSeconds');
  assertFinite(frequency, 'frequency');
  const numSamples = Math.max(0, Math.round(durationSeconds * sampleRate));
  const { amplitude, phase } = normalizeOptions(options);
  const buf = new AudioBuffer(sampleRate, 1, numSamples);
  const data = buf.getChannel(0);
  const step = (TWO_PI * frequency) / sampleRate;
  for (let i = 0; i < numSamples; i++) {
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
  assertPositive(sampleRate, 'sampleRate');
  assertFinite(durationSeconds, 'durationSeconds');
  assertFinite(frequency, 'frequency');
  const numSamples = Math.max(0, Math.round(durationSeconds * sampleRate));
  const { amplitude, phase } = normalizeOptions(options);
  const duty = options?.duty ?? 0.5;
  if (duty <= 0 || duty >= 1) {
    throw new RangeError(`generateSquare: duty must be in (0, 1), got ${duty}`);
  }
  const buf = new AudioBuffer(sampleRate, 1, numSamples);
  const data = buf.getChannel(0);
  const periodSamples = sampleRate / frequency;
  for (let i = 0; i < numSamples; i++) {
    const t = ((i + phase) % periodSamples) / periodSamples;
    data[i] = t < duty ? amplitude : -amplitude;
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
  assertPositive(sampleRate, 'sampleRate');
  assertFinite(durationSeconds, 'durationSeconds');
  assertFinite(frequency, 'frequency');
  const numSamples = Math.max(0, Math.round(durationSeconds * sampleRate));
  const { amplitude, phase } = normalizeOptions(options);
  const buf = new AudioBuffer(sampleRate, 1, numSamples);
  const data = buf.getChannel(0);
  const periodSamples = sampleRate / frequency;
  for (let i = 0; i < numSamples; i++) {
    const t = ((i + phase) % periodSamples) / periodSamples;
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
  assertPositive(sampleRate, 'sampleRate');
  assertFinite(durationSeconds, 'durationSeconds');
  assertFinite(frequency, 'frequency');
  const numSamples = Math.max(0, Math.round(durationSeconds * sampleRate));
  const { amplitude, phase } = normalizeOptions(options);
  const buf = new AudioBuffer(sampleRate, 1, numSamples);
  const data = buf.getChannel(0);
  const periodSamples = sampleRate / frequency;
  for (let i = 0; i < numSamples; i++) {
    const t = ((i + phase) % periodSamples) / periodSamples;
    data[i] = amplitude * (4 * Math.abs(t - 0.5) - 1);
  }
  return buf;
}

export interface NoiseOptions extends GeneratorOptions {
  seed?: number;
}

/** Mulberry32 — a small, deterministic PRNG suitable for tests and demos. */
function mulberry32(seed: number): () => number {
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
  assertPositive(sampleRate, 'sampleRate');
  assertFinite(durationSeconds, 'durationSeconds');
  const numSamples = Math.max(0, Math.round(durationSeconds * sampleRate));
  const { amplitude } = normalizeOptions(options);
  const seed = options?.seed ?? 1;
  const rand = mulberry32(seed);
  const buf = new AudioBuffer(sampleRate, 1, numSamples);
  const data = buf.getChannel(0);
  for (let i = 0; i < numSamples; i++) {
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
  assertPositive(sampleRate, 'sampleRate');
  assertFinite(durationSeconds, 'durationSeconds');
  const numSamples = Math.max(0, Math.round(durationSeconds * sampleRate));
  const { amplitude } = normalizeOptions(options);
  const seed = options?.seed ?? 1;
  const rand = mulberry32(seed);
  const buf = new AudioBuffer(sampleRate, 1, numSamples);
  const data = buf.getChannel(0);
  for (let i = 0; i < numSamples; i++) {
    const u1 = Math.max(rand(), 1e-12);
    const u2 = rand();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(TWO_PI * u2);
    data[i] = amplitude * z;
  }
  return buf;
}
