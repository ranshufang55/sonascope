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
export function concatAudio(parts: readonly AudioBuffer[]): AudioBuffer {
  if (parts.length === 0) throw new RangeError('At least one audio buffer is required');
  const first = parts[0]!;
  for (const part of parts)
    if (part.sampleRate !== first.sampleRate || part.numChannels !== first.numChannels)
      throw new RangeError('Audio format mismatch');
  const total = parts.reduce((sum, part) => sum + part.numSamples, 0),
    out = new AudioBuffer(first.sampleRate, first.numChannels, total);
  let offset = 0;
  for (const part of parts) {
    for (let c = 0; c < out.numChannels; c++) out.getChannel(c).set(part.getChannel(c), offset);
    offset += part.numSamples;
  }
  return out;
}
export function reverseAudio(audio: AudioBuffer): AudioBuffer {
  return new AudioBuffer(
    audio.sampleRate,
    audio.numChannels,
    audio.numSamples,
    audio.data.map((channel) => new Float32Array(channel).reverse()),
  );
}
