// Sample-rate and time-domain conversion helpers.
//
// The library treats the canonical sample rates as 8 kHz, 11.025 kHz,
// 16 kHz, 22.05 kHz, 32 kHz, 44.1 kHz, 48 kHz, 88.2 kHz, 96 kHz, and
// 192 kHz. These cover telephony, speech, CD, broadcast, and pro-audio
// use cases. Any other rate is allowed at the AudioBuffer level but
// isSupportedSampleRate reports whether the value is part of the
// canonical set.
//
// All conversion helpers require finite, well-typed arguments. The
// sample-rate and time-domain conversions accept fractional inputs
// where it makes sense (e.g. secondsToSamples with a fractional
// duration); the result is a real number, not necessarily an integer.
// The frame-count and hop helpers require positive integer sizes.

import { assertFinite, assertInteger, assertNonNegative, assertPositive } from './validation.js';

export const SUPPORTED_SAMPLE_RATES: readonly number[] = Object.freeze([
  8000, 11025, 16000, 22050, 32000, 44100, 48000, 88200, 96000, 192000,
]);

export const MAX_SAMPLE_RATE = 192_000;
export const MAX_SAMPLES_PER_BUFFER = 1 << 24;
export const MAX_DURATION_SECONDS = 1_000_000;

export function isSupportedSampleRate(rate: number): boolean {
  return SUPPORTED_SAMPLE_RATES.includes(rate);
}

export function assertSampleRate(rate: number): void {
  assertFinite(rate, 'sampleRate');
  assertPositive(rate, 'sampleRate');
  if (rate < 1 || rate > MAX_SAMPLE_RATE) {
    throw new RangeError(`sampleRate must be in [1, ${MAX_SAMPLE_RATE}], got ${rate}`);
  }
}

export function assertSampleCount(count: number): void {
  assertFinite(count, 'count');
  assertNonNegative(count, 'count');
  assertInteger(count, 'count');
  if (count > MAX_SAMPLES_PER_BUFFER) {
    throw new RangeError(`count must be <= ${MAX_SAMPLES_PER_BUFFER}, got ${count}`);
  }
}

export function assertDurationSeconds(duration: number): void {
  assertFinite(duration, 'duration');
  if (duration < 0) {
    throw new RangeError(`duration must be >= 0, got ${duration}`);
  }
  if (duration > MAX_DURATION_SECONDS) {
    throw new RangeError(`duration must be <= ${MAX_DURATION_SECONDS}, got ${duration}`);
  }
}

export function secondsToSamples(seconds: number, sampleRate: number): number {
  assertFinite(seconds, 'seconds');
  assertSampleRate(sampleRate);
  return seconds * sampleRate;
}

export function samplesToSeconds(samples: number, sampleRate: number): number {
  assertFinite(samples, 'samples');
  assertSampleRate(sampleRate);
  return samples / sampleRate;
}

export function samplesToMilliseconds(samples: number, sampleRate: number): number {
  return samplesToSeconds(samples, sampleRate) * 1000;
}

export function millisecondsToSamples(ms: number, sampleRate: number): number {
  assertFinite(ms, 'ms');
  if (ms < 0) {
    throw new RangeError(`ms must be >= 0, got ${ms}`);
  }
  assertSampleRate(sampleRate);
  return (ms / 1000) * sampleRate;
}

export function frameCount(numSamples: number, frameSize: number, hopSize: number): number {
  assertFinite(numSamples, 'numSamples');
  if (numSamples < 0) {
    throw new RangeError(`numSamples must be >= 0, got ${numSamples}`);
  }
  assertInteger(frameSize, 'frameSize');
  assertInteger(hopSize, 'hopSize');
  assertPositive(frameSize, 'frameSize');
  assertPositive(hopSize, 'hopSize');
  if (numSamples < frameSize) return 0;
  return 1 + Math.floor((numSamples - frameSize) / hopSize);
}
