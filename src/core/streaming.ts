// Streaming feature analyzer. A fixed-size analysis window is slid
// over an incoming sample stream; each new frame produces the
// requested feature vector. The output is equivalent to a batched
// framing of the same data.

import { assertPositive } from './validation.js';
import { RingBuffer } from './ring.js';
import { rms, zeroCrossingRate } from './features-time.js';
import { spectralCentroid, spectralFlatness, spectralRolloff } from './features-spectral.js';
import { fft } from './fft.js';
import { magnitude } from './spectrum.js';

export interface StreamingFrame {
  rms: number;
  zcr: number;
  centroid: number;
  rolloff: number;
  flatness: number;
}

export interface StreamingOptions {
  sampleRate: number;
  frameSize: number;
  hopSize: number;
}

export class StreamingAnalyzer {
  readonly sampleRate: number;
  readonly frameSize: number;
  readonly hopSize: number;
  private readonly buffer: RingBuffer;
  private sinceFrame = 0;
  private readonly frames: StreamingFrame[] = [];

  constructor(options: StreamingOptions) {
    assertPositive(options.sampleRate, 'sampleRate');
    assertPositive(options.frameSize, 'frameSize');
    assertPositive(options.hopSize, 'hopSize');
    this.sampleRate = options.sampleRate;
    this.frameSize = options.frameSize;
    this.hopSize = options.hopSize;
    this.buffer = new RingBuffer(this.frameSize);
  }

  push(samples: ArrayLike<number>): StreamingFrame[] {
    const out: StreamingFrame[] = [];
    for (let i = 0; i < samples.length; i++) {
      this.buffer.push(samples[i] ?? 0);
      this.sinceFrame++;
      if (this.sinceFrame >= this.hopSize && this.buffer.size() === this.frameSize) {
        const frame = this.analyse(this.buffer.toArray());
        out.push(frame);
        this.frames.push(frame);
        this.sinceFrame = 0;
      }
    }
    return out;
  }

  framesOut(): readonly StreamingFrame[] {
    return this.frames;
  }

  reset(): void {
    this.buffer.clear();
    this.sinceFrame = 0;
    this.frames.length = 0;
  }

  private analyse(window: Float32Array): StreamingFrame {
    const N = this.frameSize;
    const mag = magnitude(fft(window));
    return {
      rms: rms(window),
      zcr: zeroCrossingRate(window, this.sampleRate),
      centroid: spectralCentroid(mag, N, this.sampleRate),
      rolloff: spectralRolloff(mag, N, this.sampleRate, 0.85),
      flatness: spectralFlatness(mag),
    };
  }
}
