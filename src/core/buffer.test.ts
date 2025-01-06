import { describe, it, expect } from 'vitest';
import { AudioBuffer } from './buffer.js';

describe('AudioBuffer', () => {
  it('constructs with sane defaults', () => {
    const buf = new AudioBuffer(48000, 2, 100);
    expect(buf.sampleRate).toBe(48000);
    expect(buf.numChannels).toBe(2);
    expect(buf.numSamples).toBe(100);
    expect(buf.length).toBe(100);
    expect(buf.data).toHaveLength(2);
    expect(buf.getChannel(0)).toBeInstanceOf(Float32Array);
    expect(buf.getChannel(0).length).toBe(100);
  });

  it('zero-fills channels when no data is provided', () => {
    const buf = new AudioBuffer(44100, 1, 16);
    for (let i = 0; i < 16; i++) {
      expect(buf.getChannel(0)[i]).toBe(0);
    }
  });

  it('rejects non-positive sample rate', () => {
    expect(() => new AudioBuffer(0, 1, 10)).toThrow(RangeError);
    expect(() => new AudioBuffer(-1, 1, 10)).toThrow(RangeError);
    expect(() => new AudioBuffer(NaN, 1, 10)).toThrow(RangeError);
  });

  it('rejects invalid channel counts', () => {
    expect(() => new AudioBuffer(44100, 0, 10)).toThrow(RangeError);
    expect(() => new AudioBuffer(44100, -1, 10)).toThrow(RangeError);
    expect(() => new AudioBuffer(44100, 1.5, 10)).toThrow(RangeError);
  });

  it('rejects negative sample counts', () => {
    expect(() => new AudioBuffer(44100, 1, -1)).toThrow(RangeError);
  });

  it('accepts zero-length buffers', () => {
    const buf = new AudioBuffer(44100, 2, 0);
    expect(buf.numSamples).toBe(0);
    expect(buf.getDuration()).toBe(0);
  });

  it('validates provided channel data shape', () => {
    expect(() => new AudioBuffer(44100, 2, 4, [new Float32Array(4)])).toThrow(RangeError);
    expect(() => new AudioBuffer(44100, 1, 4, [new Float32Array(3)])).toThrow(RangeError);
  });

  it('reports duration correctly', () => {
    const buf = new AudioBuffer(48000, 1, 48000);
    expect(buf.getDuration()).toBeCloseTo(1.0, 10);
  });

  it('throws on out-of-range channel access', () => {
    const buf = new AudioBuffer(44100, 1, 8);
    expect(() => buf.getChannel(1)).toThrow(RangeError);
    expect(() => buf.getChannel(-1)).toThrow(RangeError);
  });
});
