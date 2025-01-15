import { describe, it, expect } from 'vitest';
import {
  SUPPORTED_SAMPLE_RATES,
  frameCount,
  isSupportedSampleRate,
  millisecondsToSamples,
  samplesToMilliseconds,
  samplesToSeconds,
  secondsToSamples,
} from './sample-rate.js';

describe('sample-rate conversions', () => {
  it('lists the supported canonical sample rates', () => {
    expect(SUPPORTED_SAMPLE_RATES).toContain(44100);
    expect(SUPPORTED_SAMPLE_RATES).toContain(48000);
    expect(SUPPORTED_SAMPLE_RATES).toContain(16000);
    expect(Object.isFrozen(SUPPORTED_SAMPLE_RATES)).toBe(true);
  });

  it('reports supported sample rates', () => {
    expect(isSupportedSampleRate(44100)).toBe(true);
    expect(isSupportedSampleRate(48000)).toBe(true);
    expect(isSupportedSampleRate(12345)).toBe(false);
  });

  it('round-trips seconds <-> samples', () => {
    expect(secondsToSamples(1, 48000)).toBe(48000);
    expect(samplesToSeconds(48000, 48000)).toBe(1);
    expect(samplesToSeconds(22050, 44100)).toBeCloseTo(0.5, 12);
    expect(samplesToMilliseconds(48000, 48000)).toBe(1000);
    expect(millisecondsToSamples(1000, 48000)).toBe(48000);
  });

  it('rejects non-positive sample rates', () => {
    expect(() => secondsToSamples(1, 0)).toThrow();
    expect(() => secondsToSamples(1, -1)).toThrow();
    expect(() => secondsToSamples(NaN, 48000)).toThrow();
  });

  it('computes frame count with hop', () => {
    expect(frameCount(1024, 1024, 512)).toBe(1);
    expect(frameCount(2048, 1024, 512)).toBe(3);
    expect(frameCount(2049, 1024, 512)).toBe(3);
    expect(frameCount(2560, 1024, 512)).toBe(4);
    expect(frameCount(512, 1024, 512)).toBe(0);
  });
});
