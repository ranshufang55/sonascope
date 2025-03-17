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
export function readPcm24(view: DataView, offset: number): number {
  assertByteRange(view, offset, 3);
  return (
    (((view.getUint8(offset) |
      (view.getUint8(offset + 1) << 8) |
      (view.getUint8(offset + 2) << 16)) <<
      8) >>
      8) /
    8388608
  );
}
export function writePcm24(view: DataView, offset: number, value: number): void {
  assertByteRange(view, offset, 3);
  if (!Number.isFinite(value)) throw new RangeError('PCM sample must be finite');
  const integer = Math.max(-8388608, Math.min(8388607, Math.round(value * 8388608)));
  view.setUint8(offset, integer & 255);
  view.setUint8(offset + 1, (integer >> 8) & 255);
  view.setUint8(offset + 2, (integer >> 16) & 255);
}
export function readPcm32(view: DataView, offset: number): number {
  assertByteRange(view, offset, 4);
  return view.getInt32(offset, true) / 2147483648;
}
