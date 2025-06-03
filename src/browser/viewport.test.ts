import { it, expect } from 'vitest';
import { Viewport } from './viewport.js';
it('bounds ranges without changing their requested width', () => {
  const view = new Viewport(100);
  expect(view.set(-10, 10)).toEqual({ start: 0, end: 20 });
  expect(view.set(90, 110)).toEqual({ start: 80, end: 100 });
  expect(view.set(-100, 300)).toEqual({ start: 0, end: 100 });
  expect(view.set(50, 50)).toEqual({ start: 50, end: 51 });
  expect(view.reset()).toEqual({ start: 0, end: 100 });
  expect(new Viewport(0).set(0, 0)).toEqual({ start: 0, end: 0 });
});
it('pans reversibly away from bounds and clamps at both edges', () => {
  const v = new Viewport(100);
  v.set(20, 40);
  expect(v.pan(10)).toEqual({ start: 30, end: 50 });
  expect(v.pan(-10)).toEqual({ start: 20, end: 40 });
  expect(v.pan(-100)).toEqual({ start: 0, end: 20 });
  expect(v.pan(1000)).toEqual({ start: 80, end: 100 });
  expect(() => v.pan(NaN)).toThrow();
});
it('keeps all zoom anchors stable and supports reverse zoom', () => {
  for (const anchor of [0, 0.25, 0.5, 0.75, 1]) {
    const v = new Viewport(100);
    const r = v.zoom(2, anchor);
    expect(r.start + 50 * anchor).toBeCloseTo(100 * anchor);
    expect(v.zoom(0.5, anchor)).toEqual({ start: 0, end: 100 });
  }
  for (const factor of [0, -1, Infinity, NaN])
    expect(() => new Viewport(100).zoom(factor)).toThrow();
});
