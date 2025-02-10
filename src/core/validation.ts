// Finite-input validation. All analysis routines in this library assume the
// caller has supplied a finite, well-formed array. NaN and Infinity break
// FFT, smoothing, and any operation that sums products. The helpers here
// give callers one canonical way to assert that property and report the
// first bad index for easier debugging.

export function isFiniteNumber(value: number): boolean {
  return typeof value === 'number' && Number.isFinite(value);
}

export function assertFinite(value: number, label: string = 'value'): void {
  if (!isFiniteNumber(value)) {
    throw new RangeError(`${label} must be a finite number, got ${value}`);
  }
}

export function findFirstNonFinite(arr: ArrayLike<number>): number {
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (v === undefined || !Number.isFinite(v)) return i;
  }
  return -1;
}

export function assertFiniteSamples(samples: ArrayLike<number>, label: string = 'samples'): void {
  const idx = findFirstNonFinite(samples);
  if (idx >= 0) {
    const v = samples[idx];
    throw new RangeError(`${label} contains a non-finite value at index ${idx}: ${v}`);
  }
}

export function assertPositive(value: number, label: string = 'value'): void {
  assertFinite(value, label);
  if (!(value > 0)) {
    throw new RangeError(`${label} must be > 0, got ${value}`);
  }
}

export function assertNonNegative(value: number, label: string = 'value'): void {
  assertFinite(value, label);
  if (!(value >= 0)) {
    throw new RangeError(`${label} must be >= 0, got ${value}`);
  }
}

export function assertInteger(value: number, label: string = 'value'): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${label} must be a safe integer, got ${value}`);
  }
}

export function assertInRange(
  value: number,
  min: number,
  max: number,
  label: string = 'value',
): void {
  assertFinite(value, label);
  assertFinite(min, 'min');
  assertFinite(max, 'max');
  if (min > max) throw new RangeError('min must not exceed max');
  if (!(value >= min && value <= max)) {
    throw new RangeError(`${label} must be in [${min}, ${max}], got ${value}`);
  }
}
