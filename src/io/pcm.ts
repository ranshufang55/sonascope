import { assertByteRange } from './bytes.js';

export function readPcm8(view: DataView, offset: number): number {
  assertByteRange(view, offset, 1);
  return (view.getUint8(offset) - 128) / 128;
}
export function writePcm8(view: DataView, offset: number, value: number): void {
  assertByteRange(view, offset, 1);
  if (!Number.isFinite(value)) throw new RangeError('PCM sample must be finite');
  const integer = Math.max(-128, Math.min(127, Math.round(value * 128)));
  view.setUint8(offset, integer + 128);
}
