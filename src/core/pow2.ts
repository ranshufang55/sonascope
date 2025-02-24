import { assertInteger, assertNonNegative } from './validation.js';

function assertCount(n: number): void {
  assertInteger(n, 'n');
  assertNonNegative(n, 'n');
}

export function isPow2(n: number): boolean {
  return Number.isSafeInteger(n) && n > 0 && 2 ** Math.round(Math.log2(n)) === n;
}

export function nextPow2(n: number): number {
  assertCount(n);
  let value = 1;
  while (value < n) value *= 2;
  if (!Number.isSafeInteger(value)) throw new RangeError('next power exceeds safe integer range');
  return value;
}

export function prevPow2(n: number): number {
  assertCount(n);
  if (n === 0) return 0;
  let value = 1;
  while (value <= n / 2) value *= 2;
  return value;
}

export function log2Int(n: number): number {
  assertCount(n);
  if (n === 0) return 0;
  return Math.round(Math.log2(prevPow2(n)));
}
