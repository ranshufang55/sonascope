import assert from 'node:assert/strict';
import { generateSine, analyzeAudio } from '../dist/index.js';
const audio = generateSine(8192, 0.125, 512, { amplitude: 0.5 });
const result = analyzeAudio(audio, { fftSize: 1024, hopSize: 1024, window: 'rectangular' });
assert.equal(result.frames.length, 1);
assert.ok(Math.abs(result.frames[0].magnitude[64] - 0.5) < 1e-5);
console.log('Tone amplitude:', result.frames[0].magnitude[64]);
