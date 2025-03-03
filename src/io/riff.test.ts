import { it, expect } from 'vitest';
import { scanRiff } from './riff.js';
import { writeFourCC } from './bytes.js';
it('accounts for odd-size chunk padding without reading outside the RIFF', () => {
  const view = new DataView(new ArrayBuffer(22));
  writeFourCC(view, 0, 'RIFF');
  view.setUint32(4, 14, true);
  writeFourCC(view, 8, 'WAVE');
  writeFourCC(view, 12, 'JUNK');
  view.setUint32(16, 1, true);
  expect(scanRiff(view)).toEqual([{ id: 'JUNK', offset: 20, length: 1 }]);
  view.setUint32(16, 3, true);
  expect(() => scanRiff(view)).toThrow(/Truncated/);
});
