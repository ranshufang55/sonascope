// Additional generators: chirp, impulse, pink noise, brown noise, and a
// generic unit-impulse train. These are used by spectrogram tests, demo
// fixtures, and documentation examples.
//
// Like the periodic generators, these routines validate their inputs:
// non-finite amplitude/startPhase/seed and negative frequencies or
// negative durations are rejected. The product of duration and sample
// rate is bounded by MAX_SAMPLES_PER_BUFFER.

import { AudioBuffer } from './buffer.js';
import { MAX_SAMPLES_PER_BUFFER, assertSampleRate } from './sample-rate.js';

const TWO_PI = Math.PI * 2;

export interface ChirpOptions {
  amplitude?: number;
  startPhase?: number;
  fromFrequency?: number;
}

function requireFiniteOption(value: number, label: string): number {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${label} must be finite, got ${value}`);
  }
  return value;
}

function makeBuffer(sampleRate: number, durationSeconds: number): AudioBuffer {
  assertSampleRate(sampleRate);
  if (!Number.isFinite(durationSeconds)) {
    throw new RangeError(`durationSeconds must be finite, got ${durationSeconds}`);
  }
  if (durationSeconds < 0) {
    throw new RangeError(`durationSeconds must be >= 0, got ${durationSeconds}`);
  }
  const numSamples = Math.round(durationSeconds * sampleRate);
  if (numSamples > MAX_SAMPLES_PER_BUFFER) {
    throw new RangeError(`generate: sample count ${numSamples} exceeds ${MAX_SAMPLES_PER_BUFFER}`);
  }
  return new AudioBuffer(sampleRate, 1, numSamples);
}

function requireFrequency(frequency: number, label: string): number {
  if (!Number.isFinite(frequency)) {
    throw new RangeError(`${label} must be finite, got ${frequency}`);
  }
  if (frequency < 0) {
    throw new RangeError(`${label} must be >= 0, got ${frequency}`);
  }
  return frequency;
}

/** Linear frequency sweep from f0 to f1 over the requested duration. */
export function generateLinearChirp(
  sampleRate: number,
  durationSeconds: number,
  fromFrequency: number,
  toFrequency: number,
  options?: ChirpOptions,
): AudioBuffer {
  const f0 = requireFrequency(fromFrequency, 'fromFrequency');
  const f1 = requireFrequency(toFrequency, 'toFrequency');
  const buf = makeBuffer(sampleRate, durationSeconds);
  const amplitude = options ? requireFiniteOption(options.amplitude ?? 1, 'amplitude') : 1;
  const startPhase = options ? requireFiniteOption(options.startPhase ?? 0, 'startPhase') : 0;
  const data = buf.getChannel(0);
  if (buf.numSamples === 0) {
    for (let i = 0; i < buf.numSamples; i++) data[i] = 0;
    return buf;
  }
  const k = (f1 - f0) / Math.max(1e-12, durationSeconds);
  for (let i = 0; i < buf.numSamples; i++) {
    const t = i / sampleRate;
    const phase = startPhase + TWO_PI * (f0 * t + 0.5 * k * t * t);
    data[i] = amplitude * Math.sin(phase);
  }
  return buf;
}

/** Logarithmic frequency sweep — perceptually even pitch glide. */
export function generateLogChirp(
  sampleRate: number,
  durationSeconds: number,
  fromFrequency: number,
  toFrequency: number,
  options?: ChirpOptions,
): AudioBuffer {
  const f0 = requireFrequency(fromFrequency, 'fromFrequency');
  const f1 = requireFrequency(toFrequency, 'toFrequency');
  if (f0 === 0 || f1 === 0) {
    throw new RangeError(
      `generateLogChirp: fromFrequency and toFrequency must be > 0, got ${f0} and ${f1}`,
    );
  }
  const buf = makeBuffer(sampleRate, durationSeconds);
  const amplitude = options ? requireFiniteOption(options.amplitude ?? 1, 'amplitude') : 1;
  const startPhase = options ? requireFiniteOption(options.startPhase ?? 0, 'startPhase') : 0;
  const data = buf.getChannel(0);
  if (buf.numSamples === 0) {
    for (let i = 0; i < buf.numSamples; i++) data[i] = 0;
    return buf;
  }
  const k = Math.log(f1 / f0);
  for (let i = 0; i < buf.numSamples; i++) {
    const t = i / sampleRate;
    const freq = f0 * Math.exp((k * t) / Math.max(1e-12, durationSeconds));
    const phase =
      startPhase +
      (TWO_PI * (f0 * (Math.exp((k * t) / Math.max(1e-12, durationSeconds)) - 1))) /
        (k / Math.max(1e-12, durationSeconds));
    data[i] = amplitude * Math.sin(phase);
    void freq;
  }
  return buf;
}

/** Single-sample impulse at index 0 (or later, with offset). */
export function generateImpulse(
  sampleRate: number,
  durationSeconds: number,
  amplitude: number = 1,
  offsetSamples: number = 0,
): AudioBuffer {
  if (!Number.isFinite(amplitude)) {
    throw new RangeError(`generateImpulse: amplitude must be finite, got ${amplitude}`);
  }
  if (!Number.isInteger(offsetSamples) || offsetSamples < 0) {
    throw new RangeError(
      `generateImpulse: offsetSamples must be a non-negative integer, got ${offsetSamples}`,
    );
  }
  const buf = makeBuffer(sampleRate, durationSeconds);
  if (offsetSamples < buf.numSamples) {
    const data = buf.getChannel(0);
    data[offsetSamples] = amplitude;
  }
  return buf;
}

/** Periodic impulse train at the requested period in samples. */
export function generateImpulseTrain(
  sampleRate: number,
  durationSeconds: number,
  periodSamples: number,
  amplitude: number = 1,
): AudioBuffer {
  if (!Number.isInteger(periodSamples) || periodSamples < 1) {
    throw new RangeError(
      `generateImpulseTrain: periodSamples must be a positive integer, got ${periodSamples}`,
    );
  }
  if (!Number.isFinite(amplitude)) {
    throw new RangeError(`generateImpulseTrain: amplitude must be finite, got ${amplitude}`);
  }
  const buf = makeBuffer(sampleRate, durationSeconds);
  const data = buf.getChannel(0);
  for (let i = 0; i < buf.numSamples; i += periodSamples) data[i] = amplitude;
  return buf;
}

/** Pink noise via the Voss-McCartney algorithm. */
export function generatePinkNoise(
  sampleRate: number,
  durationSeconds: number,
  options?: { amplitude?: number; seed?: number },
): AudioBuffer {
  const buf = makeBuffer(sampleRate, durationSeconds);
  const amplitude = options ? requireFiniteOption(options.amplitude ?? 1, 'amplitude') : 1;
  const seed = options?.seed ?? 1;
  if (!Number.isFinite(seed)) {
    throw new RangeError(`generatePinkNoise: seed must be finite, got ${seed}`);
  }
  if (!Number.isInteger(seed)) {
    throw new RangeError(`generatePinkNoise: seed must be an integer, got ${seed}`);
  }
  let a = (seed >>> 0) + 0x6d2b79f5;
  const rand = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const numRows = 16;
  const rows = new Float32Array(numRows);
  let runningSum = 0;
  for (let r = 0; r < numRows; r++) {
    rows[r] = (rand() ?? 0) * 2 - 1;
    runningSum += rows[r] ?? 0;
  }
  let counter = 0;
  const data = buf.getChannel(0);
  for (let i = 0; i < buf.numSamples; i++) {
    counter++;
    let bit = 0;
    let n = counter;
    while ((n & 1) === 0 && bit < numRows) {
      n >>= 1;
      bit++;
    }
    if (bit < numRows) {
      const prev = rows[bit] ?? 0;
      const next = (rand() ?? 0) * 2 - 1;
      runningSum += next - prev;
      rows[bit] = next;
    }
    data[i] = amplitude * (runningSum / numRows);
  }
  return buf;
}

/** Brown (red) noise — integrated white noise with -20 dB/decade roll-off. */
export function generateBrownNoise(
  sampleRate: number,
  durationSeconds: number,
  options?: { amplitude?: number; seed?: number },
): AudioBuffer {
  const buf = makeBuffer(sampleRate, durationSeconds);
  const amplitude = options ? requireFiniteOption(options.amplitude ?? 1, 'amplitude') : 1;
  const seed = options?.seed ?? 1;
  if (!Number.isFinite(seed) || !Number.isInteger(seed)) {
    throw new RangeError(`generateBrownNoise: seed must be a finite integer, got ${seed}`);
  }
  let a = (seed >>> 0) + 0x6d2b79f5;
  const rand = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const data = buf.getChannel(0);
  let last = 0;
  for (let i = 0; i < buf.numSamples; i++) {
    const w = (rand() ?? 0) * 2 - 1;
    last = (last + 0.02 * w) * 0.995;
    data[i] = amplitude * last;
  }
  // Normalise to roughly fit [-1, 1] over a finite window.
  let peak = 0;
  for (let i = 0; i < buf.numSamples; i++) {
    const v = Math.abs(data[i] ?? 0);
    if (v > peak) peak = v;
  }
  if (peak > 0) {
    const gain = 1 / peak;
    for (let i = 0; i < buf.numSamples; i++) data[i] = (data[i] ?? 0) * gain;
  }
  return buf;
}
