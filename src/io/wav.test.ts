import { it, expect } from 'vitest';
import * as wav from './wav.js';
import { writeFourCC } from './bytes.js';

function fixture(bits = 16, channels = 1, frames = 4, floating = false): DataView {
  const bytes = (frames * channels * bits) / 8;
  const view = new DataView(new ArrayBuffer(44 + bytes + (bytes % 2)));
  writeFourCC(view, 0, 'RIFF');
  view.setUint32(4, view.byteLength - 8, true);
  writeFourCC(view, 8, 'WAVE');
  writeFourCC(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, floating ? 3 : 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, 8000, true);
  view.setUint32(28, (8000 * channels * bits) / 8, true);
  view.setUint16(32, (channels * bits) / 8, true);
  view.setUint16(34, bits, true);
  writeFourCC(view, 36, 'data');
  view.setUint32(40, bytes, true);
  return view;
}

it('pins the complete WAVE metadata schema', () => {
  expect(wav.parseWav(fixture())).toEqual({
    sampleRate: 8000,
    channels: 1,
    bitsPerSample: 16,
    format: 'pcm',
    frames: 4,
    blockAlign: 2,
    dataOffset: 44,
    dataBytes: 8,
  });
});
