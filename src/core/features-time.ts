// Time-domain scalar features: RMS, peak, crest factor, zero-crossing rate,
// and DC offset. All routines accept ArrayLike<number> so they can be
// called on slices, channel data, or external arrays.

import { assertFinite, assertPositive, assertFiniteSamples } from './validation.js';

export function rms(samples: ArrayLike<number>): number {
  assertFiniteSamples(samples);
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    const v = samples[i] ?? 0;
    sum += v * v;
  }
  return Math.sqrt(sum / samples.length);
}

export function peak(samples: ArrayLike<number>): number {
  assertFiniteSamples(samples);
  let p = 0;
  for (let i = 0; i < samples.length; i++) {
    const v = Math.abs(samples[i] ?? 0);
    if (v > p) p = v;
  }
  return p;
}

export function crestFactor(samples: ArrayLike<number>): number {
  const r = rms(samples);
  if (r === 0) return 0;
  return peak(samples) / r;
}

export function zeroCrossingRate(samples: ArrayLike<number>, sampleRate: number): number {
  assertFiniteSamples(samples);
  assertPositive(sampleRate, 'sampleRate');
  if (samples.length < 2) return 0;
  let zc = 0;
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1] ?? 0;
    const b = samples[i] ?? 0;
    if ((a <= 0 && b > 0) || (a >= 0 && b < 0)) zc++;
  }
  return (zc * sampleRate) / (samples.length - 1);
}

export function dcOffset(samples: ArrayLike<number>): number {
  assertFiniteSamples(samples);
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] ?? 0;
  return sum / samples.length;
}

export function energy(samples: ArrayLike<number>): number {
  assertFiniteSamples(samples);
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    const v = samples[i] ?? 0;
    sum += v * v;
  }
  return sum;
}

export function mean(samples: ArrayLike<number>): number {
  assertFiniteSamples(samples);
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] ?? 0;
  return sum / samples.length;
}

export function variance(samples: ArrayLike<number>): number {
  assertFiniteSamples(samples);
  if (samples.length === 0) return 0;
  const m = mean(samples);
  let s = 0;
  for (let i = 0; i < samples.length; i++) {
    const v = (samples[i] ?? 0) - m;
    s += v * v;
  }
  return s / samples.length;
}

export function assertKnownLength(samples: ArrayLike<number>, label: string = 'samples'): void {
  assertFiniteSamples(samples, label);
  if (samples.length === 0) {
    throw new RangeError(`${label} must not be empty`);
  }
  for (let i = 0; i < samples.length; i++) {
    assertFinite(samples[i] ?? NaN, `${label}[${i}]`);
  }
}
