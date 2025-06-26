import { it, expect } from 'vitest';
import { createSignal, SIGNAL_LABELS } from './signals.js';
it('pins the complete synthetic source catalog and deterministic samples', () => {
  expect(Object.keys(SIGNAL_LABELS).sort()).toEqual(['chirp', 'harmonics', 'noise', 'pulse']);
  for (const name of ['chirp', 'harmonics', 'noise', 'pulse'] as const) {
    const signal = createSignal(name);
    expect(signal.getDuration()).toBe(3);
    expect(signal.sampleRate).toBe(48000);
    expect(signal.getChannel(0).every((v) => Number.isFinite(v) && Math.abs(v) <= 1)).toBe(true);
    expect(signal.getChannel(0)).toEqual(createSignal(name).getChannel(0));
  }
});
