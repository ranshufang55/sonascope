import assert from 'node:assert/strict';
import { generateSine, analyzeAudio, serializeAnalysis, analysisToCsv } from '../dist/index.js';
const result = analyzeAudio(generateSine(16000, 0.05, 1000), { fftSize: 256, hopSize: 128 });
const json = JSON.parse(serializeAnalysis(result));
const csv = analysisToCsv(result);
assert.equal(json.schemaVersion, 1);
assert.equal(json.frames.length, result.frames.length);
assert.equal(csv.trim().split('\n').length, result.frames.length + 1);
console.log('JSON bytes:', JSON.stringify(json).length, 'CSV frames:', json.frames.length);
