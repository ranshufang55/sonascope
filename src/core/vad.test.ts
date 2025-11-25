import { describe, it, expect } from 'vitest';
import { detectSilence, voiceActivityDetector } from './vad.js';

describe('vad', () => {
  it('detectSilence finds a quiet run in a noisy signal', () => {
    const samples = new Float32Array(100);
    for (let i = 0; i < 100; i++) samples[i] = i < 30 || i >= 70 ? 0.5 : 0;
    const runs = detectSilence(samples, { threshold: 0.01, minRun: 5 });
    expect(runs.length).toBe(1);
    expect(runs[0]?.start).toBe(30);
    expect(runs[0]?.end).toBe(70);
  });

  it('detectSilence on a fully silent signal returns a single run', () => {
    const samples = new Float32Array(64);
    const runs = detectSilence(samples);
    expect(runs.length).toBe(1);
  });

  it('voiceActivityDetector flags an active region', () => {
    const sr = 8000;
    const samples = new Float32Array(sr);
    for (let i = 0; i < sr; i++) {
      samples[i] = i < sr / 2 ? 0 : Math.sin((2 * Math.PI * 200 * i) / sr);
    }
    const out = voiceActivityDetector(samples, {
      frameSize: 256,
      hopSize: 128,
      sampleRate: sr,
      rmsThreshold: 0.001,
      zcrMax: 0.5,
    });
    expect(out.length).toBeGreaterThan(0);
    expect(out.slice(0, 10).every((v) => v === false)).toBe(true);
  });
});
it('rejects malformed silence and activity detector thresholds', () => {
  expect(() => detectSilence([NaN])).toThrow();
  expect(() => detectSilence([0], { minRun: 0.5 })).toThrow();
  for (const options of [
    { rmsThreshold: -1 },
    { rmsThreshold: NaN },
    { zcrMax: 2 },
    { zcrMax: NaN },
  ])
    expect(() =>
      voiceActivityDetector([], { frameSize: 4, hopSize: 2, sampleRate: 8000, ...options }),
    ).toThrow();
});
