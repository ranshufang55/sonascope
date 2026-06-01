import assert from 'node:assert/strict';
import { fft, ifft, energy } from '../dist/core/index.js';
const signal = Float32Array.from({ length: 64 }, (_, i) => Math.sin(i / 3) + Math.cos(i / 7));
const frequency = fft(signal),
  restored = ifft(frequency);
for (let i = 0; i < signal.length; i++) assert.ok(Math.abs(signal[i] - restored.re[i]) < 1e-5);
const frequencyEnergy =
  frequency.re.reduce((s, v, i) => s + v * v + frequency.im[i] ** 2, 0) / signal.length;
assert.ok(Math.abs(frequencyEnergy - energy(signal)) < 1e-4);
console.log('Time and frequency energy agree:', frequencyEnergy);
