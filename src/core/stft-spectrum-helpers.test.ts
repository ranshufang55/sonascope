import { describe, it, expect } from "vitest";
import { stftMagnitude, stftPower } from "./frame.js";
import { generateSine } from "./generators.js";

describe("stftMagnitude and stftPower via spectrum helpers", () => {
  it("stftMagnitude returns half-spectrum sized arrays", () => {
    const buf = generateSine(44100, 0.05, 440);
    const mags = stftMagnitude(buf.getChannel(0), 1024, 256);
    expect(mags.length).toBeGreaterThan(0);
    for (const mag of mags) {
      expect(mag.length).toBe(513); // 1024/2 + 1
    }
  });

  it("stftPower returns half-spectrum sized arrays", () => {
    const buf = generateSine(44100, 0.05, 440);
    const pows = stftPower(buf.getChannel(0), 1024, 256);
    expect(pows.length).toBeGreaterThan(0);
    for (const pow of pows) {
      expect(pow.length).toBe(513);
    }
  });

  it("power equals magnitude squared for each bin", () => {
    const buf = generateSine(44100, 0.02, 1000);
    const mags = stftMagnitude(buf.getChannel(0), 512, 128);
    const pows = stftPower(buf.getChannel(0), 512, 128);
    expect(mags.length).toBe(pows.length);
    for (let f = 0; f < mags.length; f++) {
      for (let k = 0; k < mags[f]!.length; k++) {
        const magVal = mags[f]![k]!;
        const powVal = pows[f]![k]!;
        expect(powVal).toBeCloseTo(magVal * magVal, 3);
      }
    }
  });

  it("all magnitudes and powers are non-negative", () => {
    const buf = generateSine(48000, 0.01, 880, { amplitude: 0.5 });
    const mags = stftMagnitude(buf.getChannel(0), 256, 64);
    const pows = stftPower(buf.getChannel(0), 256, 64);
    for (const mag of mags) {
      for (let i = 0; i < mag.length; i++) {
        expect(mag[i]).toBeGreaterThanOrEqual(0);
      }
    }
    for (const pow of pows) {
      for (let i = 0; i < pow.length; i++) {
        expect(pow[i]).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
