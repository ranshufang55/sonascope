import { assertFiniteSamples } from './validation.js';
// Downmix policies and helpers. The library collapses multi-channel
// audio to mono in a few well-defined ways. Picking a policy is the
// caller's responsibility — we never silently choose.

import { AudioBuffer } from './buffer.js';

export type DownmixPolicy = 'average' | 'left' | 'right' | 'mid' | 'side';

export function isDownmixPolicy(value: string): value is DownmixPolicy {
  return (
    value === 'average' ||
    value === 'left' ||
    value === 'right' ||
    value === 'mid' ||
    value === 'side'
  );
}

export function downmixToMono(buffer: AudioBuffer, policy: DownmixPolicy = 'average'): AudioBuffer {
  if (!isDownmixPolicy(policy)) throw new RangeError('Unknown downmix policy');
  if (['right', 'mid', 'side'].includes(policy) && buffer.numChannels < 2)
    throw new RangeError('Downmix policy requires at least two channels');
  for (const channel of buffer.data) assertFiniteSamples(channel);
  const n = buffer.numSamples;
  const out = new AudioBuffer(buffer.sampleRate, 1, n);
  const dst = out.getChannel(0);
  if (n === 0) return out;

  switch (policy) {
    case 'left': {
      const ch = buffer.getChannel(0);
      dst.set(ch);
      return out;
    }
    case 'right': {
      if (buffer.numChannels < 2) {
        throw new RangeError('downmixToMono: right policy requires >= 2 channels');
      }
      const ch = buffer.getChannel(1);
      dst.set(ch);
      return out;
    }
    case 'mid': {
      if (buffer.numChannels < 2) {
        throw new RangeError('downmixToMono: mid policy requires >= 2 channels');
      }
      const a = buffer.getChannel(0);
      const b = buffer.getChannel(1);
      for (let i = 0; i < n; i++) dst[i] = ((a[i] ?? 0) + (b[i] ?? 0)) * 0.5;
      return out;
    }
    case 'side': {
      if (buffer.numChannels < 2) {
        throw new RangeError('downmixToMono: side policy requires >= 2 channels');
      }
      const a = buffer.getChannel(0);
      const b = buffer.getChannel(1);
      for (let i = 0; i < n; i++) dst[i] = ((a[i] ?? 0) - (b[i] ?? 0)) * 0.5;
      return out;
    }
    case 'average':
    default: {
      for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let c = 0; c < buffer.numChannels; c++) sum += buffer.getChannel(c)[i] ?? 0;
        dst[i] = sum / buffer.numChannels;
      }
      return out;
    }
  }
}

export function toMono(buffer: AudioBuffer): AudioBuffer {
  for (const channel of buffer.data) assertFiniteSamples(channel);
  if (buffer.numChannels === 1) return buffer;
  return downmixToMono(buffer, 'average');
}
