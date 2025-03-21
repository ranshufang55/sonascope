import { AudioBuffer } from '../core/buffer.js';
import { assertSampleRate, MAX_SAMPLES_PER_BUFFER } from '../core/sample-rate.js';
import { asDataView, type ByteSource } from './bytes.js';
import { scanRiff } from './riff.js';
import * as pcm from './pcm.js';

export type WavEncoding = 'pcm8' | 'pcm16' | 'pcm24' | 'pcm32' | 'float32' | 'float64';
export interface WavInfo {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  format: 'pcm' | 'float';
  frames: number;
  blockAlign: number;
  dataOffset: number;
  dataBytes: number;
}

export function parseWav(input: ByteSource): WavInfo {
  const view = asDataView(input);
  const chunks = scanRiff(input);
  const formats = chunks.filter((chunk) => chunk.id === 'fmt ');
  const payloads = chunks.filter((chunk) => chunk.id === 'data');
  if (formats.length !== 1 || payloads.length !== 1)
    throw new RangeError('Expected one fmt chunk and one data chunk');
  const format = formats[0]!;
  const data = payloads[0]!;
  if (format.length < 16) throw new RangeError('Truncated WAVE format');
  const offset = format.offset;
  const tag = view.getUint16(offset, true);
  const channels = view.getUint16(offset + 2, true);
  const sampleRate = view.getUint32(offset + 4, true);
  const byteRate = view.getUint32(offset + 8, true);
  const blockAlign = view.getUint16(offset + 12, true);
  const bitsPerSample = view.getUint16(offset + 14, true);
  assertSampleRate(sampleRate);
  if (channels < 1 || channels > 32) throw new RangeError('WAVE channel count must be in [1,32]');
  if (tag !== 1 && tag !== 3) throw new RangeError('Unsupported WAVE encoding');
  if (!(tag === 1 ? [8, 16, 24, 32] : [32, 64]).includes(bitsPerSample))
    throw new RangeError('Unsupported WAVE bit depth');
  if (blockAlign !== (channels * bitsPerSample) / 8 || byteRate !== sampleRate * blockAlign)
    throw new RangeError('Inconsistent WAVE alignment or byte rate');
  if (data.length % blockAlign !== 0) throw new RangeError('Truncated interleaved audio frame');
  const frames = data.length / blockAlign;
  if (frames * channels > MAX_SAMPLES_PER_BUFFER)
    throw new RangeError('WAVE sample count exceeds the memory limit');
  return {
    sampleRate,
    channels,
    bitsPerSample,
    format: tag === 1 ? 'pcm' : 'float',
    frames,
    blockAlign,
    dataOffset: data.offset,
    dataBytes: data.length,
  };
}

export function decodeWav(input: ByteSource): AudioBuffer {
  const info = parseWav(input);
  const view = asDataView(input);
  const output = new AudioBuffer(info.sampleRate, info.channels, info.frames);
  const read =
    info.format === 'float'
      ? info.bitsPerSample === 32
        ? pcm.readFloat32
        : pcm.readFloat64
      : (
          { 8: pcm.readPcm8, 16: pcm.readPcm16, 24: pcm.readPcm24, 32: pcm.readPcm32 } as Record<
            number,
            (view: DataView, offset: number) => number
          >
        )[info.bitsPerSample]!;
  for (let frame = 0; frame < info.frames; frame++) {
    for (let channel = 0; channel < info.channels; channel++) {
      output.getChannel(channel)[frame] = read(
        view,
        info.dataOffset + frame * info.blockAlign + (channel * info.bitsPerSample) / 8,
      );
    }
  }
  return output;
}
