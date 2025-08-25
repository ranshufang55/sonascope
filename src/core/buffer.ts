// AudioBuffer: the canonical in-memory audio representation used throughout
// the library. Channels are stored as Float32Array views in a fixed order
// (channel 0 first). The number of samples per channel is identical across
// channels (no padding holes).
//
// Construction takes a defensive copy of the channel list so that later
// mutations of the caller's array do not break the buffer's invariants.
// The internal channel data itself is mutable (sample views) so callers
// can transform samples in place without rebuilding the buffer.

import { assertSampleRate, MAX_SAMPLES_PER_BUFFER } from './sample-rate.js';
import { assertFiniteSamples } from './validation.js';

export type ChannelData = Float32Array;
export type SampleRate = number;
export type NumChannels = number;

export interface AudioBufferShape {
  readonly sampleRate: SampleRate;
  readonly numChannels: NumChannels;
  readonly numSamples: number;
  readonly length: number;
}

export class AudioBuffer implements AudioBufferShape {
  readonly sampleRate: SampleRate;
  readonly numChannels: NumChannels;
  readonly numSamples: number;
  readonly length: number;
  readonly data: ReadonlyArray<ChannelData>;

  constructor(
    sampleRate: SampleRate,
    numChannels: NumChannels,
    numSamples: number,
    data?: ChannelData[],
  ) {
    if (!Number.isFinite(sampleRate) || sampleRate <= 0) {
      throw new RangeError(`AudioBuffer: sampleRate must be > 0, got ${sampleRate}`);
    }
    if (!Number.isInteger(numChannels) || numChannels < 1) {
      throw new RangeError(
        `AudioBuffer: numChannels must be a positive integer, got ${numChannels}`,
      );
    }
    if (!Number.isInteger(numSamples) || numSamples < 0) {
      throw new RangeError(
        `AudioBuffer: numSamples must be a non-negative integer, got ${numSamples}`,
      );
    }
    assertSampleRate(sampleRate);
    if (numChannels > 32 || numSamples * numChannels > MAX_SAMPLES_PER_BUFFER)
      throw new RangeError('AudioBuffer exceeds channel or aggregate sample limit');
    this.sampleRate = sampleRate;
    this.numChannels = numChannels;
    this.numSamples = numSamples;
    this.length = numSamples;
    if (data) {
      if (data.length !== numChannels) {
        throw new RangeError(
          `AudioBuffer: data length ${data.length} does not match numChannels ${numChannels}`,
        );
      }
      const channels: ChannelData[] = new Array(numChannels);
      for (let c = 0; c < numChannels; c++) {
        const channel = data[c];
        if (!channel) {
          throw new RangeError(`AudioBuffer: missing channel data for index ${c}`);
        }
        if (channel.length !== numSamples) {
          throw new RangeError(
            `AudioBuffer: channel ${c} length ${channel.length} does not match numSamples ${numSamples}`,
          );
        }
        assertFiniteSamples(channel, 'channel');
        const copy = new Float32Array(numSamples);
        copy.set(channel);
        channels[c] = copy;
      }
      this.data = Object.freeze(channels);
    } else {
      const channels: ChannelData[] = new Array(numChannels);
      for (let c = 0; c < numChannels; c++) {
        channels[c] = new Float32Array(numSamples);
      }
      this.data = Object.freeze(channels);
    }
  }

  getChannel(channel: number): ChannelData {
    if (!Number.isInteger(channel) || channel < 0 || channel >= this.numChannels)
      throw new RangeError('Channel index out of range');
    const ch = this.data[channel];
    if (!ch) {
      throw new RangeError(
        `AudioBuffer: channel index ${channel} out of range (0..${this.numChannels - 1})`,
      );
    }
    return ch;
  }

  getNumberOfChannels(): NumChannels {
    return this.numChannels;
  }

  getNumberOfSamples(): number {
    return this.numSamples;
  }

  getDuration(): number {
    return this.numSamples / this.sampleRate;
  }

  getSampleRate(): SampleRate {
    return this.sampleRate;
  }
}
