import { describe, it, expect } from "vitest";
import { StreamingAnalyzer } from "./streaming.js";

describe("StreamingAnalyzer deferred frame trim", () => {
  it("retains exactly retainFrames frames after a large push", () => {
    const analyzer = new StreamingAnalyzer({
      sampleRate: 44100,
      frameSize: 256,
      hopSize: 64,
      retainFrames: 10,
    });
    // Push enough samples to produce ~50 frames
    const samples = new Float32Array(256 + 64 * 50);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.sin(i * 0.1);
    analyzer.push(samples);
    expect(analyzer.framesOut().length).toBeLessThanOrEqual(10);
    expect(analyzer.framesOut().length).toBeGreaterThan(0);
  });

  it("produces the same results as incremental pushes", () => {
    // Compare one big push vs many small pushes
    const samples = new Float32Array(2048);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.sin(i * 0.05);

    const a1 = new StreamingAnalyzer({
      sampleRate: 44100, frameSize: 256, hopSize: 128, retainFrames: 100,
    });
    a1.push(samples);

    const a2 = new StreamingAnalyzer({
      sampleRate: 44100, frameSize: 256, hopSize: 128, retainFrames: 100,
    });
    for (let i = 0; i < samples.length; i++) a2.push([samples[i]!]);

    const f1 = a1.framesOut();
    const f2 = a2.framesOut();
    expect(f1.length).toBe(f2.length);
    for (let i = 0; i < f1.length; i++) {
      expect(f1[i]!.rms).toBeCloseTo(f2[i]!.rms, 5);
      expect(f1[i]!.centroid).toBeCloseTo(f2[i]!.centroid, 2);
    }
  });

  it("handles empty push gracefully", () => {
    const analyzer = new StreamingAnalyzer({
      sampleRate: 44100, frameSize: 256, hopSize: 128, retainFrames: 10,
    });
    const result = analyzer.push(new Float32Array(0));
    expect(result).toEqual([]);
    expect(analyzer.framesOut()).toEqual([]);
  });

  it("reset clears all state", () => {
    const analyzer = new StreamingAnalyzer({
      sampleRate: 44100, frameSize: 256, hopSize: 64, retainFrames: 5,
    });
    const samples = new Float32Array(1024);
    for (let i = 0; i < samples.length; i++) samples[i] = 0.5;
    analyzer.push(samples);
    expect(analyzer.framesOut().length).toBeGreaterThan(0);
    analyzer.reset();
    expect(analyzer.framesOut().length).toBe(0);
  });
});
