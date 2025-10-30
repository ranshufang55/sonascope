import { it, expect } from 'vitest';
import { spectrogramPixels } from './spectrogram.js';
it('pins time direction, frequency direction and every output color channel', () => {
  expect(
    Array.from(
      spectrogramPixels(
        [
          [-100, 0],
          [0, -100],
        ],
        2,
        2,
        { palette: 'mono' },
      ),
    ),
  ).toEqual([255, 255, 255, 255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255, 255]);
  expect(
    Array.from(
      spectrogramPixels(
        [
          [-100, 0],
          [-100, -100],
        ],
        1,
        1,
        { palette: 'mono' },
      ),
    ),
  ).toEqual([255, 255, 255, 255]);
  expect(() => spectrogramPixels([[0], [0, 1]], 2, 2)).toThrow();
});
it('retains DC and upper bins under logarithmic frequency mapping', () => {
  const pixels = spectrogramPixels([[0, -100, -100, -100, -100, -100, -100, 0]], 1, 8, {
    palette: 'mono',
    frequencyScale: 'log',
  });
  expect(Array.from(pixels.slice(0, 4))).toEqual([255, 255, 255, 255]);
  expect(Array.from(pixels.slice(-4))).toEqual([255, 255, 255, 255]);
  expect(Array.from(pixels).some((v, i) => i % 4 === 0 && v === 0)).toBe(true);
  expect(() => spectrogramPixels([[0]], 1, 1, { frequencyScale: 'bad' as never })).toThrow();
});
it('rejects unbounded array-like spectrum lengths before iteration', () => {
  for (const length of [Infinity, NaN, 1.5, 65538])
    expect(() => spectrogramPixels([{ length } as ArrayLike<number>], 1, 1)).toThrow();
});
