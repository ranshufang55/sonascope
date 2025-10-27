import { AudioBuffer } from '../core/buffer.js';
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

it('deinterleaves stereo PCM frames in channel order', () => {
  const view = fixture(16, 2, 2);
  [-32768, 16384, 8192, -16384].forEach((value, index) =>
    view.setInt16(44 + index * 2, value, true),
  );
  const result = wav.decodeWav(view);
  expect(Array.from(result.getChannel(0))).toEqual([-1, 0.25]);
  expect(Array.from(result.getChannel(1))).toEqual([0.5, -0.5]);
});

it('round-trips every encoding and preserves sliced byte inputs', () => {
  const audio = new AudioBuffer(8000, 2, 3, [
    new Float32Array([-0.5, 0, 0.5]),
    new Float32Array([0.25, -0.25, 0]),
  ]);
  for (const encoding of ['pcm8', 'pcm16', 'pcm24', 'pcm32', 'float32', 'float64'] as const) {
    const encoded = wav.encodeWav(audio, encoding);
    const wrapped = new Uint8Array(encoded.length + 8);
    wrapped.set(encoded, 4);
    const restored = wav.decodeWav(wrapped.subarray(4, 4 + encoded.length));
    expect(restored.sampleRate).toBe(8000);
    expect(restored.numChannels).toBe(2);
    for (let channel = 0; channel < 2; channel++)
      expect(restored.getChannel(channel)).toEqual(audio.getChannel(channel));
  }
});

it('reads standard WAVE_FORMAT_EXTENSIBLE PCM subformats', () => {
  const source = new Uint8Array(fixture().buffer);
  const bytes = new Uint8Array(source.length + 24);
  bytes.set(source.subarray(0, 36));
  bytes.set(source.subarray(36), 60);
  const view = new DataView(bytes.buffer);
  view.setUint32(4, bytes.length - 8, true);
  view.setUint32(16, 40, true);
  view.setUint16(20, 65534, true);
  view.setUint16(36, 22, true);
  view.setUint16(38, 16, true);
  bytes.set([1, 0, 0, 0, 0, 0, 16, 0, 128, 0, 0, 170, 0, 56, 155, 113], 44);
  expect(wav.parseWav(view).format).toBe('pcm');
  view.setUint8(59, 0);
  expect(() => wav.parseWav(view)).toThrow(/subformat/);
});
it('writes standard floating-point format extensions and fact sample counts', async () => {
  const { scanRiff } = await import('./riff.js');
  const input = new AudioBuffer(8000, 1, 3);
  for (const encoding of ['float32', 'float64'] as const) {
    const bytes = wav.encodeWav(input, encoding),
      chunks = scanRiff(bytes);
    expect(chunks.map((c) => [c.id, c.length])).toEqual([
      ['fmt ', 18],
      ['fact', 4],
      ['data', encoding === 'float32' ? 12 : 24],
    ]);
    expect(wav.parseWav(bytes).dataOffset).toBe(58);
    expect(wav.decodeWav(bytes).numSamples).toBe(3);
  }
});
it('validates fact counts without requiring them in legacy floating files', () => {
  const bytes = wav.encodeWav(new AudioBuffer(8000, 1, 3), 'float32');
  new DataView(bytes.buffer).setUint32(46, 99, true);
  expect(() => wav.parseWav(bytes)).toThrow('fact');
  expect(wav.parseWav(fixture(32, 1, 4, true)).frames).toBe(4);
});
