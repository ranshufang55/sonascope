import { AudioBuffer } from '../core/buffer.js';
import { generateWhiteNoise } from '../core/generators.js';
import { generateLinearChirp, generateImpulseTrain } from '../core/generators-extra.js';
export type SignalName = 'harmonics' | 'chirp' | 'pulse' | 'noise';
export const SIGNAL_LABELS: Record<SignalName, string> = {
  harmonics: 'Harmonic study',
  chirp: 'Rising frequency sweep',
  pulse: 'Pulse train',
  noise: 'Seeded white noise',
};
export function createSignal(name: SignalName): AudioBuffer {
  const rate = 48000,
    duration = 3;
  if (name === 'chirp') return generateLinearChirp(rate, duration, 120, 8000, { amplitude: 0.75 });
  if (name === 'pulse') return generateImpulseTrain(rate, duration, 480, 0.8);
  if (name === 'noise') return generateWhiteNoise(rate, duration, { amplitude: 0.4, seed: 42 });
  if (name !== 'harmonics') throw new RangeError('Unknown synthetic signal');
  const samples = Float32Array.from({ length: rate * duration }, (_, i) => {
    const t = i / rate,
      fade = Math.min(1, t / 0.05, (duration - t) / 0.08);
    return (
      fade *
      (0.45 * Math.sin(2 * Math.PI * 220 * t) +
        0.22 * Math.sin(2 * Math.PI * 440 * t) +
        0.12 * Math.sin(2 * Math.PI * 880 * t)) *
      (0.78 + 0.22 * Math.sin(2 * Math.PI * 1.5 * t))
    );
  });
  return new AudioBuffer(rate, 1, samples.length, [samples]);
}
