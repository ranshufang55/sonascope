// Frequency and time axes.

import { assertNonNegative, assertPositive } from './validation.js';

export function freqAxis(fftSize: number, sampleRate: number): Float32Array {
  assertPositive(fftSize, 'fftSize');
  assertPositive(sampleRate, 'sampleRate');
  const out = new Float32Array(fftSize);
  for (let i = 0; i < fftSize; i++) out[i] = (i * sampleRate) / fftSize;
  return out;
}

export function binToFreq(bin: number, fftSize: number, sampleRate: number): number {
  return (bin * sampleRate) / fftSize;
}

export function freqToBin(freq: number, fftSize: number, sampleRate: number): number {
  return (freq * fftSize) / sampleRate;
}

export function timeAxis(
  numFrames: number,
  frameSize: number,
  hopSize: number,
  sampleRate: number,
): Float32Array {
  assertNonNegative(numFrames, 'numFrames');
  assertPositive(frameSize, 'frameSize');
  assertPositive(hopSize, 'hopSize');
  assertPositive(sampleRate, 'sampleRate');
  const out = new Float32Array(numFrames);
  for (let i = 0; i < numFrames; i++) {
    out[i] = (i * hopSize + frameSize / 2) / sampleRate;
  }
  return out;
}

export function nyquistFrequency(sampleRate: number): number {
  return sampleRate / 2;
}
