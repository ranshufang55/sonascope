// Frequency band helpers: linear, log, and mel.

import { assertPositive } from './validation.js';

const F_SP = 200 / 3;
const MIN_LOG_HZ = 1000;
const MIN_LOG_MEL = 15;
// Slaney scale: https://librosa.org/doc/0.11.0/_modules/librosa/core/convert.html#hz_to_mel
const LOG_STEP = Math.log(6.4) / 27;

export function hzToMel(hz: number): number {
  if (hz < MIN_LOG_HZ) return hz / F_SP;
  return MIN_LOG_MEL + Math.log(hz / MIN_LOG_HZ) / LOG_STEP;
}

export function melToHz(mel: number): number {
  if (mel < MIN_LOG_MEL) return F_SP * mel;
  return MIN_LOG_HZ * Math.exp((mel - MIN_LOG_MEL) * LOG_STEP);
}

export function linearBands(numBands: number, minHz: number, maxHz: number): Float32Array {
  assertPositive(numBands, 'numBands');
  if (maxHz <= minHz) {
    throw new RangeError('linearBands: maxHz must be greater than minHz');
  }
  const out = new Float32Array(numBands + 1);
  const step = (maxHz - minHz) / numBands;
  for (let i = 0; i <= numBands; i++) out[i] = minHz + i * step;
  return out;
}

export function logBands(numBands: number, minHz: number, maxHz: number): Float32Array {
  assertPositive(numBands, 'numBands');
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
  assertPositive(numFilters, 'numFilters');
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
  const binPoints = new Float32Array(hzPoints.length);
  const factor = (fftSize + 1) / sampleRate;
  for (let i = 0; i < binPoints.length; i++) {
    binPoints[i] = Math.floor((hzPoints[i] ?? 0) * factor);
  }
  const filters: Float32Array[] = new Array(numFilters);
  const centers = new Float32Array(numFilters);
  for (let m = 0; m < numFilters; m++) {
    const start = binPoints[m] ?? 0;
    const peak = binPoints[m + 1] ?? 0;
    const end = binPoints[m + 2] ?? 0;
    centers[m] = hzPoints[m + 1] ?? 0;
    const filter = new Float32Array(Math.floor(fftSize / 2) + 1);
    for (let k = start; k <= peak && k < filter.length; k++) {
      filter[k] = (k - start) / Math.max(1, peak - start);
    }
    for (let k = peak; k <= end && k < filter.length; k++) {
      filter[k] = (end - k) / Math.max(1, end - peak);
    }
    filters[m] = filter;
  }
  return { filters, centerFrequencies: centers, numFilters };
}

export function applyMelFilterbank(
  power: ArrayLike<number>,
  filterbank: MelFilterbank,
): Float32Array {
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
