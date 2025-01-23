import { describe, it, expect } from 'vitest';
import { binToFreq, freqAxis, freqToBin, nyquistFrequency, timeAxis } from './axis.js';

describe('axis', () => {
  it('freqAxis starts at 0 and ends just below the sample rate', () => {
    const a = freqAxis(8, 8000);
    expect(a[0]).toBe(0);
    expect(a[7]).toBeCloseTo(7000, 4);
  });

  it('binToFreq and freqToBin are inverses', () => {
    expect(binToFreq(0, 1024, 48000)).toBe(0);
    expect(freqToBin(0, 1024, 48000)).toBe(0);
    expect(binToFreq(freqToBin(1000, 1024, 48000), 1024, 48000)).toBeCloseTo(1000, 4);
  });

  it('timeAxis centres each frame on its midpoint', () => {
    const a = timeAxis(4, 1024, 512, 48000);
    expect(a[0]).toBeCloseTo(1024 / 2 / 48000, 6);
    expect(a[1]).toBeCloseTo((512 + 1024 / 2) / 48000, 6);
  });

  it('nyquistFrequency is half the sample rate', () => {
    expect(nyquistFrequency(48000)).toBe(24000);
  });
});
