import { assertFinite, assertInRange } from '../core/validation.js';
export interface CanvasSurface {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  pixelRatio: number;
}
export function prepareCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  pixelRatio = 1,
): CanvasSurface {
  assertInRange(width, 1, 4096, 'width');
  assertInRange(height, 1, 4096, 'height');
  assertInRange(pixelRatio, 0.5, 4, 'pixelRatio');
  const pixelsWide = Math.round(width * pixelRatio),
    pixelsHigh = Math.round(height * pixelRatio);
  if (pixelsWide * pixelsHigh > 2 ** 24) throw new RangeError('Canvas exceeds pixel budget');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable');
  if (canvas.width !== pixelsWide) canvas.width = pixelsWide;
  if (canvas.height !== pixelsHigh) canvas.height = pixelsHigh;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  return { context, width, height, pixelRatio };
}
export function normalizeDb(value: number, floor = -100, ceiling = 0): number {
  assertFinite(floor, 'floor');
  assertFinite(ceiling, 'ceiling');
  if (ceiling <= floor) throw new RangeError('Ceiling must exceed floor');
  if (value === -Infinity) return 0;
  assertFinite(value, 'decibels');
  return Math.max(0, Math.min(1, (value - floor) / (ceiling - floor)));
}
