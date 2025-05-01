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
