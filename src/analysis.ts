import type { AudioBuffer } from './core/buffer.js';
import { downmixToMono } from './core/downmix.js';
import { fft, MAX_FFT_SIZE } from './core/fft.js';
import { isPow2 } from './core/pow2.js';
import { halfSpectrum, magnitude, toDb } from './core/spectrum.js';
import { makeWindow, windowSum, type WindowType } from './core/window.js';
import { rms, peak } from './core/features-time.js';
import { spectralCentroid, spectralRolloff, spectralFlatness } from './core/features-spectral.js';
import { assertFiniteSamples, assertInteger, assertInRange } from './core/validation.js';
import { assertSampleRate } from './core/sample-rate.js';

export interface AnalysisOptions {
  fftSize?: number;
  hopSize?: number;
  window?: WindowType;
  channel?: number | 'mix';
  maxFrames?: number;
}
export interface AnalysisFrame {
  index: number;
  startSample: number;
  sampleCount: number;
  timeSeconds: number;
  rms: number;
  peak: number;
  centroid: number;
  rolloff: number;
  flatness: number;
  magnitude: Float32Array;
  decibels: Float32Array;
}
export interface AudioAnalysis {
  schemaVersion: 1;
  sampleRate: number;
  channels: number;
  numSamples: number;
  duration: number;
  fftSize: number;
  hopSize: number;
  window: WindowType;
  frequencies: Float32Array;
  frames: AnalysisFrame[];
}

/** Analyze real audio with coherent-gain amplitude scaling and a padded final frame. */
export function analyzeAudio(audio: AudioBuffer, options: AnalysisOptions = {}): AudioAnalysis {
  const fftSize = options.fftSize ?? 1024;
  const hopSize = options.hopSize ?? Math.max(1, fftSize / 4);
  const window = options.window ?? 'hann';
  const maxFrames = options.maxFrames ?? 4096;
  assertSampleRate(audio.sampleRate);
  if (!isPow2(fftSize) || fftSize > MAX_FFT_SIZE) throw new RangeError('Unsupported FFT size');
  assertInteger(hopSize, 'hopSize');
  assertInRange(hopSize, 1, 2 ** 24, 'hopSize');
  assertInteger(maxFrames, 'maxFrames');
  assertInRange(maxFrames, 1, 4096, 'maxFrames');
  const selected = options.channel ?? 'mix';
  if (selected !== 'mix') {
    assertInteger(selected, 'channel');
    assertInRange(selected, 0, audio.numChannels - 1, 'channel');
  }
  const samples =
    selected === 'mix' ? downmixToMono(audio).getChannel(0) : audio.getChannel(selected);
  assertFiniteSamples(samples);
  const frameCount =
    samples.length === 0
      ? 0
      : Math.min(
          Math.ceil(samples.length / hopSize),
          Math.max(1, Math.ceil(Math.max(0, samples.length - fftSize) / hopSize) + 1),
        );
  const bins = Math.floor(fftSize / 2) + 1;
  if (frameCount > maxFrames || frameCount * bins > 2 ** 22)
    throw new RangeError('Analysis is too large; increase hopSize or use a shorter selection');
  const weights = makeWindow(window, fftSize);
  const gain = windowSum(weights);
  if (gain <= 0) throw new RangeError('Window has zero coherent gain at this FFT size');
  const frames: AnalysisFrame[] = [];
  for (let index = 0; index < frameCount; index++) {
    const startSample = index * hopSize;
    const raw = samples.subarray(startSample, Math.min(startSample + fftSize, samples.length));
    const block = new Float32Array(fftSize);
    for (let i = 0; i < raw.length; i++) block[i] = raw[i]! * weights[i]!;
    const magnitudes = halfSpectrum(magnitude(fft(block)));
    for (let i = 0; i < magnitudes.length; i++)
      magnitudes[i] =
        (magnitudes[i]! * (i === 0 || (fftSize % 2 === 0 && i === fftSize / 2) ? 1 : 2)) / gain;
    frames.push({
      index,
      startSample,
      sampleCount: raw.length,
      timeSeconds: startSample / audio.sampleRate,
      rms: rms(raw),
      peak: peak(raw),
      centroid: spectralCentroid(magnitudes, fftSize, audio.sampleRate),
      rolloff: spectralRolloff(magnitudes, fftSize, audio.sampleRate),
      flatness: spectralFlatness(magnitudes),
      magnitude: magnitudes,
      decibels: toDb(magnitudes),
    });
  }
  return {
    schemaVersion: 1,
    sampleRate: audio.sampleRate,
    channels: audio.numChannels,
    numSamples: audio.numSamples,
    duration: audio.getDuration(),
    fftSize,
    hopSize,
    window,
    frequencies: Float32Array.from({ length: bins }, (_, i) => (i * audio.sampleRate) / fftSize),
    frames,
  };
}
