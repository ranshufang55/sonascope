import { describe, it, expect } from "vitest";
import { AudioBuffer } from "./buffer.js";
import { gainAudio } from "./editing.js";

describe("gainAudio Float32 overflow guard", () => {
  it("scales normally for reasonable gain values", () => {
    const audio = new AudioBuffer(44100, 1, 4, [
      Float32Array.from([0.5, -0.5, 0.25, -0.25]),
    ]);
    const result = gainAudio(audio, 2);
    const ch = result.getChannel(0);
    expect(ch[0]).toBeCloseTo(1.0, 5);
    expect(ch[1]).toBeCloseTo(-1.0, 5);
  });

  it("throws on gain that would produce Infinity", () => {
    const audio = new AudioBuffer(44100, 1, 2, [
      Float32Array.from([1.0, -1.0]),
    ]);
    expect(() => gainAudio(audio, 3.5e38)).toThrow(/non-finite/);
  });

  it("preserves silence for zero gain", () => {
    const audio = new AudioBuffer(44100, 1, 3, [
      Float32Array.from([0.5, -0.5, 0.1]),
    ]);
    const result = gainAudio(audio, 0);
    const ch = result.getChannel(0);
    expect(Math.abs(ch[0]!)).toBe(0);
    expect(Math.abs(ch[1]!)).toBe(0);
    expect(Math.abs(ch[2]!)).toBe(0);
  });

  it("rejects non-finite gain", () => {
    const audio = new AudioBuffer(44100, 1, 1, [Float32Array.from([0.5])]);
    expect(() => gainAudio(audio, NaN)).toThrow();
    expect(() => gainAudio(audio, Infinity)).toThrow();
  });
});
