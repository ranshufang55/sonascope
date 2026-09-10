import { describe, it, expect } from "vitest";
import { melFilterbank } from "./bands.js";

describe("melFilterbank validation ordering", () => {
  it("still rejects non-positive fftSize", () => {
    expect(() => melFilterbank(10, 0, 44100)).toThrow();
    expect(() => melFilterbank(10, -1, 44100)).toThrow();
  });

  it("still rejects non-positive sampleRate", () => {
    expect(() => melFilterbank(10, 1024, 0)).toThrow();
    expect(() => melFilterbank(10, 1024, -1)).toThrow();
  });

  it("still rejects maxHz outside Nyquist", () => {
    expect(() => melFilterbank(10, 1024, 44100, 0, 30000)).toThrow();
  });

  it("produces valid output after validation cleanup", () => {
    const fb = melFilterbank(20, 1024, 44100, 0, 22050);
    expect(fb.numFilters).toBe(20);
    expect(fb.filters.length).toBe(20);
    expect(fb.centerFrequencies.length).toBe(20);
  });
});
