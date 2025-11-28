import { it, expect } from 'vitest';
import { loadAudioFile } from './file-loader.js';
import { encodeWav } from '../io/wav.js';
import { AudioBuffer } from '../core/buffer.js';
it('opens local WAV bytes and rejects empty or oversized recordings', async () => {
  const input = new AudioBuffer(8000, 1, 8, [new Float32Array(8).fill(0.5)]);
  const bytes = encodeWav(input);
  const file = new File([bytes], 'example.wav', { type: 'audio/wav' });
  expect((await loadAudioFile(file)).getChannel(0)).toEqual(input.getChannel(0));
  await expect(loadAudioFile({ size: 21 * 1024 * 1024 } as File)).rejects.toThrow('20 MB');
  const empty = encodeWav(new AudioBuffer(8000, 1, 0));
  await expect(
    loadAudioFile(new File([empty], 'empty.wav', { type: 'audio/wav' })),
  ).rejects.toThrow('empty');
});
it('rejects dishonest file size metadata before attempting audio decoding', async () => {
  await expect(
    loadAudioFile({ size: 1, arrayBuffer: async () => new ArrayBuffer(21 * 1024 * 1024) } as File),
  ).rejects.toThrow('20 MB');
  await expect(loadAudioFile({ size: NaN } as File)).rejects.toThrow('size');
});
