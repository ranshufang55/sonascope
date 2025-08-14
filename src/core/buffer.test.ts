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

  it('defensively copies provided channel data', () => {
    const a = new Float32Array([1, 2, 3]);
    const b = new Float32Array([4, 5, 6]);
    const buf = new AudioBuffer(44100, 2, 3, [a, b]);
    a[0] = 99;
    b[0] = 99;
    expect(buf.getChannel(0)[0]).toBe(1);
    expect(buf.getChannel(1)[0]).toBe(4);
  });

  it('freezes the channel list so it cannot be mutated', () => {
    const buf = new AudioBuffer(44100, 2, 4);
    expect(Object.isFrozen(buf.data)).toBe(true);
    const channels = buf.data as Float32Array[];
    expect(() =>
      (channels as unknown as { push: (x: Float32Array) => void }).push(new Float32Array(4)),
    ).toThrow();
  });

  it('freezes a single provided channel as well', () => {
    const a = new Float32Array([1, 2, 3]);
    const b = new Float32Array([4, 5, 6]);
    const buf = new AudioBuffer(44100, 2, 3, [a, b]);
    expect(Object.isFrozen(buf.data)).toBe(true);
  });
});
it('rejects excessive aggregate allocations and nonfinite supplied channels', () => {
  expect(() => new AudioBuffer(8000, 33, 0)).toThrow();
  expect(() => new AudioBuffer(8000, 2, 2 ** 24)).toThrow();
  expect(() => new AudioBuffer(8000, 1, 2, [new Float32Array([0, NaN])])).toThrow();
  expect(() => new AudioBuffer(192001, 1, 0)).toThrow();
});
