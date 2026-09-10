import { describe, it, expect } from "vitest";
import { melFilterbank, applyMelFilterbank } from "./bands.js";

describe("melFilterbank NaN guard", () => {
  it("produces all-finite filter weights when mel points nearly collapse", () => {
    // 1 filter with very wide FFT means left/center/right can be close
    // together but should never produce NaN or Infinity weights.
    const fb = melFilterbank(1, 64, 44100, 0, 22050);
    expect(fb.numFilters).toBe(1);
    for (const filter of fb.filters) {
      for (let i = 0; i < filter.length; i++) {
        expect(Number.isFinite(filter[i])).toBe(true);
      }
    }
  });

  it("applyMelFilterbank returns finite output for collapsed-point filterbank", () => {
    const fb = melFilterbank(1, 64, 44100, 0, 22050);
    const bins = Math.floor(64 / 2) + 1;
    const power = new Float32Array(bins).fill(1);
    const result = applyMelFilterbank(power, fb);
    expect(Number.isFinite(result[0])).toBe(true);
  });

  it("produces finite weights for edge-case narrow filter spacing", () => {
    // Many filters with a small FFT can create very narrow mel spacing.
    const fb = melFilterbank(40, 128, 8000, 0, 4000);
    for (const filter of fb.filters) {
      for (let i = 0; i < filter.length; i++) {
        expect(Number.isFinite(filter[i])).toBe(true);
        expect(filter[i]).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
