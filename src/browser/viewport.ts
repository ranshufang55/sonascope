import { assertFinite, assertInteger, assertInRange } from '../core/validation.js';
export interface ViewRange {
  start: number;
  end: number;
}
export class Viewport {
  readonly length: number;
  private start = 0;
  private end: number;
  constructor(length: number) {
    assertInteger(length, 'length');
    assertInRange(length, 0, 2 ** 24, 'length');
    this.length = length;
    this.end = length;
  }
  get range(): ViewRange {
    return { start: this.start, end: this.end };
  }
  reset(): ViewRange {
    this.start = 0;
    this.end = this.length;
    return this.range;
  }
  set(start: number, end: number): ViewRange {
    assertFinite(start, 'start');
    assertFinite(end, 'end');
    if (end < start) throw new RangeError('Range must be ordered');
    const width = Math.min(this.length, Math.max(1, end - start));
    this.start = Math.max(0, Math.min(this.length - width, start));
    this.end = this.start + width;
    return this.range;
  }
}
