import { AudioBuffer } from './buffer.js';
import { assertInteger, assertInRange } from './validation.js';
export function sliceAudio(audio: AudioBuffer, start: number, end = audio.numSamples): AudioBuffer {
  assertInteger(start, 'start');
  assertInteger(end, 'end');
  assertInRange(start, 0, audio.numSamples, 'start');
  assertInRange(end, start, audio.numSamples, 'end');
  return new AudioBuffer(
    audio.sampleRate,
    audio.numChannels,
    end - start,
    audio.data.map((channel) => channel.subarray(start, end)),
  );
}
