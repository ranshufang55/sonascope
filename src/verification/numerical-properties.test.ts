import { it, expect } from 'vitest';
import * as c from '../core/index.js';
const sizes = [1, 2, 4, 8, 16, 32, 64];
const signal = (length: number) =>
  Float32Array.from({ length }, (_, i) => 0.3 * Math.sin(i * 0.71) + 0.2 * Math.cos(i * 0.23));
function near(actual: ArrayLike<number>, expected: ArrayLike<number>, tolerance = 1e-5): void {
  expect(actual.length).toBe(expected.length);
  let error = 0;
  for (let i = 0; i < actual.length; i++)
    error = Math.max(error, Math.abs(actual[i]! - expected[i]!));
  expect(error).toBeLessThanOrEqual(tolerance);
}

it('compare FFT bins with an independent direct Fourier sum', () => {
  for (const n of sizes) {
    const samples = signal(n),
      actual = c.fft(samples);
    const re: number[] = [],
      im: number[] = [];
    for (let k = 0; k < n; k++) {
      let real = 0,
        imaginary = 0;
      for (let t = 0; t < n; t++) {
        real += samples[t]! * Math.cos((2 * Math.PI * k * t) / n);
        imaginary -= samples[t]! * Math.sin((2 * Math.PI * k * t) / n);
      }
      re.push(real);
      im.push(imaginary);
    }
    near(actual.re, re);
    near(actual.im, im);
  }
});

it('verify both complex planes against a direct Fourier transform', () => {
  for (const n of sizes) {
    const re = signal(n),
      im = Float32Array.from(re, (v) => v * 0.5 + 0.1),
      inputRe = re.slice(),
      inputIm = im.slice();
    c.fftInPlace(re, im);
    const expectedRe: number[] = [],
      expectedIm: number[] = [];
    for (let k = 0; k < n; k++) {
      let a = 0,
        b = 0;
      for (let t = 0; t < n; t++) {
        const angle = (-2 * Math.PI * k * t) / n;
        a += inputRe[t]! * Math.cos(angle) - inputIm[t]! * Math.sin(angle);
        b += inputRe[t]! * Math.sin(angle) + inputIm[t]! * Math.cos(angle);
      }
      expectedRe.push(a);
      expectedIm.push(b);
    }
    near(re, expectedRe);
    near(im, expectedIm);
  }
});

it('preserve energy under the Fourier normalization convention', () => {
  for (const n of sizes) {
    const input = signal(n),
      spectrum = c.fft(input);
    const energy =
      Array.from(spectrum.re).reduce((sum, re, i) => sum + re * re + spectrum.im[i]! ** 2, 0) / n;
    expect(energy).toBeCloseTo(c.energy(input), 5);
  }
});

it('retain Hermitian symmetry for every real input transform', () => {
  for (const n of sizes) {
    const spectrum = c.fft(signal(n));
    expect(spectrum.im[0]).toBeCloseTo(0, 6);
    for (let k = 1; k < n; k++) {
      expect(spectrum.re[k]).toBeCloseTo(spectrum.re[n - k]!, 5);
      expect(spectrum.im[k]).toBeCloseTo(-spectrum.im[n - k]!, 5);
    }
  }
});

it('preserve Fourier linearity for independent input signals', () => {
  for (const n of sizes) {
    const a = signal(n),
      b = Float32Array.from({ length: n }, (_, i) => Math.cos(i * 0.47)),
      sum = Float32Array.from(a, (v, i) => v + b[i]!);
    const actual = c.fft(sum),
      left = c.fft(a),
      right = c.fft(b);
    near(
      actual.re,
      Array.from(left.re, (v, i) => v + right.re[i]!),
    );
    near(
      actual.im,
      Array.from(left.im, (v, i) => v + right.im[i]!),
    );
  }
});

it('scale both Fourier planes by real signal gain', () => {
  for (const n of sizes) {
    const input = signal(n),
      base = c.fft(input);
    for (const gain of [-2, 0, 0.25]) {
      const result = c.fft(Float32Array.from(input, (v) => v * gain));
      near(
        result.re,
        Array.from(base.re, (v) => v * gain),
      );
      near(
        result.im,
        Array.from(base.im, (v) => v * gain),
      );
    }
  }
});

it('match phase rotation after circular time shifts', () => {
  for (const n of [4, 8, 16, 32])
    for (const shift of [1, 2, n - 1]) {
      const input = signal(n),
        base = c.fft(input),
        shifted = c.fft(Float32Array.from({ length: n }, (_, i) => input[(i - shift + n) % n]!));
      const re: number[] = [],
        im: number[] = [];
      for (let k = 0; k < n; k++) {
        const angle = (-2 * Math.PI * k * shift) / n;
        re.push(base.re[k]! * Math.cos(angle) - base.im[k]! * Math.sin(angle));
        im.push(base.re[k]! * Math.sin(angle) + base.im[k]! * Math.cos(angle));
      }
      near(shifted.re, re);
      near(shifted.im, im);
    }
});

it('conjugate Fourier bins under circular time reversal', () => {
  for (const n of sizes) {
    const input = signal(n),
      base = c.fft(input),
      reversed = c.fft(Float32Array.from({ length: n }, (_, i) => input[(n - i) % n]!));
    near(reversed.re, base.re);
    near(
      reversed.im,
      Array.from(base.im, (v) => -v),
    );
  }
});

it('match circular convolution through Fourier multiplication', () => {
  for (const n of [2, 4, 8, 16, 32]) {
    const a = signal(n),
      b = Float32Array.from(a, (v, i) => v * (i % 2 ? 1 : -1)),
      left = c.fft(a),
      right = c.fft(b);
    const re = Float32Array.from(left.re, (v, i) => v * right.re[i]! - left.im[i]! * right.im[i]!),
      im = Float32Array.from(left.im, (v, i) => left.re[i]! * right.im[i]! + v * right.re[i]!);
    const result = c.ifftReal({ re, im });
    const expected = Float32Array.from({ length: n }, (_, i) =>
      Array.from(a).reduce((sum, v, j) => sum + v * b[(i - j + n) % n]!, 0),
    );
    near(result, expected);
  }
});

it('place constant signals exclusively in the DC bin', () => {
  for (const n of sizes) {
    const spectrum = c.fft(new Float32Array(n).fill(0.25));
    near(spectrum.re, [n * 0.25, ...new Array(n - 1).fill(0)]);
    near(spectrum.im, new Float32Array(n));
  }
});

it('isolate alternating samples at the Nyquist bin', () => {
  for (const n of [2, 4, 8, 16, 32, 64]) {
    const input = Float32Array.from({ length: n }, (_, i) => (i % 2 ? -0.5 : 0.5)),
      spectrum = c.fft(input);
    const expected = new Float32Array(n);
    expected[n / 2] = n * 0.5;
    near(spectrum.re, expected);
    near(spectrum.im, new Float32Array(n));
  }
});

it('round-trip independent complex input planes', () => {
  for (const n of sizes) {
    const re = signal(n),
      im = Float32Array.from(re, (v) => 0.2 - v),
      beforeRe = re.slice(),
      beforeIm = im.slice();
    c.fftInPlace(re, im);
    c.ifftInPlace(re, im);
    near(re, beforeRe);
    near(im, beforeIm);
  }
});

it('leave original input storage untouched through forward and inverse calls', () => {
  for (const n of sizes) {
    const input = signal(n),
      before = input.slice(),
      spectrum = c.fft(input),
      re = spectrum.re.slice(),
      im = spectrum.im.slice();
    c.ifft(spectrum);
    expect(input).toEqual(before);
    expect(spectrum.re).toEqual(re);
    expect(spectrum.im).toEqual(im);
  }
});

it('confine in-place transforms to the supplied typed-array views', () => {
  const storage = new Float32Array(24).fill(9),
    re = storage.subarray(4, 12),
    im = storage.subarray(12, 20);
  re.set(signal(8));
  im.fill(0);
  c.fftInPlace(re, im);
  c.ifftInPlace(re, im);
  expect(storage.subarray(0, 4)).toEqual(new Float32Array(4).fill(9));
  expect(storage.subarray(20)).toEqual(new Float32Array(4).fill(9));
  near(re, signal(8));
});

it('keep magnitudes unchanged under complex phase rotation', () => {
  const input = c.fft(signal(32)),
    angle = 0.73;
  const rotated = {
    re: Float32Array.from(input.re, (v, i) => v * Math.cos(angle) - input.im[i]! * Math.sin(angle)),
    im: Float32Array.from(input.im, (v, i) => input.re[i]! * Math.sin(angle) + v * Math.cos(angle)),
  };
  near(c.magnitude(rotated), c.magnitude(input));
});

it('agree on power and squared magnitude across every Fourier bin', () => {
  for (const n of sizes) {
    const bins = c.fft(signal(n)),
      power = c.powerSpectrum(bins),
      magnitude = c.magnitude(bins);
    near(
      power,
      Array.from(magnitude, (v) => v * v),
      2e-5,
    );
  }
});

it('recover real-signal energy from DC, Nyquist and paired interior bins', () => {
  for (const n of [2, 4, 8, 16, 32, 64]) {
    const samples = signal(n),
      powers = c.halfSpectrum(c.powerSpectrum(c.fft(samples)));
    const energy =
      (powers[0]! +
        powers[n / 2]! +
        2 * Array.from(powers.slice(1, -1)).reduce((a, b) => a + b, 0)) /
      n;
    expect(energy).toBeCloseTo(c.energy(samples), 5);
  }
});

it('add twenty decibels when amplitude grows by a factor of ten', () => {
  for (const amplitude of [0.001, 0.01, 0.1, 1, 10])
    expect(c.linToDb(amplitude * 10) - c.linToDb(amplitude)).toBeCloseTo(20, 8);
});

it('add ten decibels when power grows by a factor of ten', () => {
  for (const power of [0.001, 0.01, 0.1, 1, 10])
    expect(c.toDbPower([power * 10])[0]! - c.toDbPower([power])[0]!).toBeCloseTo(10, 5);
});

it('return independent one-sided spectrum storage', () => {
  const spectrum = Float32Array.from({ length: 16 }, (_, i) => i),
    half = c.halfSpectrum(spectrum);
  half[0] = 999;
  expect(spectrum[0]).toBe(0);
  spectrum[1] = 888;
  expect(half[1]).toBe(1);
  expect(half).toHaveLength(9);
});

it('keep spectral centroid invariant under uniform magnitude gain', () => {
  const values = [0, 1, 2, 4, 2, 1, 0];
  const base = c.spectralCentroid(values, 16, 8000);
  for (const gain of [1e-20, 0.1, 10, 1e20])
    expect(
      c.spectralCentroid(
        values.map((v) => v * gain),
        16,
        8000,
      ),
    ).toBeCloseTo(base, 6);
});

it('translate centroid by the exact frequency-bin displacement', () => {
  const values = [1, 3, 2, 4],
    shifted = [0, 0, ...values];
  expect(c.spectralCentroid(shifted, 16, 8000) - c.spectralCentroid(values, 16, 8000)).toBeCloseTo(
    1000,
    8,
  );
});

it('retain spectral spread under frequency-bin translation', () => {
  const values = [1, 3, 2, 4],
    shifted = [0, 0, ...values];
  expect(c.spectralSpread(shifted, 16, 8000)).toBeCloseTo(c.spectralSpread(values, 16, 8000), 8);
});

it('keep spectral spread independent of signal amplitude', () => {
  const values = [0, 1, 4, 2, 3];
  for (const gain of [0.001, 0.1, 10])
    expect(
      c.spectralSpread(
        values.map((v) => v * gain),
        16,
        8000,
      ),
    ).toBeCloseTo(c.spectralSpread(values, 16, 8000), 8);
});

it('move rolloff monotonically as the retained energy threshold grows', () => {
  const values = [0, 1, 2, 3, 4, 0],
    rolloffs = Array.from({ length: 21 }, (_, i) => c.spectralRolloff(values, 16, 8000, i / 20));
  expect(rolloffs.every((value, i) => i === 0 || value >= rolloffs[i - 1]!)).toBe(true);
  expect(rolloffs.at(-1)).toBe(2000);
});

it('reach maximum spectral entropy for uniform bins', () => {
  for (const length of [1, 2, 4, 8, 16])
    expect(c.spectralEntropy(new Float32Array(length).fill(0.25))).toBeCloseTo(
      Math.log2(length),
      8,
    );
});

it('preserve entropy under gain and bin permutation', () => {
  const values = [0, 1, 2, 3, 7];
  const entropy = c.spectralEntropy(values);
  expect(c.spectralEntropy(values.slice().reverse())).toBeCloseTo(entropy, 10);
  expect(c.spectralEntropy(values.map((v) => v * 0.001))).toBeCloseTo(entropy, 10);
});

it('count increasing spectral energy without penalizing decays', () => {
  const quiet = [0, 1, 2],
    loud = [1, 3, 5];
  expect(c.spectralFlux(loud, quiet)).toBeCloseTo(Math.sqrt(14), 8);
  expect(c.spectralFlux(quiet, loud)).toBe(0);
  expect(c.spectralFlux(loud, loud)).toBe(0);
});

it('respect the geometric-to-arithmetic mean bound for positive spectra', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const values = Array.from({ length: 17 }, (_, i) => 0.01 + ((i * seed * 17) % 31));
    const flatness = c.spectralFlatness(values);
    expect(flatness).toBeGreaterThan(0);
    expect(flatness).toBeLessThanOrEqual(1);
    expect(c.spectralFlatness(values.slice().reverse())).toBeCloseTo(flatness, 10);
  }
});

it('keep every symmetric analysis window finite and mirrored', () => {
  for (const name of [
    'hann',
    'hamming',
    'blackman',
    'rectangular',
    'triangular',
    'bartlett',
  ] as const)
    for (const length of [1, 2, 3, 4, 7, 16, 31]) {
      const window = c.makeWindow(name, length);
      expect(window.every(Number.isFinite)).toBe(true);
      near(window, window.slice().reverse(), 1e-7);
    }
});

it('match the closed-form Hann coherent gain', () => {
  for (const length of [3, 4, 8, 16, 31, 64])
    expect(c.windowSum(c.hann(length))).toBeCloseTo((length - 1) / 2, 5);
});

it('match the closed-form Hamming coherent gain', () => {
  for (const length of [3, 4, 8, 16, 31, 64])
    expect(c.windowSum(c.hamming(length))).toBeCloseTo(0.54 * length - 0.46, 5);
});

it('compose pointwise windows independently of application order', () => {
  const input = signal(32),
    a = c.hann(32),
    b = c.hamming(32);
  const left = c.applyWindow(c.applyWindow(input.slice(), a), b),
    right = c.applyWindow(c.applyWindow(input.slice(), b), a);
  near(left, right, 1e-7);
});

it('reconstruct rectangular STFTs across overlapping and adjacent frames', () => {
  for (const size of [4, 8, 16])
    for (const hop of [1, size / 2, size]) {
      const input = signal(size + 4 * hop),
        restored = c.istft(c.stft(input, size, hop, null), size, hop, null, input.length);
      near(restored, input);
    }
});

it('reconstruct observable Hann-window samples throughout overlap regions', () => {
  for (const size of [8, 16, 32])
    for (const hop of [size / 4, size / 2]) {
      const input = signal(size + 4 * hop),
        restored = c.istft(c.stft(input, size, hop, 'hann'), size, hop, 'hann', input.length);
      near(restored.subarray(1, -1), input.subarray(1, -1));
      expect(restored[0]).toBe(0);
      expect(restored.at(-1)).toBe(0);
    }
});

it('align STFT power and magnitude outputs frame by frame', () => {
  for (const size of [4, 8, 16]) {
    const input = signal(64),
      magnitudes = c.stftMagnitude(input, size, size / 2),
      power = c.stftPower(input, size, size / 2);
    expect(power).toHaveLength(magnitudes.length);
    for (let i = 0; i < power.length; i++)
      near(
        power[i]!,
        Array.from(magnitudes[i]!, (v) => v * v),
      );
  }
});

it('preserve linearity through overlap-add synthesis', () => {
  const a = [signal(8), signal(8)],
    b = a.map((frame) => Float32Array.from(frame, (v) => v * 0.5 + 0.1));
  const combined = a.map((frame, i) => Float32Array.from(frame, (v, j) => v + b[i]![j]!));
  const left = c.overlapAdd(a, 8, 4),
    right = c.overlapAdd(b, 8, 4);
  near(
    c.overlapAdd(combined, 8, 4),
    Array.from(left, (v, i) => v + right[i]!),
  );
});

it('isolate overlapping frame arrays from one another and their source', () => {
  const input = signal(16),
    original = input.slice(),
    frames = c.frameSignal(input, 8, { hopSize: 4 }),
    second = frames[1]!.slice();
  frames[0]![4] = 99;
  expect(frames[1]).toEqual(second);
  expect(input).toEqual(original);
});
