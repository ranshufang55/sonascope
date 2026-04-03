import { it, expect } from 'vitest';
import * as api from '../browser/index.js';
it('keeps the complete browser export contract explicit', () => {
  expect(Object.keys(api).sort()).toEqual([
    'AudioSession',
    'Viewport',
    'drawSpectrogram',
    'drawSpectrum',
    'drawWaveform',
    'makePalette',
    'normalizeDb',
    'prepareCanvas',
    'spectrogramPixels',
    'spectrumColumns',
    'waveformColumns',
  ]);
});
