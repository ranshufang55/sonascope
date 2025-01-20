import { describe, it, expect } from 'vitest';
import { AudioBuffer } from './buffer.js';
import { joinChannels, splitChannels } from './channels.js';

describe('channels', () => {
  it('splitChannels returns N mono buffers', () => {
    const a = new Float32Array([1, 2, 3]);
    const b = new Float32Array([4, 5, 6]);
    const stereo = new AudioBuffer(48000, 2, 3, [a, b]);
    const out = splitChannels(stereo);
    expect(out).toHaveLength(2);
    expect(out[0]?.numChannels).toBe(1);
    expect(Array.from(out[0]?.getChannel(0) ?? new Float32Array(0))).toEqual([1, 2, 3]);
    expect(Array.from(out[1]?.getChannel(0) ?? new Float32Array(0))).toEqual([4, 5, 6]);
  });

  it('joinChannels combines mono buffers', () => {
    const a = new AudioBuffer(44100, 1, 3, [new Float32Array([1, 2, 3])]);
    const b = new AudioBuffer(44100, 1, 3, [new Float32Array([4, 5, 6])]);
    const out = joinChannels([a, b]);
    expect(out.numChannels).toBe(2);
    expect(Array.from(out.getChannel(0))).toEqual([1, 2, 3]);
    expect(Array.from(out.getChannel(1))).toEqual([4, 5, 6]);
  });

  it('round trips split then join', () => {
    const a = new Float32Array([1, 2, 3]);
    const b = new Float32Array([4, 5, 6]);
    const c = new Float32Array([7, 8, 9]);
    const orig = new AudioBuffer(48000, 3, 3, [a, b, c]);
    const restored = joinChannels(splitChannels(orig));
    for (let ch = 0; ch < 3; ch++) {
      for (let i = 0; i < 3; i++) {
        const ref = [a, b, c][ch] ?? new Float32Array(0);
        expect(restored.getChannel(ch)[i]).toBe(ref[i]);
      }
    }
  });

  it('joinChannels rejects mismatched sample rates', () => {
    const a = new AudioBuffer(48000, 1, 3);
    const b = new AudioBuffer(44100, 1, 3);
    expect(() => joinChannels([a, b])).toThrow(/sample rate/);
  });

  it('joinChannels rejects mismatched lengths', () => {
    const a = new AudioBuffer(48000, 1, 3);
    const b = new AudioBuffer(48000, 1, 4);
    expect(() => joinChannels([a, b])).toThrow(/numSamples/);
  });

  it('joinChannels rejects empty input', () => {
    expect(() => joinChannels([])).toThrow();
  });

  it('split mutating output does not affect input', () => {
    const stereo = new AudioBuffer(48000, 2, 3, [
      new Float32Array([1, 2, 3]),
      new Float32Array([4, 5, 6]),
    ]);
    const out = splitChannels(stereo);
    out[0]?.getChannel(0).fill(99);
    expect(stereo.getChannel(0)[0]).toBe(1);
  });
});
