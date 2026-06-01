import assert from 'node:assert/strict';
import {
  generateSine,
  joinChannels,
  splitChannels,
  sliceAudio,
  reverseAudio,
  concatAudio,
} from '../dist/core/index.js';
const stereo = joinChannels([generateSine(8000, 0.02, 250), generateSine(8000, 0.02, 500)]);
const parts = splitChannels(stereo);
assert.equal(parts.length, 2);
const edited = concatAudio([sliceAudio(stereo, 0, 80), reverseAudio(sliceAudio(stereo, 80))]);
assert.equal(edited.numSamples, 160);
assert.deepEqual(edited.getChannel(1).slice(0, 80), stereo.getChannel(1).slice(0, 80));
console.log('Edited stereo frames:', edited.numSamples);
