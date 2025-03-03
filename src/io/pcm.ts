import { assertByteRange } from './bytes.js';

export function readPcm8(view: DataView, offset: number): number {
  assertByteRange(view, offset, 1);
  return (view.getUint8(offset) - 128) / 128;
}
