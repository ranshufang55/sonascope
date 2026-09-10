import { describe, it, expect } from "vitest";
import { buildPyramid, queryPyramid } from "./pyramid.js";

describe("pyramid", () => {
  it("builds levels that shrink as level increases", () => {
    const samples = new Float32Array(64);
    for (let i = 0; i < 64; i++) samples[i] = Math.sin((2 * Math.PI * i) / 16);
    const p = buildPyramid(samples, 4);
    expect(p.levels.length).toBe(4);
    expect(p.levels[0]?.min.length).toBe(64);
    expect(p.levels[1]?.min.length).toBe(32);
    expect(p.levels[2]?.min.length).toBe(16);
    expect(p.levels[3]?.min.length).toBe(8);
  });

  it("queryPyramid returns the global min/max for the full range", () => {
    const samples = new Float32Array(64);
    for (let i = 0; i < 64; i++) samples[i] = Math.sin((2 * Math.PI * i) / 16);
    const p = buildPyramid(samples, 4);
    const { min, max } = queryPyramid(p, 0, 64);
    expect(min).toBeCloseTo(-1, 1);
    expect(max).toBeCloseTo(1, 1);
  });

  it("queryPyramid restricts to the requested window", () => {
    const samples = new Float32Array(16);
    samples[0] = 1;
    samples[15] = -1;
    const p = buildPyramid(samples, 3);
    const start = queryPyramid(p, 0, 4);
    expect(start.max).toBeCloseTo(1, 4);
    const end = queryPyramid(p, 12, 16);
    expect(end.min).toBeCloseTo(-1, 4);
  });

  it("buildPyramid with one level returns the input shape", () => {
    const p = buildPyramid([1, 2, 3, 4], 1);
    expect(p.levels.length).toBe(1);
  });

  it("queryPyramid clamps out-of-bounds ranges to the sample length", () => {
    const samples = new Float32Array([1, 2, 3, 4, 5]);
    const p = buildPyramid(samples);
    const result = queryPyramid(p, 0, 100);
    expect(result.min).toBe(1);
    expect(result.max).toBe(5);
  });

  it("queryPyramid handles negative start by clamping to 0", () => {
    const samples = new Float32Array([1, 2, 3]);
    const p = buildPyramid(samples);
    const result = queryPyramid(p, -10, 2);
    expect(result.min).toBe(1);
    expect(result.max).toBe(2);
  });

  it("queryPyramid uses floor/ceil on fractional boundaries", () => {
    const samples = new Float32Array([10, 20, 30, 40, 50]);
    const p = buildPyramid(samples);
    const result = queryPyramid(p, 1.5, 3.5);
    // floor(1.5)=1, ceil(3.5)=4, so samples[1..4] = [20, 30, 40]
    expect(result.min).toBe(20);
    expect(result.max).toBe(40);
  });

  it("queryPyramid returns zero range when start equals end", () => {
    const samples = new Float32Array([1, 2, 3]);
    const p = buildPyramid(samples);
    const result = queryPyramid(p, 2, 2);
    expect(result.min).toBe(0);
    expect(result.max).toBe(0);
  });
});

it("matches exact min/max for every viewport in short irregular signals", () => {
  for (const values of [[], [7], [0, 0, 99, 0], [-8, 3, 1, -2, 9, 4, -7]]) {
    for (const depth of [1, 2, 32]) {
      const pyramid = buildPyramid(values, depth);
      for (let start = 0; start <= values.length; start++) {
        for (let end = start; end <= values.length; end++) {
          const selected = values.slice(start, end);
          const expected = selected.length
            ? { min: Math.min(...selected), max: Math.max(...selected) }
            : { min: 0, max: 0 };
          expect(queryPyramid(pyramid, start, end)).toEqual(expected);
        }
      }
    }
  }
});
