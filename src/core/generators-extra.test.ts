import { describe, it, expect } from 'vitest';
import {
  generateBrownNoise,
  generateImpulse,
  generateImpulseTrain,
  generateLinearChirp,
  generateLogChirp,
  generatePinkNoise,
} from './generators-extra.js';

describe('extra generators', () => {
  it('linear chirp sweeps from f0 to f1 with bounded amplitude', () => {
    const buf = generateLinearChirp(48000, 0.5, 200, 2000, { amplitude: 0.5 });
    expect(buf.numSamples).toBe(24000);
    const data = buf.getChannel(0);
    let maxAbs = 0;
    for (const v of data) maxAbs = Math.max(maxAbs, Math.abs(v));
    expect(maxAbs).toBeLessThanOrEqual(0.5 + 1e-6);
  });

  it('log chirp stays bounded', () => {
    const buf = generateLogChirp(48000, 0.5, 100, 5000);
    expect(buf.getChannel(0).every((v) => Math.abs(v) <= 1 + 1e-6)).toBe(true);
  });

  it('impulse has 1.0 at index 0 and zero elsewhere', () => {
    const buf = generateImpulse(48000, 0.01, 0.8);
    const data = buf.getChannel(0);
    expect(data[0]).toBeCloseTo(0.8, 6);
    for (let i = 1; i < data.length; i++) {
      expect(data[i]).toBe(0);
    }
  });

  it('impulse train places 1s at period boundaries', () => {
    const buf = generateImpulseTrain(48000, 48, 12);
    const data = buf.getChannel(0);
    expect(data[0]).toBe(1);
    expect(data[12]).toBe(1);
    expect(data[24]).toBe(1);
    expect(data[36]).toBe(1);
    expect(data[1]).toBe(0);
    expect(data[11]).toBe(0);
  });

  it('pink noise is bounded and approximately zero-mean', () => {
    const buf = generatePinkNoise(48000, 2, { amplitude: 1, seed: 5 });
    let sum = 0;
    expect(buf.getChannel(0).every((v) => Math.abs(v) < 1.5)).toBe(true);
    for (const v of buf.getChannel(0)) sum += v;
    expect(Math.abs(sum / buf.numSamples)).toBeLessThan(0.05);
  });

  it('brown noise stays within [-1, 1]', () => {
    const buf = generateBrownNoise(48000, 0.5, { seed: 9 });
    expect(buf.getChannel(0).every((v) => v >= -1 && v <= 1)).toBe(true);
  });

  it('rejects invalid chirp arguments', () => {
    expect(() => generateLinearChirp(0, 0.1, 100, 200)).toThrow();
    expect(() => generateLogChirp(48000, 0.1, 0, 200)).toThrow();
    expect(() => generateLogChirp(48000, 0.1, 100, 0)).toThrow();
  });
});
