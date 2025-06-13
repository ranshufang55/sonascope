import type { AudioBuffer } from '../core/buffer.js';
import { isPow2 } from '../core/pow2.js';
import { assertFiniteSamples, assertInRange } from '../core/validation.js';
export type SessionState = 'idle' | 'playing' | 'paused' | 'microphone' | 'closed';
export interface AudioSessionOptions {
  fftSize?: number;
  volume?: number;
}
/** Owns its audio graph. Construction never opens a device or audio context. */
export class AudioSession {
  private context?: AudioContext;
  private analyser?: AnalyserNode;
  private gain?: GainNode;
  private source?: AudioBufferSourceNode | MediaStreamAudioSourceNode;
  private stream?: MediaStream;
  private generation = 0;
  private status: SessionState = 'idle';
  private readonly fftSize: number;
  private volume: number;
  constructor(options: AudioSessionOptions = {}) {
    this.fftSize = options.fftSize ?? 2048;
    if (!isPow2(this.fftSize) || this.fftSize < 32 || this.fftSize > 32768)
      throw new RangeError('Web Audio FFT size must be a power of two from 32 to 32768');
    this.volume = options.volume ?? 0.2;
    assertInRange(this.volume, 0, 1, 'volume');
  }
  get state(): SessionState {
    return this.status;
  }
  get sampleRate(): number | undefined {
    return this.context?.sampleRate;
  }
  private ensureContext(): AudioContext {
    if (this.status === 'closed') throw new Error('Session is closed');
    if (!this.context) {
      if (typeof globalThis.AudioContext !== 'function')
        throw new Error('Web Audio is unavailable');
      this.context = new AudioContext();
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = this.fftSize;
      this.gain = this.context.createGain();
      this.gain.gain.value = this.volume;
      this.analyser.connect(this.gain);
      this.gain.connect(this.context.destination);
    }
    return this.context;
  }
  stop(): void {
    this.generation++;
    if (this.source) {
      if ('stop' in this.source) {
        this.source.onended = null;
        try {
          this.source.stop();
        } catch {
          /* already ended */
        }
      }
      this.source.disconnect();
      this.source = undefined;
    }
    for (const track of this.stream?.getTracks() ?? []) track.stop();
    this.stream = undefined;
    if (this.status !== 'closed') this.status = 'idle';
  }
  async play(audio: AudioBuffer): Promise<void> {
    if (audio.numSamples === 0) throw new RangeError('Cannot play empty audio');
    for (const channel of audio.data) assertFiniteSamples(channel);
    const context = this.ensureContext();
    this.stop();
    const generation = this.generation;
    await context.resume();
    if (generation !== this.generation) return;
    const buffer = context.createBuffer(audio.numChannels, audio.numSamples, audio.sampleRate);
    for (let c = 0; c < audio.numChannels; c++)
      buffer.copyToChannel(new Float32Array(audio.getChannel(c)), c);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.analyser!);
    this.gain!.gain.value = this.volume;
    this.source = source;
    source.onended = () => {
      if (this.source === source) this.stop();
    };
    source.start();
    this.status = 'playing';
  }
  async pause(): Promise<void> {
    if (this.status !== 'playing') return;
    const generation = this.generation;
    await this.context!.suspend();
    if (generation === this.generation) this.status = 'paused';
  }
  async resume(): Promise<void> {
    if (this.status !== 'paused') return;
    const generation = this.generation;
    await this.context!.resume();
    if (generation === this.generation) this.status = 'playing';
  }
  async close(): Promise<void> {
    if (this.status === 'closed') return;
    this.stop();
    this.status = 'closed';
    this.analyser?.disconnect();
    this.gain?.disconnect();
    await this.context?.close();
  }
}
