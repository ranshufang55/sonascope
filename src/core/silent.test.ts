import { describe, it, expect } from "vitest";
import { createSilentBuffer, createSilentLike } from "./silent.js";
import { AudioBuffer } from "./buffer.js";

describe("silent buffer helpers", () => {
  it("creates a zero-filled buffer of the requested shape", () => {
    const buf = createSilentBuffer(48000, 2, 32);
    expect(buf.numChannels).toBe(2);
    expect(buf.numSamples).toBe(32);
    for (let c = 0; c < 2; c++) {
      for (let i = 0; i < 32; i++) {
        expect(buf.getChannel(c)[i]).toBe(0);
      }
    }
  });

  it("creates a zero buffer matching an existing template", () => {
    const template = new AudioBuffer(22050, 1, 100);
    const copy = createSilentLike(template);
    expect(copy.sampleRate).toBe(22050);
    expect(copy.numChannels).toBe(1);
    expect(copy.numSamples).toBe(100);
  });

  it("overrides the sample count when requested", () => {
    const template = new AudioBuffer(44100, 2, 200);
    const copy = createSilentLike(template, 50);
    expect(copy.numSamples).toBe(50);
    expect(copy.numChannels).toBe(2);
  });

  it("creates an empty buffer with zero samples", () => {
    const buf = createSilentBuffer(48000, 1, 0);
    expect(buf.numSamples).toBe(0);
    expect(buf.numChannels).toBe(1);
    expect(buf.sampleRate).toBe(48000);
  });

  it("creates a mono silent buffer", () => {
    const buf = createSilentBuffer(16000, 1, 512);
    expect(buf.numChannels).toBe(1);
    expect(buf.numSamples).toBe(512);
    expect(buf.getChannel(0).length).toBe(512);
  });

  it("preserves the exact sampleRate from the template", () => {
    const template = new AudioBuffer(96000, 2, 100);
    const copy = createSilentLike(template);
    expect(copy.sampleRate).toBe(96000);
  });

  it("createSilentLike with zero override produces an empty buffer", () => {
    const template = new AudioBuffer(44100, 2, 200);
    const copy = createSilentLike(template, 0);
    expect(copy.numSamples).toBe(0);
    expect(copy.numChannels).toBe(2);
    expect(copy.sampleRate).toBe(44100);
  });
});
