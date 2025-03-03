import { asDataView, readFourCC, type ByteSource } from './bytes.js';
export interface RiffChunk {
  id: string;
  offset: number;
  length: number;
}
export const MAX_WAV_BYTES = 128 * 1024 * 1024;

export function scanRiff(input: ByteSource): RiffChunk[] {
  const view = asDataView(input);
  if (view.byteLength < 12 || view.byteLength > MAX_WAV_BYTES)
    throw new RangeError('Invalid or oversized RIFF file');
  if (readFourCC(view, 0) !== 'RIFF' || readFourCC(view, 8) !== 'WAVE')
    throw new RangeError('Expected little-endian RIFF/WAVE');
  if (view.getUint32(4, true) + 8 !== view.byteLength)
    throw new RangeError('RIFF length does not match the supplied bytes');
  const chunks: RiffChunk[] = [];
  let cursor = 12;
  while (cursor < view.byteLength) {
    if (cursor + 8 > view.byteLength) throw new RangeError('Truncated RIFF chunk header');
    const id = readFourCC(view, cursor);
    const length = view.getUint32(cursor + 4, true);
    const offset = cursor + 8;
    const end = offset + length + (length % 2);
    if (end > view.byteLength) throw new RangeError('Truncated RIFF chunk payload');
    chunks.push({ id, offset, length });
    if (chunks.length > 4096) throw new RangeError('Too many RIFF chunks');
    cursor = end;
  }
  return chunks;
}
