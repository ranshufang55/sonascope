import { describe, it, expect } from 'vitest';
import { onsetStrength, pickOnsets } from './onset.js';

describe('onset detection', () => {
  it('onsetStrength is zero for identical spectra', () => {
    const a = new Float32Array(8).fill(1);
    const out = onsetStrength([a, a, a]);
    for (const v of out) expect(v).toBeCloseTo(0, 6);
  });

  it('onsetStrength is positive when a frame has more energy', () => {
    const a = new Float32Array(8);
    const b = new Float32Array(8).fill(2);
    const out = onsetStrength([a, b]);
    expect(out[0]).toBeGreaterThan(0);
  });

  it('pickOnsets respects minDistance and minStrength', () => {
    const s = [0.1, 0.5, 0.4, 0.6, 0.3, 0.7, 0.2];
    const out = pickOnsets(s, { minStrength: 0.4, minDistance: 2 });
    expect(out[0]).toBe(1);
    expect(out[1]).toBe(3);
    expect(out[2]).toBe(5);
  });
});
