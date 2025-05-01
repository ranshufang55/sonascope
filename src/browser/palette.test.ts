import { it, expect } from 'vitest';
import { makePalette } from './palette.js';
it('pins color endpoints and opacity across every palette entry', () => {
  const expected = {
    ocean: [
      [8, 15, 29],
      [236, 255, 227],
    ],
    ember: [
      [13, 10, 29],
      [255, 248, 204],
    ],
    mono: [
      [0, 0, 0],
      [255, 255, 255],
    ],
  };
  for (const name of ['ocean', 'ember', 'mono'] as const) {
    const table = makePalette(name);
    expect(table).toHaveLength(1024);
    expect(Array.from(table.slice(0, 3))).toEqual(expected[name][0]);
    expect(Array.from(table.slice(-4, -1))).toEqual(expected[name][1]);
    expect(
      Array.from(table)
        .filter((_, i) => i % 4 === 3)
        .every((v) => v === 255),
    ).toBe(true);
    table[0] = 255;
    expect(makePalette(name)[0]).toBe(expected[name][0]![0]);
  }
});
