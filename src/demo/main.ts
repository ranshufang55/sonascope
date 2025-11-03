import { serializeAnalysis, analysisToCsv } from '../io/analysis-export.js';
import { encodeWav } from '../io/wav.js';
import { loadAudioFile } from './file-loader.js';
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
  AudioSession,
  type PaletteName,
} from '../browser/index.js';
import { createSignal, SIGNAL_LABELS, type SignalName } from './signals.js';
import { element, setText, canvasSize, download } from './dom.js';

const session = new AudioSession();
let audio: AudioBuffer = createSignal('harmonics');
let samples = downmixToMono(audio).getChannel(0);
let pyramid: Pyramid = buildPyramid(samples);
let viewport = new Viewport(samples.length);
let analysis: AudioAnalysis;
let loadGeneration = 0;
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
      frequencyScale: select('frequency-scale') as 'linear' | 'log',
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
  session.stop();
  element('microphone').classList.remove('active');
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
      loadGeneration++;
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
for (const id of ['db-floor', 'palette', 'frequency-scale'])
  element(id).addEventListener('change', () => {
    setText('legend-floor', select('db-floor'));
    draw();
  });
choose(audio, sourceName, true);

for (const [id, action] of [
  ['zoom-in', () => viewport.zoom(2)],
  ['zoom-out', () => viewport.zoom(0.5)],
  ['pan-left', () => viewport.pan(-(viewport.range.end - viewport.range.start) / 4)],
  ['pan-right', () => viewport.pan((viewport.range.end - viewport.range.start) / 4)],
  ['reset-view', () => viewport.reset()],
] as const)
  element(id).addEventListener('click', () => {
    action();
    draw();
  });
wave.addEventListener(
  'wheel',
  (event) => {
    event.preventDefault();
    const rect = wave.getBoundingClientRect();
    viewport.zoom(
      Math.exp(-Math.max(-100, Math.min(100, event.deltaY)) / 200),
      Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
    );
    draw();
  },
  { passive: false },
);
let dragX: number | undefined;
wave.addEventListener('pointerdown', (event) => {
  dragX = event.clientX;
  wave.setPointerCapture(event.pointerId);
});
wave.addEventListener('pointermove', (event) => {
  if (dragX === undefined) return;
  viewport.pan(
    ((dragX - event.clientX) / wave.getBoundingClientRect().width) *
      (viewport.range.end - viewport.range.start),
  );
  dragX = event.clientX;
  draw();
});
for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
  wave.addEventListener(event, () => {
    dragX = undefined;
  });
let resizeFrame = 0;
new ResizeObserver(() => {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(draw);
}).observe(element('waveform').parentElement!);

element<HTMLInputElement>('audio-file').addEventListener('change', async (event) => {
  const input = event.target as HTMLInputElement,
    file = input.files?.[0];
  if (!file) return;
  const generation = ++loadGeneration;
  status('Decoding audio locally…');
  try {
    const next = await loadAudioFile(file);
    if (generation !== loadGeneration) return;
    choose(next, file.name, false);
    for (const button of document.querySelectorAll<HTMLButtonElement>('[data-signal]')) {
      button.classList.remove('active');
      button.setAttribute('aria-pressed', 'false');
    }
  } catch (error) {
    if (generation === loadGeneration)
      status(error instanceof Error ? error.message : 'Could not decode audio', true);
  } finally {
    input.value = '';
  }
});

function updateTransport(): void {
  for (const id of [
    'export-json',
    'export-csv',
    'export-wav',
    'fft-size',
    'window',
    'zoom-in',
    'zoom-out',
    'pan-left',
    'pan-right',
    'reset-view',
  ])
    (element(id) as HTMLButtonElement | HTMLSelectElement).disabled =
      session.state === 'microphone';
  element<HTMLButtonElement>('play').innerHTML =
    session.state === 'playing' ? 'Ⅱ <span>Pause</span>' : '▶ <span>Play</span>';
  element('play').setAttribute(
    'aria-label',
    session.state === 'playing' ? 'Pause audio' : 'Play audio',
  );
}
element('play').addEventListener('click', async () => {
  try {
    if (session.state === 'playing') await session.pause();
    else if (session.state === 'paused') await session.resume();
    else await session.play(audio);
    updateTransport();
    status(session.state === 'playing' ? 'Playing selected recording.' : 'Playback paused.');
  } catch (error) {
    status(error instanceof Error ? error.message : 'Playback failed', true);
  }
});
element('stop').addEventListener('click', () => {
  session.stop();
  element('microphone').classList.remove('active');
  setText('source-title', sourceName);
  updateTransport();
  analyze();
  status('Stopped.');
});
element<HTMLInputElement>('volume').addEventListener('input', (event) =>
  session.setVolume(Number((event.target as HTMLInputElement).value)),
);
window.addEventListener('pagehide', () => {
  void session.close();
});

let liveFrames: Float32Array[] = [];
let lastPaint = 0;
function paintLive(time: number): void {
  if (session.state === 'closed') return;
  if (time - lastPaint >= 100) {
    lastPaint = time;
    updateTransport();
    if (session.state === 'playing' || session.state === 'microphone') {
      const bins = session.readSpectrum();
      drawSpectrum(spectrum, bins, {
        ...canvasSize(spectrum),
        floor: Number(select('db-floor')),
        color: '#a89bff',
      });
      setText('spectrum-mode', 'LIVE · WEB AUDIO');
      if (session.state === 'microphone') {
        const input = session.readTimeDomain();
        drawWaveform(wave, input, canvasSize(wave));
        liveFrames.push(bins);
        if (liveFrames.length > 128) liveFrames.shift();
        drawSpectrogram(spectrogram, liveFrames, {
          ...canvasSize(spectrogram),
          floor: Number(select('db-floor')),
          palette: select('palette') as PaletteName,
          frequencyScale: select('frequency-scale') as 'linear' | 'log',
        });
        setText('rms', `${linToDb(rms(input)).toFixed(1)} dB`);
        setText('frame-count', `${liveFrames.length} live frames`);
      }
    } else {
      setText('spectrum-mode', 'FIRST FRAME');
    }
  }
  requestAnimationFrame(paintLive);
}
requestAnimationFrame(paintLive);
element('microphone').addEventListener('click', async () => {
  if (session.state === 'microphone') {
    session.stop();
    analyze();
    status('Microphone stopped. Selected recording restored.');
    setText('source-title', sourceName);
    element('microphone').classList.remove('active');
    return;
  }
  try {
    loadGeneration++;
    status('Waiting for microphone permission…');
    await session.microphone();
    if (!['microphone'].includes(session.state)) return;
    liveFrames = [];
    setText('source-title', 'Live microphone');
    setText('source-detail', `${(session.sampleRate ?? 0) / 1000} kHz · monitoring muted`);
    element('microphone').classList.add('active');
    status('Microphone active. Use Stop to release the device.');
  } catch (error) {
    status(error instanceof Error ? error.message : 'Microphone could not start', true);
  }
});

element('export-json').addEventListener('click', () =>
  download(
    new Blob([serializeAnalysis(analysis)], { type: 'application/json' }),
    'sonascope-analysis.json',
  ),
);
element('export-csv').addEventListener('click', () =>
  download(
    new Blob([analysisToCsv(analysis)], { type: 'text/csv;charset=utf-8' }),
    'sonascope-features.csv',
  ),
);
element('export-wav').addEventListener('click', () =>
  download(new Blob([encodeWav(audio)], { type: 'audio/wav' }), 'sonascope-audio.wav'),
);
element('export-png').addEventListener('click', () =>
  spectrogram.toBlob((blob) => {
    if (blob) download(blob, 'sonascope-spectrogram.png');
    else status('Image export failed', true);
  }, 'image/png'),
);
