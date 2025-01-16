// Additional generators: chirp, impulse, pink noise, brown noise, and a
// generic unit-impulse train. These are used by spectrogram tests, demo
// fixtures, and documentation examples.

import { AudioBuffer } from './buffer.js';
import { assertFinite, assertPositive } from './validation.js';

const TWO_PI = Math.PI * 2;

export interface ChirpOptions {
  amplitude?: number;
  startPhase?: number;
  fromFrequency?: number;
}

/** Linear frequency sweep from f0 to f1 over the requested duration. */
export function generateLinearChirp(
  sampleRate: number,
  durationSeconds: number,
  fromFrequency: number,
  toFrequency: number,
  options?: ChirpOptions,
): AudioBuffer {
  assertPositive(sampleRate, 'sampleRate');
  assertFinite(durationSeconds, 'durationSeconds');
  assertFinite(fromFrequency, 'fromFrequency');
  assertFinite(toFrequency, 'toFrequency');
  const numSamples = Math.max(0, Math.round(durationSeconds * sampleRate));
  const amplitude = options?.amplitude ?? 1;
  const startPhase = options?.startPhase ?? 0;
  const buf = new AudioBuffer(sampleRate, 1, numSamples);
  const data = buf.getChannel(0);
  const k = (toFrequency - fromFrequency) / durationSeconds;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const phase = startPhase + TWO_PI * (fromFrequency * t + 0.5 * k * t * t);
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
  assertPositive(sampleRate, 'sampleRate');
  assertFinite(durationSeconds, 'durationSeconds');
  assertPositive(fromFrequency, 'fromFrequency');
  assertPositive(toFrequency, 'toFrequency');
  const numSamples = Math.max(0, Math.round(durationSeconds * sampleRate));
  const amplitude = options?.amplitude ?? 1;
  const startPhase = options?.startPhase ?? 0;
  const buf = new AudioBuffer(sampleRate, 1, numSamples);
  const data = buf.getChannel(0);
  const ratio = toFrequency / fromFrequency;
  const K = durationSeconds / Math.log(ratio);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // The log-chirp instantaneous frequency is fromFrequency * ratio^(t/duration).
    // The integrated phase is fromFrequency * K * (ratio^(t/duration) - 1).
    const exponent = t / durationSeconds;
    const phase = startPhase + TWO_PI * fromFrequency * K * (Math.pow(ratio, exponent) - 1);
    data[i] = amplitude * Math.sin(phase);
  }
  return buf;
}

/** Unit impulse at the start (1.0 followed by zeros). */
export function generateImpulse(
  sampleRate: number,
  durationSeconds: number,
  amplitude: number = 1,
): AudioBuffer {
  assertPositive(sampleRate, 'sampleRate');
  assertFinite(durationSeconds, 'durationSeconds');
  const numSamples = Math.max(0, Math.round(durationSeconds * sampleRate));
  const buf = new AudioBuffer(sampleRate, 1, numSamples);
  if (numSamples > 0) buf.getChannel(0)[0] = amplitude;
  return buf;
}

/** Train of N unit impulses spaced every `periodSamples`. */
export function generateImpulseTrain(
  sampleRate: number,
  numSamples: number,
  periodSamples: number,
  amplitude: number = 1,
): AudioBuffer {
  assertPositive(sampleRate, 'sampleRate');
  assertPositive(periodSamples, 'periodSamples');
  const buf = new AudioBuffer(sampleRate, 1, numSamples);
  const data = buf.getChannel(0);
  for (let i = 0; i < numSamples; i += periodSamples) {
    data[i] = amplitude;
  }
  return buf;
}

/** Pink noise via the Voss-McCartney algorithm with deterministic seeding. */
function lcg(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a * 1664525 + 1013904223) >>> 0;
    return a / 4294967296;
  };
}

export function generatePinkNoise(
  sampleRate: number,
  durationSeconds: number,
  options?: { amplitude?: number; seed?: number },
): AudioBuffer {
  assertPositive(sampleRate, 'sampleRate');
  assertFinite(durationSeconds, 'durationSeconds');
  const numSamples = Math.max(0, Math.round(durationSeconds * sampleRate));
  const amplitude = options?.amplitude ?? 1;
  const seed = options?.seed ?? 1;
  const rand = lcg(seed);
  const numRows = 16;
  const rows = new Float32Array(numRows);
  let runningSum = 0;
  for (let r = 0; r < numRows; r++) {
    rows[r] = rand() * 2 - 1;
    runningSum += rows[r] ?? 0;
  }
  let counter = 0;
  const buf = new AudioBuffer(sampleRate, 1, numSamples);
  const data = buf.getChannel(0);
  for (let i = 0; i < numSamples; i++) {
    counter++;
    let lowestBit = 0;
    for (let b = 0; b < numRows; b++) {
      if ((counter & (1 << b)) === 0) {
        lowestBit = b;
        break;
      }
      lowestBit = b + 1;
    }
    if (lowestBit < numRows) {
      const prev = rows[lowestBit] ?? 0;
      const next = rand() * 2 - 1;
      runningSum += next - prev;
      rows[lowestBit] = next;
    }
    const white = rand() * 2 - 1;
    const pink = (runningSum + white) / (numRows + 1);
    data[i] = amplitude * pink;
  }
  return buf;
}

/** Brown noise (integrated white noise) — strong low-frequency content. */
export function generateBrownNoise(
  sampleRate: number,
  durationSeconds: number,
  options?: { amplitude?: number; seed?: number },
): AudioBuffer {
  assertPositive(sampleRate, 'sampleRate');
  assertFinite(durationSeconds, 'durationSeconds');
  const numSamples = Math.max(0, Math.round(durationSeconds * sampleRate));
  const amplitude = options?.amplitude ?? 1;
  const seed = options?.seed ?? 1;
  const rand = lcg(seed);
  const buf = new AudioBuffer(sampleRate, 1, numSamples);
  const data = buf.getChannel(0);
  let last = 0;
  for (let i = 0; i < numSamples; i++) {
    const white = rand() * 2 - 1;
    last = Math.max(-1, Math.min(1, last + 0.02 * white));
    data[i] = amplitude * last;
  }
  return buf;
}
