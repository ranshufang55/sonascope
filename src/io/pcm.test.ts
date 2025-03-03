import { it, expect } from 'vitest';
import * as pcm from './pcm.js';

it('decodes signed endpoints for PCM 8', () => {
  const view = new DataView(Uint8Array.from([0, 128, 255]).buffer);
  expect(pcm.readPcm8(view, 0)).toBe(-1);
  expect(pcm.readPcm8(view, 1)).toBe(0);
  expect(pcm.readPcm8(view, 2)).toBe(1 - 1 / 128);
  expect(() => pcm.readPcm8(view, view.byteLength)).toThrow();
});
