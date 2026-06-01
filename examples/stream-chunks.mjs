import assert from 'node:assert/strict';
import { StreamingAnalyzer, generateSine } from '../dist/core/index.js';
const signal = generateSine(16000, 0.1, 500).getChannel(0);
const settings = { sampleRate: 16000, frameSize: 256, hopSize: 128, retainFrames: 0 };
const whole = new StreamingAnalyzer(settings).push(signal);
const analyzer = new StreamingAnalyzer(settings),
  chunked = [];
for (let offset = 0; offset < signal.length; offset += 73)
  chunked.push(...analyzer.push(signal.subarray(offset, offset + 73)));
assert.deepEqual(chunked, whole);
assert.equal(analyzer.framesOut().length, 0);
console.log('Complete frames:', chunked.length);
