import { describe, it, expect } from "vitest";
import { fft, ifft } from "./fft.js";

describe("FFT with recursive twiddle rotation", () => {
  it("fft of a unit impulse is all ones", () => {
    const input = new Float32Array(8);
    input[0] = 1;
    const result = fft(input);
    for (let i = 0; i < 8; i++) {
      expect(result.re[i]).toBeCloseTo(1, 5);
      expect(result.im[i]).toBeCloseTo(0, 5);
    }
  });

  it("fft/ifft round-trip preserves signal", () => {
    const signal = Float32Array.from([1, 2, 3, 4, 5, 6, 7, 8]);
    const spectrum = fft(signal);
    const recovered = ifft(spectrum);
    for (let i = 0; i < 8; i++) {
      expect(recovered.re[i]).toBeCloseTo(signal[i], 4);
    }
  });

  it("fft of a pure cosine has expected bin structure", () => {
    const N = 64;
    const freq = 4; // 4 cycles in N samples
    const signal = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      signal[i] = Math.cos((2 * Math.PI * freq * i) / N);
    }
    const result = fft(signal);
    // Bins freq and N-freq should have magnitude N/2
    expect(Math.hypot(result.re[freq]!, result.im[freq]!)).toBeCloseTo(N / 2, 1);
    expect(Math.hypot(result.re[N - freq]!, result.im[N - freq]!)).toBeCloseTo(N / 2, 1);
    // DC should be ~0
    expect(Math.hypot(result.re[0]!, result.im[0]!)).toBeCloseTo(0, 3);
  });

  it("handles large FFT (2^14) without numerical drift", () => {
    const N = 1 << 14; // 16384
    const signal = new Float32Array(N);
    for (let i = 0; i < N; i++) signal[i] = Math.sin((2 * Math.PI * 100 * i) / N);
    const spectrum = fft(signal);
    const recovered = ifft(spectrum);
    let maxErr = 0;
    for (let i = 0; i < N; i++) {
      maxErr = Math.max(maxErr, Math.abs(recovered.re[i]! - signal[i]!));
    }
    // Allow some Float32 drift but it should be small
    expect(maxErr).toBeLessThan(0.01);
  });

  it("handles size-2 FFT", () => {
    const result = fft(Float32Array.from([3, 5]));
    expect(result.re[0]).toBeCloseTo(8, 5); // 3 + 5
    expect(result.re[1]).toBeCloseTo(-2, 5); // 3 - 5
  });
});
