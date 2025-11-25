// Silence detection and a simple energy + ZCR voice activity detector.

import {
  assertNonNegative,
  assertPositive,
  assertInteger,
  assertFiniteSamples,
  assertInRange,
} from './validation.js';
import { rms, zeroCrossingRate } from './features-time.js';
import { frameSignal } from './frame.js';

export interface SilenceRun {
  start: number;
  end: number;
}

export function detectSilence(
  samples: ArrayLike<number>,
  options: { threshold?: number; minRun?: number } = {},
): SilenceRun[] {
  assertFiniteSamples(samples);
  const threshold = options.threshold ?? 1e-4;
  const minRun = options.minRun ?? 1;
  assertNonNegative(threshold, 'threshold');
  assertInteger(minRun, 'minRun');
  assertPositive(minRun, 'minRun');
  const runs: SilenceRun[] = [];
  let runStart = -1;
  for (let i = 0; i < samples.length; i++) {
    const v = Math.abs(samples[i] ?? 0);
    const silent = v < threshold;
    if (silent && runStart < 0) runStart = i;
    if ((!silent || i === samples.length - 1) && runStart >= 0) {
      const end = silent ? i + 1 : i;
      if (end - runStart >= minRun) runs.push({ start: runStart, end });
      runStart = -1;
    }
  }
  return runs;
}

export function voiceActivityDetector(
  samples: ArrayLike<number>,
  options: {
    frameSize: number;
    hopSize: number;
    sampleRate: number;
    rmsThreshold?: number;
    zcrMax?: number;
  },
): boolean[] {
  assertPositive(options.frameSize, 'frameSize');
  assertPositive(options.hopSize, 'hopSize');
  assertPositive(options.sampleRate, 'sampleRate');
  const rmsThreshold = options.rmsThreshold ?? 1e-3;
  const zcrMax = options.zcrMax ?? 0.5;
  assertNonNegative(rmsThreshold, 'rmsThreshold');
  assertInRange(zcrMax, 0, 1, 'zcrMax');
  const frames = frameSignal(samples, options.frameSize, {
    hopSize: options.hopSize,
    window: 'hann',
  });
  return frames.map((f) => {
    const r = rms(f);
    if (r < rmsThreshold) return false;
    const z = zeroCrossingRate(f, options.sampleRate) / options.sampleRate;
    return z < zcrMax;
  });
}
