import { describe, it, expect } from 'vitest';
import { AudioBuffer } from './buffer.js';
import { downmixToMono, toMono } from './downmix.js';
import { generateSine } from './generators.js';

describe('downmix', () => {
  it('downmixes a stereo buffer to mono with AVERAGE policy', () => {
    const left = generateSine(48000, 0.01, 1000, { amplitude: 1 });
    const right = generateSine(48000, 0.01, 1000, { amplitude: 1, phase: Math.PI });
    const stereo = new AudioBuffer(48000, 2, left.numSamples, [
      left.getChannel(0),
      right.getChannel(0),
    ]);
    const mono = downmixToMono(stereo, 'average');
    expect(mono.numChannels).toBe(1);
    expect(mono.numSamples).toBe(stereo.numSamples);
    for (let i = 0; i < mono.numSamples; i++) {
      const l = left.getChannel(0)[i] ?? 0;
      const r = right.getChannel(0)[i] ?? 0;
      const expected = (l + r) / 2;
      const v = mono.getChannel(0)[i] ?? 0;
      expect(v).toBeCloseTo(expected, 6);
    }
  });

  it('LEFT and RIGHT policies pick individual channels', () => {
    const l = new Float32Array([1, 2, 3]);
    const r = new Float32Array([4, 5, 6]);
    const stereo = new AudioBuffer(48000, 2, 3, [l, r]);
    const left = downmixToMono(stereo, 'left');
    const right = downmixToMono(stereo, 'right');
    expect(Array.from(left.getChannel(0))).toEqual([1, 2, 3]);
    expect(Array.from(right.getChannel(0))).toEqual([4, 5, 6]);
  });

  it('MID and SIDE produce (L+R)/2 and (L-R)/2', () => {
    const l = new Float32Array([1, 2, 3]);
    const r = new Float32Array([3, 4, 5]);
    const stereo = new AudioBuffer(48000, 2, 3, [l, r]);
    const mid = downmixToMono(stereo, 'mid');
    const side = downmixToMono(stereo, 'side');
    expect(mid.getChannel(0)[0]).toBeCloseTo(2, 6);
    expect(mid.getChannel(0)[1]).toBeCloseTo(3, 6);
    expect(side.getChannel(0)[0]).toBeCloseTo(-1, 6);
    expect(side.getChannel(0)[1]).toBeCloseTo(-1, 6);
  });

  it('rejects RIGHT/MID/SIDE policies on mono buffers', () => {
    const mono = new AudioBuffer(48000, 1, 4);
    expect(() => downmixToMono(mono, 'right')).toThrow();
    expect(() => downmixToMono(mono, 'mid')).toThrow();
    expect(() => downmixToMono(mono, 'side')).toThrow();
  });

  it('toMono returns the original when already mono', () => {
    const mono = new AudioBuffer(48000, 1, 4);
    expect(toMono(mono)).toBe(mono);
  });

  it('handles empty buffers', () => {
    const stereo = new AudioBuffer(48000, 2, 0);
    const out = downmixToMono(stereo);
    expect(out.numSamples).toBe(0);
    expect(out.numChannels).toBe(1);
  });
});
it('enforces channel requirements and policy names independently of sample count', () => {
  for (const length of [0, 4]) {
    const audio = new AudioBuffer(8000, 1, length);
    expect(() => downmixToMono(audio, 'bad' as never)).toThrow();
    for (const policy of ['right', 'mid', 'side'] as const)
      expect(() => downmixToMono(audio, policy)).toThrow();
  }
  const audio = new AudioBuffer(8000, 1, 1);
  audio.getChannel(0)[0] = NaN;
  expect(() => downmixToMono(audio)).toThrow();
  expect(() => toMono(audio)).toThrow();
});
