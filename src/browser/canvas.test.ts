import { it, expect } from 'vitest';
import { prepareCanvas, normalizeDb } from './canvas.js';
it('scales backing pixels while retaining logical dimensions', () => {
  const transforms: number[][] = [];
  const context = { setTransform: (...values: number[]) => transforms.push(values) };
  const canvas = { width: 0, height: 0, getContext: () => context } as unknown as HTMLCanvasElement;
  expect(prepareCanvas(canvas, 300, 100, 2)).toMatchObject({
    width: 300,
    height: 100,
    pixelRatio: 2,
  });
  expect([canvas.width, canvas.height]).toEqual([600, 200]);
  expect(transforms).toEqual([[2, 0, 0, 2, 0, 0]]);
  expect(() => prepareCanvas(canvas, 4096, 4096, 4)).toThrow();
});
it('maps live analyser silence and finite levels into a closed unit interval', () => {
  expect([-Infinity, -120, -100, -50, 0, 20].map((v) => normalizeDb(v))).toEqual([
    0, 0, 0, 0.5, 1, 1,
  ]);
  for (const value of [Infinity, NaN]) expect(() => normalizeDb(value)).toThrow();
  expect(() => normalizeDb(0, 0, 0)).toThrow();
});
