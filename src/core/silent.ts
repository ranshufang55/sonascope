// Silent buffer helpers — produce zero-filled AudioBuffers with explicit
// shape. These are useful for tests, padding, and for callers that want
// to pre-allocate the destination of an upcoming transform.

import { AudioBuffer } from './buffer.js';

export function createSilentBuffer(
  sampleRate: number,
  numChannels: number,
  numSamples: number,
): AudioBuffer {
  return new AudioBuffer(sampleRate, numChannels, numSamples);
}

export function createSilentLike(template: AudioBuffer, numSamples?: number): AudioBuffer {
  return new AudioBuffer(
    template.sampleRate,
    template.numChannels,
    numSamples ?? template.numSamples,
  );
}
