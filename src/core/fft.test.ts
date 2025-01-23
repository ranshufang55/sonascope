import { describe, it, expect } from 'vitest';
import { fft, fftInPlace, fftReal, ifft, ifftInPlace, ifftReal } from './fft.js';
import { generateSine } from './generators.js';

describe('fft', () => {
  it('fft then ifft recovers the input', () => {
    const samples = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const orig = new Float32Array(samples);
    const f = fft(samples);
    const inv = ifft(f);
    for (let i = 0; i < samples.length; i++) {
      expect(inv.re[i] ?? 0).toBeCloseTo(orig[i] ?? 0, 4);
      expect(inv.im[i] ?? 0).toBeCloseTo(0, 4);
    }
  });

  it('fftInPlace rejects non-power-of-two', () => {
    const re = new Float32Array(6);
    const im = new Float32Array(6);
    expect(() => fftInPlace(re, im)).toThrow(/power of two/);
  });

  it('fft of a 1-cycle sine concentrates energy in bin 1', () => {
    const N = 64;
    const data = new Float32Array(N);
    for (let i = 0; i < N; i++) data[i] = Math.sin((2 * Math.PI * i) / N);
    const f = fft(data);
    let peak = 0;
    let peakIdx = 0;
    for (let i = 0; i < N; i++) {
      const m = Math.hypot(f.re[i] ?? 0, f.im[i] ?? 0);
      if (m > peak) {
        peak = m;
        peakIdx = i;
      }
    }
    expect(peakIdx).toBe(1);
  });

  it('fft of DC produces a single non-zero real bin at index 0', () => {
    const data = new Float32Array(16).fill(1);
    const f = fft(data);
    expect(f.re[0]).toBeCloseTo(16, 4);
    expect(f.im[0]).toBeCloseTo(0, 4);
    for (let i = 1; i < 16; i++) {
      expect(f.re[i] ?? 0).toBeCloseTo(0, 4);
      expect(f.im[i] ?? 0).toBeCloseTo(0, 4);
    }
  });

  it('ifftInPlace works in place', () => {
    const re = new Float32Array(4);
    const im = new Float32Array(4);
    re.set([1, 0, 0, 0]);
    ifftInPlace(re, im);
    for (let i = 0; i < 4; i++) {
      expect(re[i] ?? 0).toBeCloseTo(0.25, 4);
    }
  });

  it('fftReal and ifftReal compose', () => {
    const data = new Float32Array(8);
    for (let i = 0; i < 8; i++) data[i] = Math.cos((2 * Math.PI * 2 * i) / 8);
    const f = fftReal(data);
    const back = ifftReal(f);
    for (let i = 0; i < 8; i++) {
      expect(back[i] ?? 0).toBeCloseTo(data[i] ?? 0, 4);
    }
  });

  it('fft on a real audio sine concentrates energy at the right bin', () => {
    // sampleRate=64, duration=1.0, frequency=4 -> 64 samples, 4 cycles -> bin 4
    const buf = generateSine(64, 1, 4, { amplitude: 1 });
    const f = fftReal(buf.getChannel(0));
    let peak = 0;
    let peakIdx = 0;
    for (let i = 0; i < 64; i++) {
      const m = Math.hypot(f.re[i] ?? 0, f.im[i] ?? 0);
      if (m > peak) {
        peak = m;
        peakIdx = i;
      }
    }
    expect(peakIdx).toBe(4);
  });
});
