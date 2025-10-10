import { isPow2 } from '../core/pow2.js';
import type { AudioAnalysis } from '../analysis.js';
import {
  assertFinite,
  assertFiniteSamples,
  assertInteger,
  assertInRange,
} from '../core/validation.js';

export function serializeAnalysis(analysis: AudioAnalysis): string {
  validateAnalysis(analysis);
  for (const frame of analysis.frames) {
    for (const key of [
      'index',
      'startSample',
      'sampleCount',
      'timeSeconds',
      'rms',
      'peak',
      'centroid',
      'rolloff',
      'flatness',
    ] as const)
      assertFinite(frame[key], key);
    assertFiniteSamples(frame.magnitude);
    assertFiniteSamples(frame.decibels);
  }
  assertFiniteSamples(analysis.frequencies);
  return (
    JSON.stringify(
      {
        schemaVersion: 1,
        sampleRate: analysis.sampleRate,
        channels: analysis.channels,
        numSamples: analysis.numSamples,
        duration: analysis.duration,
        fftSize: analysis.fftSize,
        hopSize: analysis.hopSize,
        window: analysis.window,
        frequencies: Array.from(analysis.frequencies),
        frames: analysis.frames.map((frame) => ({
          index: frame.index,
          startSample: frame.startSample,
          sampleCount: frame.sampleCount,
          timeSeconds: frame.timeSeconds,
          rms: frame.rms,
          peak: frame.peak,
          centroid: frame.centroid,
          rolloff: frame.rolloff,
          flatness: frame.flatness,
          magnitude: Array.from(frame.magnitude),
          decibels: Array.from(frame.decibels),
        })),
      },
      null,
      2,
    ) + '\n'
  );
}

export function analysisToCsv(analysis: AudioAnalysis): string {
  const headers = [
    'index',
    'startSample',
    'sampleCount',
    'timeSeconds',
    'rms',
    'peak',
    'centroid',
    'rolloff',
    'flatness',
  ] as const;
  const rows = analysis.frames.map((frame) =>
    headers
      .map((key) => {
        assertFinite(frame[key], key);
        return String(frame[key]);
      })
      .join(','),
  );
  return [headers.join(','), ...rows].join('\n') + '\n';
}

export function validateAnalysis(analysis: AudioAnalysis): void {
  if (analysis.schemaVersion !== 1) throw new RangeError('Unsupported analysis schema');
  assertInRange(analysis.sampleRate, 1, 192000, 'sampleRate');
  assertInteger(analysis.sampleRate, 'sampleRate');
  assertInteger(analysis.channels, 'channels');
  assertInRange(analysis.channels, 1, 32, 'channels');
  assertInteger(analysis.numSamples, 'numSamples');
  assertInRange(analysis.numSamples, 0, 2 ** 24 / analysis.channels, 'numSamples');
  assertFinite(analysis.duration, 'duration');
  if (Math.abs(analysis.duration - analysis.numSamples / analysis.sampleRate) > 1e-9)
    throw new RangeError('Analysis duration mismatch');
  if (!isPow2(analysis.fftSize) || analysis.fftSize > 2 ** 20)
    throw new RangeError('Invalid analysis FFT size');
  assertInteger(analysis.hopSize, 'hopSize');
  assertInRange(analysis.hopSize, 1, 2 ** 24, 'hopSize');
  if (
    !['hann', 'hamming', 'blackman', 'rectangular', 'triangular', 'bartlett'].includes(
      analysis.window,
    )
  )
    throw new RangeError('Unknown analysis window');
  const bins = Math.floor(analysis.fftSize / 2) + 1;
  assertFiniteSamples(analysis.frequencies);
  if (analysis.frequencies.length !== bins)
    throw new RangeError('Analysis frequency shape mismatch');
  for (let i = 0; i < bins; i++)
    if (analysis.frequencies[i] !== Math.fround((i * analysis.sampleRate) / analysis.fftSize))
      throw new RangeError('Analysis frequency axis mismatch');
  if (analysis.frames.length > 4096 || analysis.frames.length * bins > 2 ** 22)
    throw new RangeError('Analysis frame budget exceeded');
  for (const [index, frame] of analysis.frames.entries()) {
    if (frame.index !== index || frame.startSample !== index * analysis.hopSize)
      throw new RangeError('Analysis frame sequence mismatch');
    assertInteger(frame.sampleCount, 'sampleCount');
    assertInRange(frame.sampleCount, 1, analysis.fftSize, 'sampleCount');
    if (frame.startSample + frame.sampleCount > analysis.numSamples)
      throw new RangeError('Frame extends beyond recording');
    assertFinite(frame.timeSeconds, 'timeSeconds');
    if (Math.abs(frame.timeSeconds - frame.startSample / analysis.sampleRate) > 1e-9)
      throw new RangeError('Frame time mismatch');
    for (const key of ['rms', 'peak'] as const) assertInRange(frame[key], 0, 3.4e38, key);
    for (const key of ['centroid', 'rolloff'] as const)
      assertInRange(frame[key], 0, analysis.sampleRate / 2, key);
    assertInRange(frame.flatness, 0, 1, 'flatness');
    for (const values of [frame.magnitude, frame.decibels]) {
      assertFiniteSamples(values);
      if (values.length !== bins) throw new RangeError('Frame spectrum shape mismatch');
    }
    for (const value of frame.magnitude) assertInRange(value, 0, 3.4e38, 'magnitude');
  }
}
