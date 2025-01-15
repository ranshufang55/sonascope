import { describe, it, expect } from 'vitest';
import {
  generateGaussianNoise,
  generateSawtooth,
  generateSine,
  generateSquare,
  generateTriangle,
  generateWhiteNoise,
} from './generators.js';
import { rms } from './features-time.js';

describe('generators', () => {
  it('sine produces a bounded tone of the right frequency', () => {
    const sr = 48000;
    const dur = 0.1;
    const buf = generateSine(sr, dur, 1000, { amplitude: 0.5 });
    expect(buf.numSamples).toBe(4800);
    expect(buf.getChannel(0)[0]).toBeCloseTo(0, 6);
    let zeroCrossings = 0;
    const data = buf.getChannel(0);
    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1] ?? 0;
      const cur = data[i] ?? 0;
      if ((prev <= 0 && cur > 0) || (prev >= 0 && cur < 0)) zeroCrossings++;
    }
    // Expect ~2 zero crossings per period. 0.1s at 1kHz = 100 periods = 200 crossings.
    expect(zeroCrossings).toBeGreaterThanOrEqual(195);
    expect(zeroCrossings).toBeLessThanOrEqual(205);
    // RMS of a sine with amplitude A is A/sqrt(2)
    const r = rms(buf.getChannel(0));
    expect(r).toBeCloseTo(0.5 / Math.sqrt(2), 2);
  });

  it('square wave has expected peak amplitude', () => {
    const buf = generateSquare(48000, 0.01, 200, { amplitude: 0.25 });
    let saw = 0;
    for (const v of buf.getChannel(0)) {
      if (Math.abs(v - 0.25) < 1e-9) saw++;
    }
    expect(saw).toBeGreaterThan(0);
    let neg = 0;
    for (const v of buf.getChannel(0)) {
      if (Math.abs(v + 0.25) < 1e-9) neg++;
    }
    expect(neg).toBeGreaterThan(0);
  });

  it('square wave rejects duty outside (0,1)', () => {
    expect(() => generateSquare(48000, 0.01, 200, { duty: 0 })).toThrow();
    expect(() => generateSquare(48000, 0.01, 200, { duty: 1 })).toThrow();
    expect(() => generateSquare(48000, 0.01, 200, { duty: 0.5 })).not.toThrow();
  });

  it('sawtooth ramps across the full amplitude range', () => {
    // The discrete sawtooth reaches -A on each period boundary and
    // approaches but does not touch +A; assert both bounds.
    const buf = generateSawtooth(48000, 0.05, 1000);
    const data = buf.getChannel(0);
    let min = Infinity;
    let max = -Infinity;
    for (const v of data) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
    expect(min).toBeCloseTo(-1, 6);
    expect(max).toBeGreaterThan(0.95);
    expect(max).toBeLessThanOrEqual(1);
  });

  it('triangle wave is bounded', () => {
    const buf = generateTriangle(48000, 0.05, 100);
    const data = buf.getChannel(0);
    for (const v of data) {
      expect(v).toBeLessThanOrEqual(1 + 1e-6);
      expect(v).toBeGreaterThanOrEqual(-1 - 1e-6);
    }
  });

  it('white noise is bounded and zero-mean', () => {
    // Use enough samples that the empirical mean converges within a
    // 1% tolerance band.
    const buf = generateWhiteNoise(48000, 2, { amplitude: 1, seed: 7 });
    const data = buf.getChannel(0);
    let sum = 0;
    for (const v of data) {
      expect(v).toBeLessThanOrEqual(1);
      expect(v).toBeGreaterThanOrEqual(-1);
      sum += v;
    }
    expect(Math.abs(sum / data.length)).toBeLessThan(0.01);
  });

  it('noise is deterministic given a seed', () => {
    const a = generateWhiteNoise(48000, 0.05, { seed: 42 });
    const b = generateWhiteNoise(48000, 0.05, { seed: 42 });
    for (let i = 0; i < a.numSamples; i++) {
      expect(a.getChannel(0)[i]).toBe(b.getChannel(0)[i] ?? 0);
    }
  });

  it('gaussian noise stays mostly bounded by 3*amplitude', () => {
    const buf = generateGaussianNoise(48000, 0.5, { amplitude: 0.1, seed: 3 });
    for (const v of buf.getChannel(0)) {
      expect(Math.abs(v)).toBeLessThan(1);
    }
  });
});
