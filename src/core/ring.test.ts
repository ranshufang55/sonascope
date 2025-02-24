import { describe, it, expect } from 'vitest';
import { RingBuffer } from './ring.js';

describe('RingBuffer', () => {
  it('starts empty with the requested capacity', () => {
    const r = new RingBuffer(8);
    expect(r.capacity).toBe(8);
    expect(r.size()).toBe(0);
    expect(r.isEmpty()).toBe(true);
  });

  it('push then snapshot returns FIFO order', () => {
    const r = new RingBuffer(4);
    r.push(1);
    r.push(2);
    r.push(3);
    expect(Array.from(r.toArray())).toEqual([1, 2, 3]);
  });

  it('drops the oldest sample when full', () => {
    const r = new RingBuffer(3);
    r.push(1);
    r.push(2);
    r.push(3);
    r.push(4);
    expect(r.isFull()).toBe(true);
    expect(Array.from(r.toArray())).toEqual([2, 3, 4]);
  });

  it('toZeroPadded pads after the live samples', () => {
    const r = new RingBuffer(6);
    r.push(1);
    r.push(2);
    const out = r.toZeroPadded();
    expect(out.length).toBe(6);
    expect(out[0]).toBe(1);
    expect(out[1]).toBe(2);
    expect(out[5]).toBe(0);
  });

  it('clear resets the buffer', () => {
    const r = new RingBuffer(4);
    r.push(1);
    r.push(2);
    r.clear();
    expect(r.size()).toBe(0);
  });

  it('pushMany accepts an array of values', () => {
    const r = new RingBuffer(4);
    r.pushMany([1, 2, 3]);
    expect(Array.from(r.toArray())).toEqual([1, 2, 3]);
  });

  it('rejects non-finite values', () => {
    const r = new RingBuffer(2);
    expect(() => r.push(NaN)).toThrow(/finite/);
    expect(() => r.push(Infinity)).toThrow(/finite/);
  });
});

it('rejects fractional and unbounded ring capacities', () => {
  for (const capacity of [0, -1, 1.5, NaN, Infinity, 2 ** 24 + 1]) {
    expect(() => new RingBuffer(capacity)).toThrow();
  }
  const ring = new RingBuffer(1);
  ring.pushMany([1, 2, 3]);
  expect(Array.from(ring.toArray())).toEqual([3]);
  expect(ring.isFull()).toBe(true);
});

it('leaves a ring unchanged after invalid bulk input', () => {
  const ring = new RingBuffer(3);
  ring.pushMany([1, 2]);
  for (const input of [
    [3, NaN],
    [3, Infinity],
    [3, 1e40],
  ]) {
    expect(() => ring.pushMany(input)).toThrow();
    expect(Array.from(ring.toArray())).toEqual([1, 2]);
  }
  expect(() => ring.push(1e40)).toThrow();
  expect(Array.from(ring.toArray())).toEqual([1, 2]);
});
