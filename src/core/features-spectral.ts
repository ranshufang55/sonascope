// Spectral features. All routines take a magnitude/power spectrum
// and (where useful) the sample rate and FFT size.

export function spectralCentroid(
  magnitudes: ArrayLike<number>,
  fftSize: number,
  sampleRate: number,
): number {
  if (magnitudes.length === 0) return 0;
  let weighted = 0;
  let total = 0;
  for (let i = 0; i < magnitudes.length; i++) {
    const v = magnitudes[i] ?? 0;
    weighted += v * i;
    total += v;
  }
  if (total === 0) return 0;
  return (weighted / total) * (sampleRate / fftSize);
}

export function spectralSpread(
  magnitudes: ArrayLike<number>,
  fftSize: number,
  sampleRate: number,
): number {
  if (magnitudes.length === 0) return 0;
  const c = spectralCentroid(magnitudes, fftSize, sampleRate);
  let weighted = 0;
  let total = 0;
  const binHz = sampleRate / fftSize;
  for (let i = 0; i < magnitudes.length; i++) {
    const v = magnitudes[i] ?? 0;
    const diff = i * binHz - c;
    weighted += v * diff * diff;
    total += v;
  }
  if (total === 0) return 0;
  return Math.sqrt(weighted / total);
}

export function spectralRolloff(
  magnitudes: ArrayLike<number>,
  fftSize: number,
  sampleRate: number,
  threshold: number = 0.85,
): number {
  if (magnitudes.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < magnitudes.length; i++) total += magnitudes[i] ?? 0;
  if (total === 0) return 0;
  const target = total * threshold;
  let acc = 0;
  const binHz = sampleRate / fftSize;
  for (let i = 0; i < magnitudes.length; i++) {
    acc += magnitudes[i] ?? 0;
    if (acc >= target) return i * binHz;
  }
  return (magnitudes.length - 1) * binHz;
}

export function spectralFlatness(magnitudes: ArrayLike<number>): number {
  if (magnitudes.length === 0) return 0;
  let logSum = 0;
  let arith = 0;
  for (let i = 0; i < magnitudes.length; i++) {
    const v = magnitudes[i] ?? 0;
    if (v === 0) return 0;
    logSum += Math.log(v);
    arith += v;
  }
  if (arith === 0) return 0;
  const geo = Math.exp(logSum / magnitudes.length);
  return Math.min(1, geo / (arith / magnitudes.length));
}

export function spectralFlux(current: ArrayLike<number>, previous: ArrayLike<number>): number {
  const n = Math.max(current.length, previous.length);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const cur = current[i] ?? 0;
    const prev = previous[i] ?? 0;
    const diff = cur - prev;
    if (diff > 0) sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export function spectralEntropy(magnitudes: ArrayLike<number>): number {
  if (magnitudes.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < magnitudes.length; i++) total += magnitudes[i] ?? 0;
  if (total === 0) return 0;
  let h = 0;
  for (let i = 0; i < magnitudes.length; i++) {
    const p = (magnitudes[i] ?? 0) / total;
    if (p > 0) h -= p * Math.log2(p);
  }
  return h;
}
