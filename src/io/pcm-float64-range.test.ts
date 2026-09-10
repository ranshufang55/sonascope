import { describe, it, expect } from "vitest";
import { readFloat64, writeFloat64 } from "./pcm.js";

describe("Float64 PCM range", () => {
  it("reads finite Float64 values outside Float32 range", () => {
    // 1e100 is well within Float64 range but far beyond Float32.
    const buf = new ArrayBuffer(8);
    const view = new DataView(buf);
    view.setFloat64(0, 1e100, true);
    const value = readFloat64(view, 0);
    expect(value).toBe(1e100);
  });

  it("writes finite Float64 values outside Float32 range", () => {
    const buf = new ArrayBuffer(8);
    const view = new DataView(buf);
    writeFloat64(view, 0, -1e200);
    expect(view.getFloat64(0, true)).toBe(-1e200);
  });

  it("still rejects Infinity", () => {
    const buf = new ArrayBuffer(8);
    const view = new DataView(buf);
    view.setFloat64(0, Infinity, true);
    expect(() => readFloat64(view, 0)).toThrow();
  });

  it("still rejects NaN", () => {
    const buf = new ArrayBuffer(8);
    const view = new DataView(buf);
    writeFloat64(view, 0, 42);
    expect(() => writeFloat64(view, 0, NaN)).toThrow();
  });

  it("round-trips values at the edge of Float32 range", () => {
    const buf = new ArrayBuffer(8);
    const view = new DataView(buf);
    const edge = 3.5e38; // Beyond Float32 max (~3.4e38)
    writeFloat64(view, 0, edge);
    expect(readFloat64(view, 0)).toBe(edge);
  });
});
