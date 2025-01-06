import { describe, it, expect } from 'vitest';
import {
  assertFinite,
  assertFiniteSamples,
  assertInRange,
  assertInteger,
  assertNonNegative,
  assertPositive,
  findFirstNonFinite,
  isFiniteNumber,
} from './validation.js';

describe('validation', () => {
  it('isFiniteNumber accepts numbers and rejects NaN/Infinity', () => {
    expect(isFiniteNumber(0)).toBe(true);
    expect(isFiniteNumber(-1.5)).toBe(true);
    expect(isFiniteNumber(Number.MAX_VALUE)).toBe(true);
    expect(isFiniteNumber(NaN)).toBe(false);
    expect(isFiniteNumber(Infinity)).toBe(false);
    expect(isFiniteNumber(-Infinity)).toBe(false);
  });

  it('assertFinite throws with a useful message', () => {
    expect(() => assertFinite(NaN, 'gain')).toThrow(/gain/);
    expect(() => assertFinite(1.5)).not.toThrow();
  });

  it('findFirstNonFinite locates the offending index', () => {
    expect(findFirstNonFinite([1, 2, 3])).toBe(-1);
    expect(findFirstNonFinite([1, NaN, 3])).toBe(1);
    expect(findFirstNonFinite([1, 2, Infinity])).toBe(2);
  });

  it('assertFiniteSamples stops at the first bad value', () => {
    expect(() => assertFiniteSamples([0.1, 0.2, 0.3])).not.toThrow();
    const arr = new Float32Array([0, 0, NaN, 0]);
    expect(() => assertFiniteSamples(arr, 'wave')).toThrow(/index 2/);
  });

  it('assertPositive, assertNonNegative, assertInteger behave as named', () => {
    expect(() => assertPositive(1)).not.toThrow();
    expect(() => assertPositive(0)).toThrow();
    expect(() => assertNonNegative(0)).not.toThrow();
    expect(() => assertNonNegative(-1)).toThrow();
    expect(() => assertInteger(2)).not.toThrow();
    expect(() => assertInteger(2.5)).toThrow();
  });

  it('assertInRange checks inclusive bounds', () => {
    expect(() => assertInRange(0, 0, 1)).not.toThrow();
    expect(() => assertInRange(1, 0, 1)).not.toThrow();
    expect(() => assertInRange(-0.01, 0, 1)).toThrow();
    expect(() => assertInRange(1.01, 0, 1)).toThrow();
  });
});
