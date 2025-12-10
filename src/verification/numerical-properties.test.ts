import { it, expect } from 'vitest';
import * as c from '../core/index.js';
const sizes = [1, 2, 4, 8, 16, 32, 64];
const signal = (length: number) =>
  Float32Array.from({ length }, (_, i) => 0.3 * Math.sin(i * 0.71) + 0.2 * Math.cos(i * 0.23));
function near(actual: ArrayLike<number>, expected: ArrayLike<number>, tolerance = 1e-5): void {
  expect(actual.length).toBe(expected.length);
  let error = 0;
  for (let i = 0; i < actual.length; i++)
    error = Math.max(error, Math.abs(actual[i]! - expected[i]!));
  expect(error).toBeLessThanOrEqual(tolerance);
}

it('compare FFT bins with an independent direct Fourier sum', () => {
  for (const n of sizes) {
    const samples = signal(n),
      actual = c.fft(samples);
    const re: number[] = [],
      im: number[] = [];
    for (let k = 0; k < n; k++) {
      let real = 0,
        imaginary = 0;
      for (let t = 0; t < n; t++) {
        real += samples[t]! * Math.cos((2 * Math.PI * k * t) / n);
        imaginary -= samples[t]! * Math.sin((2 * Math.PI * k * t) / n);
      }
      re.push(real);
      im.push(imaginary);
    }
    near(actual.re, re);
    near(actual.im, im);
  }
});
