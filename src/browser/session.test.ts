import { afterEach, it, expect, vi } from 'vitest';
import { AudioSession } from './session.js';
import { AudioBuffer } from '../core/buffer.js';
const contexts: FakeContext[] = [];
class FakeNode {
  gain = { value: 0 };
  fftSize = 0;
  buffer: unknown;
  onended: (() => void) | null = null;
  connect = vi.fn();
  disconnect = vi.fn();
  stop = vi.fn();
  start = vi.fn();
  getFloatTimeDomainData = (out: Float32Array) => out.fill(0.25);
  getFloatFrequencyData = (out: Float32Array) => out.fill(-20);
}
class FakeContext {
  sampleRate = 48000;
  destination = {};
  nodes: FakeNode[] = [];
  resume = vi.fn(async () => {});
  suspend = vi.fn(async () => {});
  close = vi.fn(async () => {});
  constructor() {
    contexts.push(this);
  }
  node() {
    const node = new FakeNode();
    this.nodes.push(node);
    return node;
  }
  createAnalyser = () => this.node();
  createGain = () => this.node();
  createBufferSource = () => this.node();
  createMediaStreamSource = () => this.node();
  createBuffer = () => ({ copyToChannel: vi.fn() });
}
function setup() {
  contexts.length = 0;
  vi.stubGlobal('AudioContext', FakeContext);
  return new AudioSession({ fftSize: 64 });
}
afterEach(() => vi.unstubAllGlobals());
it('creates audio resources only when playback begins and cleans them exactly once', async () => {
  const session = setup();
  expect(contexts).toHaveLength(0);
  await session.play(new AudioBuffer(8000, 1, 8));
  expect(session.state).toBe('playing');
  const source = contexts[0]!.nodes[2]!;
  session.stop();
  session.stop();
  expect(source.stop).toHaveBeenCalledTimes(1);
  expect(source.disconnect).toHaveBeenCalledTimes(1);
  await session.close();
  await session.close();
  expect(contexts[0]!.close).toHaveBeenCalledTimes(1);
  expect(session.state).toBe('closed');
  await expect(session.play(new AudioBuffer(8000, 1, 8))).rejects.toThrow('closed');
});
it('pauses and resumes without constructing a second source', async () => {
  const session = setup();
  await session.play(new AudioBuffer(8000, 1, 8));
  await session.pause();
  expect(session.state).toBe('paused');
  await session.resume();
  expect(session.state).toBe('playing');
  expect(contexts[0]!.nodes).toHaveLength(3);
  expect(contexts[0]!.suspend).toHaveBeenCalledTimes(1);
  session.stop();
  await session.resume();
  expect(session.state).toBe('idle');
  await session.close();
});
