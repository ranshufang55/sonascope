import { it, expect } from 'vitest';
import * as pcm from './pcm.js';

it('decodes signed endpoints for PCM 8', () => {
  const view = new DataView(Uint8Array.from([0, 128, 255]).buffer);
  expect(pcm.readPcm8(view, 0)).toBe(-1);
  expect(pcm.readPcm8(view, 1)).toBe(0);
  expect(pcm.readPcm8(view, 2)).toBe(1 - 1 / 128);
  expect(() => pcm.readPcm8(view, view.byteLength)).toThrow();
});
it('encodes PCM 8 with clipping and bounded quantization error', () => {
  const view = new DataView(new ArrayBuffer(1));
  for (const sample of [-2, -1, -0.5, 0, 0.125, 0.5, 1, 2]) {
    pcm.writePcm8(view, 0, sample);
    const expected = Math.max(-1, Math.min(1 - 1 / 128, sample));
    expect(Math.abs(pcm.readPcm8(view, 0) - expected)).toBeLessThanOrEqual(1 / 128);
  }
  expect(() => pcm.writePcm8(view, 0, NaN)).toThrow();
});
it('decodes signed endpoints for PCM 16', () => {
  const view = new DataView(Uint8Array.from([0, 128, 0, 0, 255, 127]).buffer);
  expect(pcm.readPcm16(view, 0)).toBe(-1);
  expect(pcm.readPcm16(view, 2)).toBe(0);
  expect(pcm.readPcm16(view, 4)).toBe(1 - 1 / 32768);
  expect(() => pcm.readPcm16(view, view.byteLength)).toThrow();
});
