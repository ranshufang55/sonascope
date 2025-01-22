import { describe, it, expect } from 'vitest';
import { isPow2, log2Int, nextPow2, prevPow2 } from './pow2.js';

describe('pow2 helpers', () => {
  it('isPow2 detects powers of two', () => {
    expect(isPow2(0)).toBe(false);
    expect(isPow2(1)).toBe(true);
    expect(isPow2(2)).toBe(true);
    expect(isPow2(3)).toBe(false);
    expect(isPow2(1024)).toBe(true);
    expect(isPow2(1023)).toBe(false);
    expect(isPow2(-1)).toBe(false);
  });

  it('nextPow2 rounds up', () => {
    expect(nextPow2(0)).toBe(1);
    expect(nextPow2(1)).toBe(1);
    expect(nextPow2(2)).toBe(2);
    expect(nextPow2(3)).toBe(4);
    expect(nextPow2(1024)).toBe(1024);
    expect(nextPow2(1025)).toBe(2048);
  });

  it('prevPow2 rounds down', () => {
    expect(prevPow2(0)).toBe(0);
    expect(prevPow2(1)).toBe(1);
    expect(prevPow2(2)).toBe(2);
    expect(prevPow2(3)).toBe(2);
    expect(prevPow2(1024)).toBe(1024);
    expect(prevPow2(1025)).toBe(1024);
  });

  it('log2Int computes the floor of log2', () => {
    expect(log2Int(1)).toBe(0);
    expect(log2Int(2)).toBe(1);
    expect(log2Int(4)).toBe(2);
    expect(log2Int(8)).toBe(3);
    expect(log2Int(1024)).toBe(10);
  });
});
