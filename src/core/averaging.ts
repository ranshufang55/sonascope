import { assertFiniteSamples, assertInteger, assertInRange } from './validation.js';
function validateSpectra(spectra: ArrayLike<ArrayLike<number>>): void {
  assertInteger(spectra.length, 'frames');
  assertInRange(spectra.length, 0, 65536, 'frames');
  const bins = spectra[0]?.length ?? 0;
  if (bins * spectra.length > 2 ** 24) throw new RangeError('Spectrum matrix exceeds cell limit');
  for (let i = 0; i < spectra.length; i++) {
    const row = spectra[i];
    if (!row || row.length !== bins) throw new RangeError('Spectrum matrix shape mismatch');
    assertFiniteSamples(row);
  }
}
// Spectrum averaging: mean, median, and max-hold reductions.

export function meanSpectrum(spectra: ArrayLike<ArrayLike<number>>): Float32Array {
  validateSpectra(spectra);
  if (spectra.length === 0) return new Float32Array(0);
  const first = spectra[0];
  if (!first) return new Float32Array(0);
  const bins = first.length;
  const out = new Float32Array(bins);
  for (let k = 0; k < bins; k++) {
    let sum = 0;
    for (let i = 0; i < spectra.length; i++) sum += spectra[i]![k]! / spectra.length;
    if (!Number.isFinite(Math.fround(sum))) throw new RangeError('Mean exceeds Float32');
    out[k] = sum;
  }
  return out;
}

export function maxHoldSpectrum(spectra: ArrayLike<ArrayLike<number>>): Float32Array {
  validateSpectra(spectra);
  if (spectra.length === 0) return new Float32Array(0);
  const first = spectra[0];
  if (!first) return new Float32Array(0);
  const bins = first.length;
  const out = new Float32Array(bins);
  for (let k = 0; k < bins; k++) out[k] = -Infinity;
  for (let i = 0; i < spectra.length; i++) {
    const s = spectra[i];
    if (!s) continue;
    for (let k = 0; k < bins; k++) {
      const v = s[k] ?? 0;
      const cur = out[k] ?? -Infinity;
      if (v > cur) out[k] = v;
    }
  }
  return out;
}

export function medianSpectrum(spectra: ArrayLike<ArrayLike<number>>): Float32Array {
  validateSpectra(spectra);
  if (spectra.length === 0) return new Float32Array(0);
  const first = spectra[0];
  if (!first) return new Float32Array(0);
  const bins = first.length;
  const out = new Float32Array(bins);
  const rows = new Float32Array(spectra.length);
  for (let k = 0; k < bins; k++) {
    for (let i = 0; i < spectra.length; i++) {
      rows[i] = spectra[i]?.[k] ?? 0;
    }
    const sorted = Array.from(rows).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    out[k] =
      sorted.length % 2 === 0
        ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
        : (sorted[mid] ?? 0);
  }
  return out;
}

export function spectrumDiff(a: ArrayLike<number>, b: ArrayLike<number>): Float32Array {
  const n = Math.max(a.length, b.length);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = Math.abs((a[i] ?? 0) - (b[i] ?? 0));
  }
  return out;
}

export function spectrumL2(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let s = 0;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    s += d * d;
  }
  return Math.sqrt(s);
}
