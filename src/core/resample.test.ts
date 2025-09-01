import { describe, it, expect } from 'vitest';
import { AudioBuffer } from './buffer.js';
import { resample, resampleMono } from './resample.js';
import { generateSine } from './generators.js';

describe('resample', () => {
  it('linear resample preserves duration within rounding tolerance', () => {
    const buf = generateSine(48000, 0.1, 1000);
    const out = resample(buf, 24000, 'linear');
    expect(out.sampleRate).toBe(24000);
    expect(Math.abs(out.getDuration() - 0.1)).toBeLessThan(0.001);
  });

  it('same-rate resample returns the original buffer', () => {
    const buf = generateSine(48000, 0.01, 1000);
    const out = resample(buf, 48000);
    expect(out).toBe(buf);
  });

  it('nearest resample on a step signal reproduces the steps', () => {
    const data = new Float32Array(100);
    for (let i = 0; i < 100; i++) data[i] = Math.floor(i / 10);
    const buf = new AudioBuffer(100, 1, 100, [data]);
    const out = resample(buf, 50, 'nearest');
    expect(out.numSamples).toBe(50);
  });

  it('sinc resample on a low-frequency tone keeps the waveform intact', () => {
    const buf = generateSine(48000, 0.05, 200);
    const out = resample(buf, 44100, 'sinc', { sincHalfWidth: 12 });
    let max = 0;
    for (const v of out.getChannel(0)) max = Math.max(max, Math.abs(v));
    expect(max).toBeGreaterThan(0.9);
  });

  it('resample of an empty buffer is empty at the new rate', () => {
    const buf = new AudioBuffer(48000, 1, 0);
    const out = resample(buf, 24000);
    expect(out.numSamples).toBe(0);
    expect(out.sampleRate).toBe(24000);
  });

  it('resampleMono on stereo input is not allowed (mono only)', () => {
    const arr = new Float32Array([1, 2, 3, 4]);
    const out = resampleMono(arr, 4, 8, 'linear');
    expect(out.length).toBe(8);
  });

  it('resampleMono upscales and downsamples correctly', () => {
    const a = new Float32Array([0, 1, 0, 1, 0, 1, 0, 1]);
    const up = resampleMono(a, 8, 16, 'linear');
    const down = resampleMono(up, 16, 8, 'linear');
    expect(up.length).toBe(16);
    expect(down.length).toBe(8);
  });
});
it('enforces mode and kernel contracts even on empty and same-rate inputs', () => {
  for (const length of [0, 8]) {
    const audio = new AudioBuffer(8000, 1, length);
    expect(() => resample(audio, 8000, 'unknown' as never)).toThrow();
    expect(() => resample(audio, 16000, 'sinc', { sincHalfWidth: 0 })).toThrow();
    expect(() => resampleMono(audio.getChannel(0), 8000, 8000, 'unknown' as never)).toThrow();
  }
});
