import { normalizeDb, prepareCanvas } from './canvas.js';
import { makePalette, type PaletteName } from './palette.js';
import { assertInteger, assertInRange } from '../core/validation.js';
export interface SpectrogramOptions {
  width: number;
  height: number;
  pixelRatio?: number;
  floor?: number;
  ceiling?: number;
  palette?: PaletteName;
  frequencyScale?: 'linear' | 'log';
}
/** Time increases rightwards; bin zero is the bottom row. */
export function spectrogramPixels(
  frames: readonly ArrayLike<number>[],
  width: number,
  height: number,
  options: Pick<SpectrogramOptions, 'floor' | 'ceiling' | 'palette' | 'frequencyScale'> = {},
): Uint8ClampedArray {
  assertInteger(width, 'width');
  assertInteger(height, 'height');
  assertInRange(width, 1, 4096, 'width');
  assertInRange(height, 1, 4096, 'height');
  if (width * height > 2 ** 22) throw new RangeError('Spectrogram exceeds pixel budget');
  const floor = options.floor ?? -100,
    ceiling = options.ceiling ?? 0;
  normalizeDb(floor, floor, ceiling);
  const colors = makePalette(options.palette),
    out = new Uint8ClampedArray(width * height * 4);
  const bins = frames[0]?.length ?? 0;
  assertInteger(frames.length, 'frames');
  assertInRange(frames.length, 0, 4096, 'frames');
  assertInteger(bins, 'bins');
  assertInRange(bins, 0, 65537, 'bins');
  if (frames.length * bins > 2 ** 22) throw new RangeError('Spectrogram data exceeds cell budget');
  const scale = options.frequencyScale ?? 'linear';
  if (!['linear', 'log'].includes(scale)) throw new RangeError('Unknown frequency scale');
  const binAt = (fraction: number) =>
    scale === 'linear' ? fraction * bins : Math.expm1(fraction * Math.log1p(bins));
  for (const frame of frames) {
    if (frame.length !== bins) throw new RangeError('All frames must have the same number of bins');
    for (let i = 0; i < bins; i++) normalizeDb(frame[i]!, floor, ceiling);
  }
  for (let x = 0; x < width; x++) {
    const first = Math.floor((x / width) * frames.length),
      last = Math.ceil(((x + 1) / width) * frames.length);
    for (let y = 0; y < height; y++) {
      const low = Math.max(0, Math.floor(binAt((height - 1 - y) / height))),
        high = Math.min(bins, Math.ceil(binAt((height - y) / height)));
      let level = 0;
      for (let t = first; t < last; t++)
        for (let b = low; b < high; b++)
          level = Math.max(level, normalizeDb(frames[t]![b]!, floor, ceiling));
      const color = Math.round(level * 255) * 4,
        offset = (y * width + x) * 4;
      out.set(colors.subarray(color, color + 4), offset);
    }
  }
  return out;
}
export function drawSpectrogram(
  canvas: HTMLCanvasElement,
  frames: readonly ArrayLike<number>[],
  options: SpectrogramOptions,
): void {
  const { context } = prepareCanvas(canvas, options.width, options.height, options.pixelRatio);
  const pixels = spectrogramPixels(frames, canvas.width, canvas.height, options);
  const data = context.createImageData(canvas.width, canvas.height);
  data.data.set(pixels);
  context.putImageData(data, 0, 0);
}
