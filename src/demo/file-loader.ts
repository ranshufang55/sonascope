import { AudioBuffer } from '../core/buffer.js';
import { decodeWav } from '../io/wav.js';
export async function loadAudioFile(file: File): Promise<AudioBuffer> {
  if (!Number.isSafeInteger(file.size) || file.size < 0) throw new RangeError('Invalid file size');
  if (file.size > 20 * 1024 * 1024) throw new RangeError('Choose a file smaller than 20 MB');
  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > 20 * 1024 * 1024) throw new RangeError('Choose a file smaller than 20 MB');
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
    await mediaDuration(file);
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

/** Inspect container duration before allocating fully decoded compressed audio. */
async function mediaDuration(file: File): Promise<number> {
  if (typeof Audio !== 'function') throw new Error('Compressed audio decoding needs a browser');
  return new Promise((resolve, reject) => {
    const media = new Audio(),
      url = URL.createObjectURL(file);
    const cleanup = () => {
      clearTimeout(timer);
      media.onloadedmetadata = null;
      media.onerror = null;
      media.removeAttribute('src');
      media.load();
      URL.revokeObjectURL(url);
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Audio metadata timed out; try a WAV file'));
    }, 10000);
    media.preload = 'metadata';
    media.onloadedmetadata = () => {
      const duration = media.duration;
      cleanup();
      if (!Number.isFinite(duration) || duration <= 0 || duration > 30)
        reject(new RangeError('Choose a nonempty recording of 30 seconds or less'));
      else resolve(duration);
    };
    media.onerror = () => {
      cleanup();
      reject(new Error('This audio format could not be decoded; try a WAV file'));
    };
    media.src = url;
  });
}
