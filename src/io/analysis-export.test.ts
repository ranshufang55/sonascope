import { it, expect } from 'vitest';
import { serializeAnalysis } from './analysis-export.js';
import { analyzeAudio } from '../analysis.js';
import { AudioBuffer } from '../core/buffer.js';
it('pins every serialized root and frame field', () => {
  const analysis = analyzeAudio(new AudioBuffer(8, 1, 4, [new Float32Array([1, 0, 0, 0])]), {
    fftSize: 4,
    hopSize: 4,
    window: 'rectangular',
  });
  const data = JSON.parse(serializeAnalysis(analysis));
  expect(Object.keys(data).sort()).toEqual([
    'channels',
    'duration',
    'fftSize',
    'frames',
    'frequencies',
    'hopSize',
    'numSamples',
    'sampleRate',
    'schemaVersion',
    'window',
  ]);
  expect(Object.keys(data.frames[0]).sort()).toEqual([
    'centroid',
    'decibels',
    'flatness',
    'index',
    'magnitude',
    'peak',
    'rms',
    'rolloff',
    'sampleCount',
    'startSample',
    'timeSeconds',
  ]);
  expect(data.frequencies).toEqual([0, 2, 4]);
  expect(data.frames[0].magnitude).toEqual([0.25, 0.5, 0.25]);
  expect(serializeAnalysis(analysis)).toBe(serializeAnalysis(analysis));
});

it('exports stable frame columns and rejects corrupt numeric cells', async () => {
  const { analysisToCsv } = await import('./analysis-export.js');
  const analysis = analyzeAudio(new AudioBuffer(8, 1, 4), {
    fftSize: 4,
    hopSize: 4,
    window: 'rectangular',
  });
  expect(analysisToCsv(analysis)).toBe(
    'index,startSample,sampleCount,timeSeconds,rms,peak,centroid,rolloff,flatness\n0,0,4,0,0,0,0,0,0\n',
  );
  analysis.frames[0]!.rms = NaN;
  expect(() => analysisToCsv(analysis)).toThrow();
});
