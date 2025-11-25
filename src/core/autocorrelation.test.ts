import { describe, it, expect } from 'vitest';
import { autocorrelation, estimatePitch } from './autocorrelation.js';

describe('autocorrelation', () => {
  it('autocorrelation[0] is 1.0 for non-silent input', () => {
    const a = autocorrelation([1, 0.5, -0.3, 0.2, 0.1]);
    expect(a[0]).toBeCloseTo(1, 6);
  });

  it('autocorrelation of all zeros is zero', () => {
    const a = autocorrelation([0, 0, 0, 0]);
    for (const v of a) expect(v).toBe(0);
  });

  it('estimatePitch recovers the period of a sine', () => {
    const sr = 8000;
    const period = 32;
    const N = 256;
    const samples = new Float32Array(N);
    for (let i = 0; i < N; i++) samples[i] = Math.sin((2 * Math.PI * i) / period);
    const r = estimatePitch(samples, sr, { minLag: 8, maxLag: 128 });
    expect(Math.abs(r.period - period)).toBeLessThanOrEqual(1);
    expect(Math.abs(r.frequency - sr / period)).toBeLessThan(sr / 32);
  });

  it('estimatePitch returns confidence 0 on silent input', () => {
    const sr = 8000;
    const samples = new Float32Array(256);
    const r = estimatePitch(samples, sr);
    expect(r.confidence).toBe(0);
  });
});
it('handles empty pitch input and rejects excessive correlation work', () => {
  expect(estimatePitch([], 8000)).toEqual({ period: 0, frequency: 0, confidence: 0 });
  expect(() => autocorrelation(new Float32Array(8193))).toThrow();
  expect(() => estimatePitch([1, 2, 3, 4], 8000, { minLag: 1.5 })).toThrow();
});
