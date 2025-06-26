import { AudioBuffer } from '../core/buffer.js';
import { decodeWav } from '../io/wav.js';
export async function loadAudioFile(file: File): Promise<AudioBuffer> {
  if (file.size > 20 * 1024 * 1024) throw new RangeError('Choose a file smaller than 20 MB');
  const bytes = await file.arrayBuffer();
  let audio: AudioBuffer;
  const prefix = new Uint8Array(bytes, 0, Math.min(12, bytes.byteLength));
  if (
    prefix.length >= 12 &&
    String.fromCharCode(...prefix.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...prefix.slice(8, 12)) === 'WAVE'
  )
    audio = decodeWav(bytes);
  else {
    if (typeof OfflineAudioContext !== 'function')
      throw new Error('This browser cannot decode compressed audio; try a WAV file');
    const context = new OfflineAudioContext(1, 1, 48000);
    const decoded = await context.decodeAudioData(bytes);
    if (decoded.duration > 30) throw new RangeError('Choose a recording of 30 seconds or less');
    audio = new AudioBuffer(
      decoded.sampleRate,
      decoded.numberOfChannels,
      decoded.length,
      Array.from({ length: decoded.numberOfChannels }, (_, c) => decoded.getChannelData(c)),
    );
  }
  if (audio.numSamples === 0) throw new RangeError('This recording is empty');
  if (audio.getDuration() > 30) throw new RangeError('Choose a recording of 30 seconds or less');
  return audio;
}
