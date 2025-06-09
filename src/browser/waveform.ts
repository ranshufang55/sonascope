import { buildPyramid, queryPyramid, type Pyramid } from '../core/pyramid.js';
import { assertFiniteSamples, assertInteger, assertInRange } from '../core/validation.js';
import { prepareCanvas } from './canvas.js';
import type { ViewRange } from './viewport.js';
export interface WaveformOptions {
  width: number;
  height: number;
  pixelRatio?: number;
  range?: ViewRange;
  color?: string;
  background?: string;
  pyramid?: Pyramid;
}
export interface WaveformColumn {
  min: number;
  max: number;
}
export function waveformColumns(
  samples: ArrayLike<number>,
  width: number,
  range: ViewRange = { start: 0, end: samples.length },
  pyramid?: Pyramid,
): WaveformColumn[] {
  assertInteger(width, 'width');
  assertInRange(width, 1, 4096, 'width');
  assertInRange(range.start, 0, samples.length, 'start');
  assertInRange(range.end, range.start, samples.length, 'end');
  const tree = pyramid ?? buildPyramid(samples);
  if (tree.numSamples !== samples.length) throw new RangeError('Pyramid length mismatch');
  return Array.from({ length: width }, (_, x) =>
    queryPyramid(
      tree,
      range.start + (x / width) * (range.end - range.start),
      range.start + ((x + 1) / width) * (range.end - range.start),
    ),
  );
}
export function drawWaveform(
  canvas: HTMLCanvasElement,
  samples: ArrayLike<number>,
  options: WaveformOptions,
): void {
  if (!options.pyramid) assertFiniteSamples(samples);
  const { context, width, height } = prepareCanvas(
    canvas,
    options.width,
    options.height,
    options.pixelRatio,
  );
  const columns = waveformColumns(samples, Math.ceil(width), options.range, options.pyramid);
  context.fillStyle = options.background ?? '#080f1d';
  context.fillRect(0, 0, width, height);
  context.strokeStyle = options.color ?? '#5fe8d5';
  context.lineWidth = 1;
  context.beginPath();
  for (let x = 0; x < columns.length; x++) {
    const column = columns[x]!;
    const y = (v: number) => ((1 - Math.max(-1, Math.min(1, v))) * height) / 2;
    context.moveTo(x + 0.5, y(column.max));
    context.lineTo(x + 0.5, Math.max(y(column.min), y(column.max) + 1));
  }
  context.stroke();
}
