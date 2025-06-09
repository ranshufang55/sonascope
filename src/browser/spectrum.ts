import { prepareCanvas, normalizeDb } from './canvas.js';
import { assertInteger, assertInRange } from '../core/validation.js';
export interface SpectrumOptions {
  width: number;
  height: number;
  pixelRatio?: number;
  floor?: number;
  ceiling?: number;
  color?: string;
  background?: string;
}
export function spectrumColumns(
  decibels: ArrayLike<number>,
  width: number,
  floor = -100,
  ceiling = 0,
): Float32Array {
  assertInteger(width, 'width');
  assertInRange(width, 1, 4096, 'width');
  normalizeDb(floor, floor, ceiling);
  const out = new Float32Array(width);
  for (let x = 0; x < width; x++) {
    const start = Math.floor((x / width) * decibels.length),
      end = Math.min(decibels.length, Math.ceil(((x + 1) / width) * decibels.length));
    for (let i = start; i < end; i++)
      out[x] = Math.max(out[x]!, normalizeDb(decibels[i]!, floor, ceiling));
  }
  return out;
}
export function drawSpectrum(
  canvas: HTMLCanvasElement,
  decibels: ArrayLike<number>,
  options: SpectrumOptions,
): void {
  const { context, width, height } = prepareCanvas(
    canvas,
    options.width,
    options.height,
    options.pixelRatio,
  );
  const columns = spectrumColumns(decibels, Math.ceil(width), options.floor, options.ceiling);
  context.fillStyle = options.background ?? '#080f1d';
  context.fillRect(0, 0, width, height);
  context.fillStyle = options.color ?? '#5fe8d5';
  for (let x = 0; x < columns.length; x++)
    context.fillRect(x, height * (1 - columns[x]!), 1, height * columns[x]!);
}
