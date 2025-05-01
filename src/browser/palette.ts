export type PaletteName = 'ocean' | 'ember' | 'mono';
const STOPS: Record<PaletteName, readonly (readonly number[])[]> = {
  ocean: [
    [8, 15, 29],
    [18, 52, 86],
    [16, 135, 157],
    [95, 232, 213],
    [236, 255, 227],
  ],
  ember: [
    [13, 10, 29],
    [83, 27, 95],
    [190, 52, 77],
    [251, 147, 69],
    [255, 248, 204],
  ],
  mono: [
    [0, 0, 0],
    [255, 255, 255],
  ],
};
/** Independent 256-entry RGBA color table, from quiet to loud. */
export function makePalette(name: PaletteName = 'ocean'): Uint8ClampedArray {
  if (!Object.hasOwn(STOPS, name)) throw new RangeError('Unknown palette');
  const stops = STOPS[name];
  const out = new Uint8ClampedArray(1024);
  for (let i = 0; i < 256; i++) {
    const position = (i / 255) * (stops.length - 1);
    const left = Math.min(stops.length - 2, Math.floor(position));
    const fraction = position - left;
    for (let c = 0; c < 3; c++)
      out[i * 4 + c] = stops[left]![c]! * (1 - fraction) + stops[left + 1]![c]! * fraction;
    out[i * 4 + 3] = 255;
  }
  return out;
}
