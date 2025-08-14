// Frequency and time axes.

import { assertPositive, assertInteger, assertInRange } from './validation.js';

export function freqAxis(fftSize: number, sampleRate: number): Float32Array {
  assertInteger(fftSize, 'fftSize');
  assertInRange(fftSize, 1, 2 ** 20, 'fftSize');
  assertInRange(sampleRate, 1, 192000, 'sampleRate');
  const out = new Float32Array(fftSize);
  for (let i = 0; i < fftSize; i++) out[i] = (i * sampleRate) / fftSize;
  return out;
}

export function binToFreq(bin: number, fftSize: number, sampleRate: number): number {
  assertInteger(fftSize, 'fftSize');
  assertInRange(fftSize, 1, 2 ** 20, 'fftSize');
  assertInRange(sampleRate, 1, 192000, 'sampleRate');
  assertInRange(bin, 0, fftSize, 'bin');
  return (bin * sampleRate) / fftSize;
}

export function freqToBin(freq: number, fftSize: number, sampleRate: number): number {
  assertInteger(fftSize, 'fftSize');
  assertInRange(fftSize, 1, 2 ** 20, 'fftSize');
  assertInRange(sampleRate, 1, 192000, 'sampleRate');
  assertInRange(freq, 0, sampleRate, 'freq');
  return (freq * fftSize) / sampleRate;
}

export function timeAxis(
  numFrames: number,
  frameSize: number,
  hopSize: number,
  sampleRate: number,
): Float32Array {
  assertInteger(numFrames, 'numFrames');
  assertInRange(numFrames, 0, 2 ** 20, 'numFrames');
  assertInteger(frameSize, 'frameSize');
  assertInteger(hopSize, 'hopSize');
  assertPositive(frameSize, 'frameSize');
  assertPositive(hopSize, 'hopSize');
  assertInRange(sampleRate, 1, 192000, 'sampleRate');
  const out = new Float32Array(numFrames);
  for (let i = 0; i < numFrames; i++) {
    out[i] = (i * hopSize + frameSize / 2) / sampleRate;
  }
  return out;
}

export function nyquistFrequency(sampleRate: number): number {
  assertInRange(sampleRate, 1, 192000, 'sampleRate');
  return sampleRate / 2;
}
