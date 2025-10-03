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
it('reassembles arbitrary adjacent slices including empty edges', () => {
  const source = new AudioBuffer(8000, 1, 5, [new Float32Array([1, 2, 3, 4, 5])]);
  for (let split = 0; split <= 5; split++)
    expect(
      edit
        .concatAudio([edit.sliceAudio(source, 0, split), edit.sliceAudio(source, split)])
        .getChannel(0),
    ).toEqual(source.getChannel(0));
  expect(() => edit.concatAudio([source, new AudioBuffer(16000, 1, 1)])).toThrow();
  expect(() => edit.concatAudio([source, new AudioBuffer(8000, 2, 1)])).toThrow();
});
