// Frequency band helpers: linear, log, and mel.

import {
  assertPositive,
  assertNonNegative,
  assertInteger,
  assertInRange,
  assertFiniteSamples,
} from './validation.js';

const F_SP = 200 / 3;
const MIN_LOG_HZ = 1000;
const MIN_LOG_MEL = 15;
// Slaney scale: https://librosa.org/doc/0.11.0/_modules/librosa/core/convert.html#hz_to_mel
const LOG_STEP = Math.log(6.4) / 27;

export function hzToMel(hz: number): number {
  assertNonNegative(hz, 'hz');
  if (hz < MIN_LOG_HZ) return hz / F_SP;
  return MIN_LOG_MEL + Math.log(hz / MIN_LOG_HZ) / LOG_STEP;
}

export function melToHz(mel: number): number {
  assertInRange(mel, 0, 10000, 'mel');
  if (mel < MIN_LOG_MEL) return F_SP * mel;
  return MIN_LOG_HZ * Math.exp((mel - MIN_LOG_MEL) * LOG_STEP);
}

export function linearBands(numBands: number, minHz: number, maxHz: number): Float32Array {
  assertInteger(numBands, 'numBands');
  assertInRange(numBands, 1, 65536, 'numBands');
  assertNonNegative(minHz, 'minHz');
  assertInRange(maxHz, 0, 192000, 'maxHz');
  if (maxHz <= minHz) {
    throw new RangeError('linearBands: maxHz must be greater than minHz');
  }
  const out = new Float32Array(numBands + 1);
  const step = (maxHz - minHz) / numBands;
  for (let i = 0; i <= numBands; i++) out[i] = minHz + i * step;
  return out;
}

export function logBands(numBands: number, minHz: number, maxHz: number): Float32Array {
  assertInteger(numBands, 'numBands');
  assertInRange(numBands, 1, 65536, 'numBands');
  assertNonNegative(minHz, 'minHz');
  assertInRange(maxHz, 0, 192000, 'maxHz');
  if (maxHz <= minHz || minHz <= 0) {
    throw new RangeError('logBands: maxHz > minHz > 0 required');
  }
  const out = new Float32Array(numBands + 1);
  const logMin = Math.log(minHz);
  const logMax = Math.log(maxHz);
  const step = (logMax - logMin) / numBands;
  for (let i = 0; i <= numBands; i++) out[i] = Math.exp(logMin + i * step);
  return out;
}

export interface MelFilterbank {
  filters: Float32Array[];
  centerFrequencies: Float32Array;
  numFilters: number;
}

export function melFilterbank(
  numFilters: number,
  fftSize: number,
  sampleRate: number,
  minHz: number = 0,
  maxHz?: number,
): MelFilterbank {
  assertInteger(numFilters, 'numFilters');
  assertInRange(numFilters, 1, 512, 'numFilters');
  assertInteger(fftSize, 'fftSize');
  assertInRange(fftSize, 2, 65536, 'fftSize');
  assertInRange(sampleRate, 1, 192000, 'sampleRate');
  assertNonNegative(minHz, 'minHz');
  if ((maxHz ?? sampleRate / 2) <= minHz || (maxHz ?? sampleRate / 2) > sampleRate / 2)
    throw new RangeError('Mel frequencies must lie in the Nyquist interval');
  assertPositive(maxHz ?? sampleRate / 2, 'maxHz');
  if (numFilters * (Math.floor(fftSize / 2) + 1) > 2 ** 22)
    throw new RangeError('Filterbank exceeds cell limit');
  assertPositive(fftSize, 'fftSize');
  assertPositive(sampleRate, 'sampleRate');
  const nyq = maxHz ?? sampleRate / 2;
  const minMel = hzToMel(minHz);
  const maxMel = hzToMel(nyq);
  const melPoints = new Float32Array(numFilters + 2);
  for (let i = 0; i < melPoints.length; i++) {
    melPoints[i] = minMel + ((maxMel - minMel) * i) / (numFilters + 1);
  }
  const hzPoints = new Float32Array(melPoints.length);
  for (let i = 0; i < hzPoints.length; i++) hzPoints[i] = melToHz(melPoints[i] ?? 0);
  const filters: Float32Array[] = [],
    centers = new Float32Array(numFilters);
  for (let m = 0; m < numFilters; m++) {
    const left = hzPoints[m]!,
      center = hzPoints[m + 1]!,
      right = hzPoints[m + 2]!;
    centers[m] = center;
    const filter = Float32Array.from({ length: Math.floor(fftSize / 2) + 1 }, (_, bin) => {
      const hz = (bin * sampleRate) / fftSize;
      return Math.max(0, Math.min((hz - left) / (center - left), (right - hz) / (right - center)));
    });
    filters.push(filter);
  }
  return { filters, centerFrequencies: centers, numFilters };
}

export function applyMelFilterbank(
  power: ArrayLike<number>,
  filterbank: MelFilterbank,
): Float32Array {
  assertInteger(filterbank.numFilters, 'numFilters');
  assertInRange(filterbank.numFilters, 1, 512, 'numFilters');
  assertFiniteSamples(power);
  for (let i = 0; i < power.length; i++) assertNonNegative(power[i]!, 'power');
  if (
    filterbank.filters.length !== filterbank.numFilters ||
    filterbank.centerFrequencies.length !== filterbank.numFilters
  )
    throw new RangeError('Filterbank shape mismatch');
  for (const filter of filterbank.filters) {
    assertFiniteSamples(filter);
    if (filter.length !== power.length) throw new RangeError('Power spectrum length mismatch');
    for (const value of filter) assertInRange(value, 0, 1, 'weight');
  }
  const out = new Float32Array(filterbank.numFilters);
  for (let m = 0; m < filterbank.numFilters; m++) {
    const f = filterbank.filters[m];
    if (!f) continue;
    let sum = 0;
    const len = Math.min(f.length, power.length);
    for (let k = 0; k < len; k++) sum += (f[k] ?? 0) * (power[k] ?? 0);
    out[m] = sum;
  }
  return out;
}
