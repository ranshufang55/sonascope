import { describe, it, expect } from "vitest";
import { spectralFlatness } from "./features-spectral.js";

describe("spectralFlatness epsilon floor", () => {
  it("returns a finite value when one bin is zero", () => {
    // Previously returned 0 immediately when any bin was zero.
    const magnitudes = new Float32Array([1, 0, 1, 1, 1]);
    const result = spectralFlatness(magnitudes);
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBeGreaterThan(0);
  });

  it("returns ~1 for a flat spectrum", () => {
    const magnitudes = new Float32Array(8).fill(1);
    const result = spectralFlatness(magnitudes);
    expect(result).toBeCloseTo(1.0, 3);
  });

  it("returns 0 for an all-zero spectrum", () => {
    const magnitudes = new Float32Array(4).fill(0);
    const result = spectralFlatness(magnitudes);
    expect(result).toBe(0);
  });

  it("returns 0 for empty input", () => {
    const result = spectralFlatness(new Float32Array(0));
    expect(result).toBe(0);
  });

  it("handles a spectrum with many zero bins gracefully", () => {
    const magnitudes = new Float32Array([0, 0, 5, 0, 0, 0, 3, 0]);
    const result = spectralFlatness(magnitudes);
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });
});
