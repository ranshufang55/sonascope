// Ring buffer for streaming analysis. Fixed-capacity, Float32Array
// backed. Push appends a value, dropping the oldest when full.

import { assertFiniteSamples, assertInteger, assertPositive } from './validation.js';
import { MAX_SAMPLES_PER_BUFFER } from './sample-rate.js';

export class RingBuffer {
  readonly capacity: number;
  private readonly data: Float32Array;
  private head = 0;
  private tail = 0;
  private count = 0;

  constructor(capacity: number) {
    assertPositive(capacity, 'capacity');
    assertInteger(capacity, 'capacity');
    if (capacity > MAX_SAMPLES_PER_BUFFER)
      throw new RangeError('ring capacity exceeds sample limit');
    this.capacity = capacity;
    this.data = new Float32Array(capacity);
  }

  size(): number {
    return this.count;
  }

  isEmpty(): boolean {
    return this.count === 0;
  }

  isFull(): boolean {
    return this.count === this.capacity;
  }

  clear(): void {
    this.head = 0;
    this.tail = 0;
    this.count = 0;
  }

  push(value: number): void {
    if (!Number.isFinite(value) || !Number.isFinite(Math.fround(value))) {
      throw new RangeError(`RingBuffer.push: value must be finite, got ${value}`);
    }
    if (this.count < this.capacity) {
      this.data[this.tail] = value;
      this.tail = (this.tail + 1) % this.capacity;
      this.count++;
    } else {
      this.data[this.tail] = value;
      this.tail = (this.tail + 1) % this.capacity;
      this.head = (this.head + 1) % this.capacity;
    }
  }

  pushMany(values: ArrayLike<number>): void {
    assertFiniteSamples(values);
    for (let i = 0; i < values.length; i++) {
      if (!Number.isFinite(Math.fround(values[i]!)))
        throw new RangeError('sample exceeds Float32 range');
    }
    for (let i = 0; i < values.length; i++) this.push(values[i] ?? 0);
  }

  peek(): number | undefined {
    if (this.count === 0) return undefined;
    return this.data[this.head];
  }

  toArray(): Float32Array {
    const out = new Float32Array(this.count);
    for (let i = 0; i < this.count; i++) {
      out[i] = this.data[(this.head + i) % this.capacity] ?? 0;
    }
    return out;
  }

  toZeroPadded(): Float32Array {
    const out = new Float32Array(this.capacity);
    for (let i = 0; i < this.count; i++) {
      out[i] = this.data[(this.head + i) % this.capacity] ?? 0;
    }
    return out;
  }
}
