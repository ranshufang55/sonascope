// Channel routing helpers.

import { AudioBuffer } from './buffer.js';

export function splitChannels(buffer: AudioBuffer): AudioBuffer[] {
  const out: AudioBuffer[] = new Array(buffer.numChannels);
  for (let c = 0; c < buffer.numChannels; c++) {
    const copy = new Float32Array(buffer.numSamples);
    copy.set(buffer.getChannel(c));
    out[c] = new AudioBuffer(buffer.sampleRate, 1, buffer.numSamples, [copy]);
  }
  return out;
}

export function joinChannels(buffers: AudioBuffer[]): AudioBuffer {
  if (buffers.length === 0) {
    throw new RangeError('joinChannels: at least one channel is required');
  }
  for (const buffer of buffers)
    if (buffer.numChannels !== 1) throw new RangeError('joinChannels requires mono inputs');
  const first = buffers[0];
  if (!first) throw new RangeError('joinChannels: missing first channel');
  const sampleRate = first.sampleRate;
  const numSamples = first.numSamples;
  for (let i = 1; i < buffers.length; i++) {
    const b = buffers[i];
    if (!b) throw new RangeError(`joinChannels: missing channel at index ${i}`);
    if (b.sampleRate !== sampleRate) {
      throw new RangeError(
        `joinChannels: sample rate mismatch at ${i}: ${b.sampleRate} vs ${sampleRate}`,
      );
    }
    if (b.numSamples !== numSamples) {
      throw new RangeError(
        `joinChannels: numSamples mismatch at ${i}: ${b.numSamples} vs ${numSamples}`,
      );
    }
  }
  const data: Float32Array[] = new Array(buffers.length);
  for (let i = 0; i < buffers.length; i++) {
    const b = buffers[i];
    if (!b) throw new RangeError(`joinChannels: missing channel at index ${i}`);
    data[i] = b.getChannel(0);
  }
  return new AudioBuffer(sampleRate, buffers.length, numSamples, data);
}
