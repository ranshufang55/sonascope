export type ByteSource = ArrayBuffer | ArrayBufferView;

export function asDataView(input: ByteSource): DataView {
  if (ArrayBuffer.isView(input))
    return new DataView(input.buffer, input.byteOffset, input.byteLength);
  if (input instanceof ArrayBuffer) return new DataView(input);
  throw new TypeError('Expected an ArrayBuffer or a typed byte view');
}

export function assertByteRange(view: DataView, offset: number, size: number): void {
  if (
    !Number.isSafeInteger(offset) ||
    offset < 0 ||
    !Number.isSafeInteger(size) ||
    size < 0 ||
    offset + size > view.byteLength
  ) {
    throw new RangeError('Byte range is outside the supplied view');
  }
}

export function readFourCC(view: DataView, offset: number): string {
  assertByteRange(view, offset, 4);
  return String.fromCharCode(...Array.from({ length: 4 }, (_, i) => view.getUint8(offset + i)));
}

export function writeFourCC(view: DataView, offset: number, value: string): void {
  assertByteRange(view, offset, 4);
  if (value.length !== 4 || [...value].some((c) => c.charCodeAt(0) > 127))
    throw new RangeError('FourCC must contain four ASCII characters');
  for (let i = 0; i < 4; i++) view.setUint8(offset + i, value.charCodeAt(i));
}
