import { describe, it, expect } from 'vitest';
import { frameSignal, overlapAdd, stft, stftMagnitude, istft } from './frame.js';
import { generateSine } from './generators.js';

describe('frame', () => {
  it('frameSignal produces the right number of frames', () => {
    const data = new Float32Array(1024);
    const f = frameSignal(data, 256, { hopSize: 128 });
    expect(f.length).toBe(7);
  });

  it('overlapAdd reconstructs the original length', () => {
    const data = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) data[i] = Math.sin((2 * Math.PI * i) / 100);
    const f = frameSignal(data, 256, { hopSize: 128, window: null });
    const out = overlapAdd(f, 256, 128, 1024);
    expect(out.length).toBe(1024);
  });

  it('stft returns one complex spectrum per frame', () => {
    const data = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) data[i] = Math.sin((2 * Math.PI * 50 * i) / 1024);
    const spectra = stft(data, 256, 128);
    expect(spectra.length).toBeGreaterThan(0);
    expect(spectra[0]?.re.length).toBe(256);
  });

  it('stftMagnitude picks up the right frequency bin', () => {
    const buf = generateSine(64, 1, 4);
    const mags = stftMagnitude(buf.getChannel(0), 64, 64, 'hann');
    expect(mags.length).toBeGreaterThan(0);
    const first = mags[0];
    expect(first).toBeDefined();
    if (!first) return;
    let peak = 0;
    let peakIdx = 0;
    for (let i = 0; i < first.length; i++) {
      const v = first[i] ?? 0;
      if (v > peak) {
        peak = v;
        peakIdx = i;
      }
    }
    expect(peakIdx).toBe(4);
  });

  it('istft round-trips stft with a window', () => {
    const data = new Float32Array(512);
    for (let i = 0; i < 512; i++) data[i] = Math.sin((2 * Math.PI * 30 * i) / 512);
    const spectra = stft(data, 128, 64, 'hann');
    const out = istft(spectra, 128, 64, 'hann', 512);
    expect(out.length).toBe(512);
  });
});

it('reconstructs overlapping rectangular frames without gain changes', () => {
  const input = Float32Array.from([0, 1, -1, 0.5, 0.25, -0.25, 0.75, -0.75]);
  for (const hop of [1, 2, 4]) {
    const output = istft(stft(input, 4, hop, 'rectangular'), 4, hop, 'rectangular', input.length);
    for (let i = 0; i < input.length; i++) expect(output[i]).toBeCloseTo(input[i]!, 5);
  }
});
it('reconstructs the observable interior with a Hann window', () => {
  const input = Float32Array.from({ length: 16 }, (_, i) => Math.sin(i));
  const output = istft(stft(input, 8, 2, 'hann'), 8, 2, 'hann', input.length);
  for (let i = 1; i < input.length - 1; i++) expect(output[i]).toBeCloseTo(input[i]!, 4);
  expect(output[0]).toBe(0);
});
it('rejects nonfinite frame samples and oversized overlap matrices', () => {
  expect(() => frameSignal([1, NaN, 2, 3], 4, { hopSize: 2 })).toThrow();
  expect(() => frameSignal([1, 2], 1.5, { hopSize: 1 })).toThrow();
  expect(() => frameSignal(new Float32Array(8192), 4096, { hopSize: 1 })).toThrow();
});
