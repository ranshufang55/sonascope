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
export function readPcm16(view: DataView, offset: number): number {
  assertByteRange(view, offset, 2);
  return view.getInt16(offset, true) / 32768;
}
export function writePcm16(view: DataView, offset: number, value: number): void {
  assertByteRange(view, offset, 2);
  if (!Number.isFinite(value)) throw new RangeError('PCM sample must be finite');
  const integer = Math.max(-32768, Math.min(32767, Math.round(value * 32768)));
  view.setInt16(offset, integer, true);
}
