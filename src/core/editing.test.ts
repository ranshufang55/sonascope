import { it, expect } from 'vitest';
import { AudioBuffer } from './buffer.js';
import * as edit from './editing.js';
it('slices all channels consistently without aliasing the original', () => {
  const source = new AudioBuffer(8000, 2, 3, [
    new Float32Array([1, 2, 3]),
    new Float32Array([-1, -2, -3]),
  ]);
  const result = edit.sliceAudio(source, 1, 3);
  expect(Array.from(result.getChannel(1))).toEqual([-2, -3]);
  result.getChannel(0)[0] = 99;
  expect(source.getChannel(0)[1]).toBe(2);
  expect(() => edit.sliceAudio(source, 2, 1)).toThrow();
});
