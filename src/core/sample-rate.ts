// Sample-rate and time-domain conversion helpers.
//
// The library treats the canonical sample rates as 8 kHz, 16 kHz, 22.05 kHz,
// 32 kHz, 44.1 kHz, 48 kHz, and 96 kHz. These cover telephony, speech, CD,
// broadcast, and pro-audio use cases. Any other rate is allowed at the
// AudioBuffer level but the helper `isSupportedSampleRate` reports whether
// the value is part of the canonical set.

import { assertFinite, assertNonNegative, assertPositive } from './validation.js';

export const SUPPORTED_SAMPLE_RATES: readonly number[] = Object.freeze([
  8000, 11025, 16000, 22050, 32000, 44100, 48000, 88200, 96000, 192000,
]);

export function isSupportedSampleRate(rate: number): boolean {
  return SUPPORTED_SAMPLE_RATES.includes(rate);
}

export function secondsToSamples(seconds: number, sampleRate: number): number {
  assertFinite(seconds, 'seconds');
  assertPositive(sampleRate, 'sampleRate');
  return seconds * sampleRate;
}

export function samplesToSeconds(samples: number, sampleRate: number): number {
  assertFinite(samples, 'samples');
  assertPositive(sampleRate, 'sampleRate');
  return samples / sampleRate;
}

export function samplesToMilliseconds(samples: number, sampleRate: number): number {
  return samplesToSeconds(samples, sampleRate) * 1000;
}

export function millisecondsToSamples(ms: number, sampleRate: number): number {
  assertNonNegative(ms, 'ms');
  assertPositive(sampleRate, 'sampleRate');
  return (ms / 1000) * sampleRate;
}

export function frameCount(numSamples: number, frameSize: number, hopSize: number): number {
  assertPositive(frameSize, 'frameSize');
  assertPositive(hopSize, 'hopSize');
  if (numSamples < frameSize) return 0;
  return 1 + Math.floor((numSamples - frameSize) / hopSize);
}
