import { analyzeAudio, type AudioAnalysis } from '../analysis.js';
import type { AudioBuffer } from '../core/buffer.js';
import { downmixToMono } from '../core/downmix.js';
import { buildPyramid, type Pyramid } from '../core/pyramid.js';
import { rms } from '../core/features-time.js';
import { linToDb } from '../core/spectrum.js';
import type { WindowType } from '../core/window.js';
import {
  drawWaveform,
  drawSpectrum,
  drawSpectrogram,
  Viewport,
  type PaletteName,
} from '../browser/index.js';
import { createSignal, SIGNAL_LABELS, type SignalName } from './signals.js';
import { element, setText, canvasSize } from './dom.js';

let audio: AudioBuffer = createSignal('harmonics');
let samples = downmixToMono(audio).getChannel(0);
let pyramid: Pyramid = buildPyramid(samples);
let viewport = new Viewport(samples.length);
let analysis: AudioAnalysis;
let sourceName = SIGNAL_LABELS.harmonics;
const wave = element<HTMLCanvasElement>('waveform'),
  spectrum = element<HTMLCanvasElement>('spectrum'),
  spectrogram = element<HTMLCanvasElement>('spectrogram');
const select = (id: string) => element<HTMLSelectElement>(id).value;
function status(message: string, error = false): void {
  setText('status', message);
  element('status').classList.toggle('error', error);
}
function draw(): void {
  drawWaveform(wave, samples, { ...canvasSize(wave), range: viewport.range, pyramid });
  drawSpectrum(spectrum, analysis.frames[0]?.decibels ?? [], {
    ...canvasSize(spectrum),
    floor: Number(select('db-floor')),
    color: '#a89bff',
  });
  drawSpectrogram(
    spectrogram,
    analysis.frames.map((frame) => frame.decibels),
    {
      ...canvasSize(spectrogram),
      floor: Number(select('db-floor')),
      palette: select('palette') as PaletteName,
    },
  );
  setText('range-start', `${(viewport.range.start / audio.sampleRate).toFixed(2)} s`);
  setText('range-end', `${(viewport.range.end / audio.sampleRate).toFixed(2)} s`);
}
function analyze(): void {
  const fftSize = Number(select('fft-size'));
  analysis = analyzeAudio(audio, {
    fftSize,
    hopSize: Math.max(fftSize / 4, Math.ceil(audio.numSamples / 1000)),
    window: select('window') as WindowType,
  });
  setText('duration', `${audio.getDuration().toFixed(2)} s`);
  setText('rms', `${linToDb(rms(samples)).toFixed(1)} dB`);
  const centroid =
    analysis.frames.reduce((sum, frame) => sum + frame.centroid, 0) /
    Math.max(1, analysis.frames.length);
  setText('centroid', `${(centroid / 1000).toFixed(2)} kHz`);
  setText('resolution', `${(audio.sampleRate / fftSize).toFixed(1)} Hz`);
  setText('nyquist', `${audio.sampleRate / 2000} kHz`);
  setText('spectrogram-end', `${audio.getDuration().toFixed(2)} s`);
  setText('legend-floor', select('db-floor'));
  setText('frame-count', `${analysis.frames.length} frames`);
  draw();
}
function choose(next: AudioBuffer, name: string, synthetic: boolean): void {
  audio = next;
  sourceName = name;
  samples = downmixToMono(audio).getChannel(0);
  pyramid = buildPyramid(samples);
  viewport = new Viewport(samples.length);
  setText('source-title', sourceName);
  setText(
    'source-detail',
    `${synthetic ? 'Synthetic signal' : 'Local file'} · ${audio.sampleRate / 1000} kHz · ${audio.numChannels === 1 ? 'mono' : audio.numChannels + ' channels'}`,
  );
  analyze();
  status('Ready to explore. Choose Play to listen.');
}
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-signal]'))
  button.addEventListener('click', () => {
    try {
      const name = button.dataset.signal as SignalName;
      choose(createSignal(name), SIGNAL_LABELS[name], true);
      for (const peer of document.querySelectorAll<HTMLButtonElement>('[data-signal]')) {
        peer.classList.toggle('active', peer === button);
        peer.setAttribute('aria-pressed', String(peer === button));
      }
    } catch (error) {
      status(error instanceof Error ? error.message : 'Could not load signal', true);
    }
  });
for (const id of ['fft-size', 'window'])
  element(id).addEventListener('change', () => {
    try {
      analyze();
      status('Analysis updated.');
    } catch (error) {
      status(String(error), true);
    }
  });
for (const id of ['db-floor', 'palette'])
  element(id).addEventListener('change', () => {
    setText('legend-floor', select('db-floor'));
    draw();
  });
choose(audio, sourceName, true);
