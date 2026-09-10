// Framing, overlap-add, STFT, and ISTFT.

import { isPow2 } from './pow2.js';
import { fft, ifft, ifftInPlace, fftInPlace, type ComplexArray } from './fft.js';
import { applyWindow, makeWindow, type WindowType } from './window.js';
import { frameCount } from './sample-rate.js';
import { assertPositive, assertInteger, assertFiniteSamples, assertInRange } from './validation.js';
import { magnitude, powerSpectrum, halfSpectrum } from './spectrum.js';

export interface FrameOptions {
  hopSize: number;
  window?: WindowType | null;
}

export function frameSignal(
  samples: ArrayLike<number>,
  frameSize: number,
  options: FrameOptions,
): Float32Array[] {
  assertInteger(frameSize, 'frameSize');
  assertInRange(frameSize, 1, 2 ** 20, 'frameSize');
  assertInteger(options.hopSize, 'hopSize');
  assertInRange(options.hopSize, 1, 2 ** 24, 'hopSize');
  assertFiniteSamples(samples);
  const frames = frameCount(samples.length, frameSize, options.hopSize);
  if (frames * frameSize > 2 ** 24) throw new RangeError('Frame matrix exceeds sample budget');
  const out: Float32Array[] = new Array(frames);
  const win = options.window ? makeWindow(options.window, frameSize) : null;
  for (let f = 0; f < frames; f++) {
    const arr = new Float32Array(frameSize);
    for (let i = 0; i < frameSize; i++) arr[i] = samples[f * options.hopSize + i] ?? 0;
    if (win) applyWindow(arr, win);
    out[f] = arr;
  }
  return out;
}

export function overlapAdd(
  frames: ArrayLike<ArrayLike<number>>,
  frameSize: number,
  hopSize: number,
  totalLength?: number,
): Float32Array {
  assertInteger(frameSize, 'frameSize');
  assertInRange(frameSize, 1, 2 ** 20, 'frameSize');
  assertInteger(hopSize, 'hopSize');
  assertPositive(hopSize, 'hopSize');
  assertInteger(frames.length, 'frames');
  assertInRange(frames.length, 0, 2 ** 20, 'frames');
  if (totalLength !== undefined) {
    assertInteger(totalLength, 'totalLength');
    assertInRange(totalLength, 0, 2 ** 24, 'totalLength');
  }
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    if (!frame || frame.length !== frameSize) throw new RangeError('Frame shape mismatch');
    assertFiniteSamples(frame);
  }
  if (frames.length === 0) return new Float32Array(totalLength ?? 0);
  const length = totalLength ?? Math.max(0, (frames.length - 1) * hopSize + frameSize);
  assertInRange(length, 0, 2 ** 24, 'length');
  const out = new Float32Array(length);
  for (let f = 0; f < frames.length; f++) {
    const frame = frames[f];
    if (!frame) continue;
    const offset = f * hopSize;
    for (let i = 0; i < frameSize; i++) {
      const idx = offset + i;
      if (idx < length) out[idx] = (out[idx] ?? 0) + (frame[i] ?? 0);
    }
  }
  return out;
}

export function stft(
  samples: ArrayLike<number>,
  frameSize: number,
  hopSize: number,
  window: WindowType | null = 'hann',
): ComplexArray[] {
  if (!isPow2(frameSize) || frameSize > 2 ** 20) throw new RangeError('Invalid STFT size');
  const frames = frameSignal(samples, frameSize, { hopSize, window });
  return frames.map((f) => fft(f));
}

export function istft(
  spectra: ArrayLike<ComplexArray>,
  frameSize: number,
  hopSize: number,
  window: WindowType | null = 'hann',
  totalLength?: number,
): Float32Array {
  if (!isPow2(frameSize) || frameSize > 2 ** 20) throw new RangeError('Invalid ISTFT size');
  assertInteger(hopSize, 'hopSize');
  assertInRange(hopSize, 1, 2 ** 24, 'hopSize');
  assertInteger(spectra.length, 'spectra');
  if (spectra.length * frameSize > 2 ** 24)
    throw new RangeError('ISTFT matrix exceeds sample budget');
  for (let i = 0; i < spectra.length; i++) {
    const spectrum = spectra[i];
    if (!spectrum || spectrum.re.length !== frameSize || spectrum.im.length !== frameSize)
      throw new RangeError('ISTFT spectrum shape mismatch');
  }
  const win = window ? makeWindow(window, frameSize) : null;
  const frames: Float32Array[] = [];
  for (let i = 0; i < spectra.length; i++) {
    const s = spectra[i];
    if (!s) continue;
    const inv = ifft(s);
    const arr = new Float32Array(frameSize);
    for (let k = 0; k < frameSize; k++) arr[k] = inv.re[k] ?? 0;
    if (win) applyWindow(arr, win);
    frames.push(arr);
  }
  const output = overlapAdd(frames, frameSize, hopSize, totalLength);
  const weights = new Float64Array(output.length);
  for (let f = 0; f < frames.length; f++) {
    for (let i = 0; i < frameSize; i++) {
      const position = f * hopSize + i;
      if (position < weights.length)
        weights[position] = weights[position]! + (win ? win[i]! ** 2 : 1);
    }
  }
  for (let i = 0; i < output.length; i++) {
    if (weights[i]! > 1e-12) output[i] = output[i]! / weights[i]!;
    else output[i] = 0;
  }
  return output;
}

export function stftMagnitude(
  samples: ArrayLike<number>,
  frameSize: number,
  hopSize: number,
  window: WindowType | null = 'hann',
): Float32Array[] {
  return stft(samples, frameSize, hopSize, window).map((c) =>
    halfSpectrum(magnitude(c)),
  );
}

export function stftPower(
  samples: ArrayLike<number>,
  frameSize: number,
  hopSize: number,
  window: WindowType | null = 'hann',
): Float32Array[] {
  return stft(samples, frameSize, hopSize, window).map((c) =>
    halfSpectrum(powerSpectrum(c)),
  );
}

export { fftInPlace, ifftInPlace };
