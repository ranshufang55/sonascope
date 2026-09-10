import { describe, it, expect } from "vitest";
import { findMinMax, findPeaks } from "./find.js";

describe("find helpers", () => {
  it("findMinMax on an empty array is a neutral sentinel", () => {
    const r = findMinMax(new Float32Array(0));
    expect(r.minIndex).toBe(-1);
    expect(r.maxIndex).toBe(-1);
  });

  it("findMinMax on a known array", () => {
    const r = findMinMax([1, 5, -3, 8, 2]);
    expect(r.min).toBe(-3);
    expect(r.minIndex).toBe(2);
    expect(r.max).toBe(8);
    expect(r.maxIndex).toBe(3);
  });

  it("findPeaks returns local maxima in order", () => {
    const data = [0, 1, 0, 2, 0, 3, 0, 2, 0, 1, 0];
    const peaks = findPeaks(data, { minHeight: 0.5 });
    expect(peaks.map((p) => p.index)).toEqual([1, 3, 5, 7, 9]);
  });

  it("findPeaks respects minDistance", () => {
    const data = [0, 1, 0, 1, 0, 1, 0];
    const peaks = findPeaks(data, { minHeight: 0.1, minDistance: 3 });
    expect(peaks.length).toBeLessThanOrEqual(3);
  });

  it("findPeaks with high minHeight returns nothing", () => {
    const peaks = findPeaks([0, 0.1, 0, 0.2, 0], { minHeight: 0.5 });
    expect(peaks).toEqual([]);
  });

  it("findMinMax on a single-element array returns that element for both", () => {
    const r = findMinMax([42]);
    expect(r.min).toBe(42);
    expect(r.max).toBe(42);
    expect(r.minIndex).toBe(0);
    expect(r.maxIndex).toBe(0);
  });

  it("findMinMax on all-same-value array returns first index for both", () => {
    const r = findMinMax([5, 5, 5, 5]);
    expect(r.min).toBe(5);
    expect(r.max).toBe(5);
    expect(r.minIndex).toBe(0);
    expect(r.maxIndex).toBe(0);
  });

  it("findPeaks never returns the first or last element", () => {
    const data = [10, 1, 2, 1, 10];
    const peaks = findPeaks(data);
    const indices = peaks.map((p) => p.index);
    expect(indices).not.toContain(0);
    expect(indices).not.toContain(data.length - 1);
  });

  it("findPeaks with minDistance replaces weaker nearby peaks", () => {
    const data = [0, 1, 0, 5, 0, 2, 0];
    const peaks = findPeaks(data, { minHeight: 0.5, minDistance: 3 });
    expect(peaks.some((p) => p.value === 5)).toBe(true);
    expect(peaks.some((p) => p.value === 1)).toBe(false);
  });
});
it("rejects invalid peak search data and fractional index distances", () => {
  expect(() => findMinMax([1, NaN])).toThrow();
  expect(() => findPeaks([0, Infinity, 0])).toThrow();
  expect(() => findPeaks([0, 1, 0], { minDistance: 1.5 })).toThrow();
});
