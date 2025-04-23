import { describe, it, expect } from 'vitest';
import { StreamingAnalyzer } from './streaming.js';
import { generateSine } from './generators.js';
import { frameSignal } from './frame.js';

describe('streaming analyzer', () => {
  it('produces one frame per hop', () => {
    const a = new StreamingAnalyzer({ sampleRate: 8000, frameSize: 256, hopSize: 128 });
    const samples = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) samples[i] = Math.sin((2 * Math.PI * 100 * i) / 8000);
    const frames = a.push(samples);
    expect(frames.length).toBeGreaterThan(0);
  });

  it('streaming RMS matches batched frame RMS within tolerance', () => {
    const sr = 8000;
    const samples = new Float32Array(2048);
    for (let i = 0; i < 2048; i++) samples[i] = Math.sin((2 * Math.PI * 200 * i) / sr);
    const a = new StreamingAnalyzer({ sampleRate: sr, frameSize: 256, hopSize: 256 });
    const streamed = a.push(samples);
    const batched = frameSignal(samples, 256, { hopSize: 256, window: null });
    for (let i = 0; i < Math.min(streamed.length, batched.length); i++) {
      const rms1 = streamed[i]?.rms ?? 0;
      let sum = 0;
      const f = batched[i];
      if (!f) continue;
      for (let k = 0; k < f.length; k++) sum += (f[k] ?? 0) * (f[k] ?? 0);
      const rms2 = Math.sqrt(sum / f.length);
      expect(rms1).toBeCloseTo(rms2, 4);
    }
  });

  it('reset clears the frame history', () => {
    const a = new StreamingAnalyzer({ sampleRate: 8000, frameSize: 64, hopSize: 32 });
    a.push(new Float32Array(128).fill(0.5));
    a.reset();
    expect(a.framesOut().length).toBe(0);
  });
});

it('rejects invalid streaming settings during construction', () => {
  for (const frameSize of [0, 3, 1.5, Infinity, 2 ** 21]) {
    expect(() => new StreamingAnalyzer({ sampleRate: 8000, frameSize, hopSize: 1 })).toThrow();
  }
  for (const hopSize of [0, -1, 1.5, NaN, Infinity]) {
    expect(() => new StreamingAnalyzer({ sampleRate: 8000, frameSize: 4, hopSize })).toThrow();
  }
  const analyzer = new StreamingAnalyzer({ sampleRate: 8, frameSize: 4, hopSize: 4 });
  expect(() => analyzer.push([1, 2, NaN])).toThrow();
  expect(analyzer.push([1, 1, 1, 1])[0]?.rms).toBe(1);
});

it('matches direct windows for every two-chunk partition and hop policy', () => {
  const signal = [1, 2, 3, 4, 0, -1, 0, 1, 2, 1, 0, -2, 1, 1, 1, 1];
  for (const hopSize of [1, 2, 4, 8]) {
    const expected: number[] = [];
    for (let start = 0; start + 4 <= signal.length; start += hopSize) {
      expected.push(
        Math.sqrt(signal.slice(start, start + 4).reduce((sum, x) => sum + x * x, 0) / 4),
      );
    }
    for (let split = 0; split <= signal.length; split++) {
      const analyzer = new StreamingAnalyzer({ sampleRate: 8, frameSize: 4, hopSize });
      const frames = [
        ...analyzer.push(signal.slice(0, split)),
        ...analyzer.push(signal.slice(split)),
      ];
      expect(frames.map((frame) => frame.rms)).toEqual(expected);
    }
  }
});

it('bounds history while returning every new frame to the caller', () => {
  const analyzer = new StreamingAnalyzer({
    sampleRate: 8,
    frameSize: 4,
    hopSize: 4,
    retainFrames: 2,
  });
  const result = analyzer.push([1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3]);
  expect(result).toHaveLength(3);
  expect(analyzer.framesOut().map((frame) => frame.rms)).toEqual([2, 3]);
  expect(Object.isFrozen(result[0])).toBe(true);
  expect(analyzer.framesOut()).not.toBe(analyzer.framesOut());
  analyzer.reset();
  expect(analyzer.framesOut()).toEqual([]);
  expect(analyzer.push([1, 1, 1, 1])[0]?.rms).toBe(1);
});

it('locates a real tone at its frequency instead of the mirrored-spectrum midpoint', () => {
  const analyzer = new StreamingAnalyzer({ sampleRate: 8000, frameSize: 64, hopSize: 64 });
  const signal = Float32Array.from({ length: 64 }, (_, i) =>
    Math.sin((2 * Math.PI * 1000 * i) / 8000),
  );
  expect(analyzer.push(signal)[0]?.centroid).toBeCloseTo(1000, 2);
});
