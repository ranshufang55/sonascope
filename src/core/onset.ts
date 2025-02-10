// Onset detection via spectral flux. Takes a list of magnitude
// spectra and returns the half-wave-rectified L2 distance between
// consecutive frames.

import { assertPositive } from './validation.js';

export function onsetStrength(spectra: ArrayLike<ArrayLike<number>>): Float32Array {
  assertPositive(spectra.length, 'spectra.length');
  if (spectra.length < 2) return new Float32Array(0);
  const out = new Float32Array(spectra.length - 1);
  for (let i = 1; i < spectra.length; i++) {
    const a = spectra[i - 1];
    const b = spectra[i];
    if (!a || !b) {
      out[i - 1] = 0;
      continue;
    }
    const n = Math.max(a.length, b.length);
    let sum = 0;
    for (let k = 0; k < n; k++) {
      const d = (b[k] ?? 0) - (a[k] ?? 0);
      if (d > 0) sum += d * d;
    }
    out[i - 1] = Math.sqrt(sum);
  }
  return out;
}

export function pickOnsets(
  strengths: ArrayLike<number>,
  options: { minStrength?: number; minDistance?: number } = {},
): number[] {
  const minStrength = options.minStrength ?? 0;
  const minDistance = options.minDistance ?? 1;
  const out: number[] = [];
  let lastIdx = -Infinity;
  for (let i = 0; i < strengths.length; i++) {
    const v = strengths[i] ?? 0;
    if (v < minStrength) continue;
    if (i - lastIdx < minDistance) continue;
    out.push(i);
    lastIdx = i;
  }
  return out;
}
