// Power-of-two helpers used by the FFT to pad input sizes.

import { assertNonNegative, assertInteger } from './validation.js';

export function isPow2(n: number): boolean {
  if (!Number.isInteger(n) || n < 0) return false;
  return n > 0 && (n & (n - 1)) === 0;
}

export function nextPow2(n: number): number {
  assertNonNegative(n, 'n');
  if (n <= 1) return 1;
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

export function prevPow2(n: number): number {
  assertNonNegative(n, 'n');
  if (n < 1) return 0;
  let p = 1;
  while (p << 1 <= n) p <<= 1;
  return p;
}

export function log2Int(n: number): number {
  assertInteger(n, 'n');
  if (n < 1) return 0;
  let bits = 0;
  let v = n;
  while (v > 1) {
    v >>= 1;
    bits++;
  }
  return bits;
}
