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
  zoom(factor: number, anchor = 0.5): ViewRange {
    assertFinite(factor, 'factor');
    assertInRange(anchor, 0, 1, 'anchor');
    if (factor <= 0) throw new RangeError('Zoom factor must be positive');
    const width = this.end - this.start;
    const next = Math.min(this.length, Math.max(1, width / factor));
    const point = this.start + width * anchor;
    return this.set(point - next * anchor, point + next * (1 - anchor));
  }
  sampleAtPixel(x: number, width: number): number {
    assertFinite(x, 'x');
    assertFinite(width, 'width');
    if (width <= 0) throw new RangeError('Pixel width must be positive');
    return this.start + Math.max(0, Math.min(1, x / width)) * (this.end - this.start);
  }
  pan(delta: number): ViewRange {
    assertFinite(delta, 'delta');
    return this.set(this.start + delta, this.end + delta);
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
