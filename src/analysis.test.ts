import { it, expect } from 'vitest';
import { analyzeAudio } from './analysis.js';
import { AudioBuffer } from './core/buffer.js';
import { generateSine } from './core/generators.js';
it('calibrates a bin-centered sine to its amplitude and frequency', () => {
  const result = analyzeAudio(generateSine(8000, 0.032, 1000), {
    fftSize: 64,
    hopSize: 64,
    window: 'rectangular',
  });
  expect(result.frames).toHaveLength(4);
  expect(result.frequencies).toHaveLength(33);
  expect(result.frames[0]?.magnitude[8]).toBeCloseTo(1, 5);
  expect(result.frames[0]?.decibels[8]).toBeCloseTo(0, 4);
  expect(result.frames[0]?.centroid).toBeCloseTo(1000, 2);
});
it('includes a padded final frame and handles empty audio', () => {
  const audio = new AudioBuffer(8000, 1, 70, [new Float32Array(70).fill(1)]);
  const result = analyzeAudio(audio, { fftSize: 64, hopSize: 64, window: 'rectangular' });
  expect(result.frames.map((frame) => frame.sampleCount)).toEqual([64, 6]);
  expect(result.frames[1]?.rms).toBe(1);
  expect(analyzeAudio(new AudioBuffer(8000, 1, 0)).frames).toEqual([]);
});
it('never invents a frame beyond the audio when the hop leaves gaps', () => {
  expect(
    analyzeAudio(new AudioBuffer(8, 1, 6), { fftSize: 4, hopSize: 8, window: 'rectangular' })
      .frames,
  ).toHaveLength(1);
  const result = analyzeAudio(new AudioBuffer(8, 1, 9), {
    fftSize: 4,
    hopSize: 8,
    window: 'rectangular',
  });
  expect(result.frames.map((frame) => frame.sampleCount)).toEqual([4, 1]);
});
