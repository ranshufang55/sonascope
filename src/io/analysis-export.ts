import type { AudioAnalysis } from '../analysis.js';
import { assertFinite, assertFiniteSamples } from '../core/validation.js';

export function serializeAnalysis(analysis: AudioAnalysis): string {
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
