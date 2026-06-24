# Sonascope

**Local audio analysis, visualized.** A dependency-free TypeScript DSP library and browser workbench by **Huang Zeyao**, a student at **Sun Yat-sen University**.

## Explore audio

```sh
git clone https://github.com/ranshufang55/sonascope.git
cd sonascope
npm ci
npm run demo
```

Open **http://127.0.0.1:4173**. Compare synthetic harmonics, chirps, pulses and noise, or choose a local recording. The workbench displays waveform, selected-frame spectrum and spectrogram with linear/log frequency scales, three palettes, FFT/window controls, zoom and pan. Playback and microphone capture share an explicit lifecycle. Export WAV, PNG, JSON or CSV locally.

## Use the library

```js
import { generateSine, analyzeAudio, serializeAnalysis } from './dist/index.js';

const audio = generateSine(48000, 0.1, 1000, { amplitude: 0.5 });
const analysis = analyzeAudio(audio, { fftSize: 1024, hopSize: 256 });
console.log(serializeAnalysis(analysis));
```

Run `npm run build` first. Package subpaths are `sonascope`, `sonascope/core`, `sonascope/io` and `sonascope/browser`; a local tarball can be created with `npm pack`. This repository does not require an npm registry release.

## What's included

| Area        | Capabilities                                                                      |
| ----------- | --------------------------------------------------------------------------------- |
| DSP         | FFT/IFFT, STFT/ISTFT, windows, spectral/time descriptors, mel filters, resampling |
| Audio       | Planar buffers, channel conversion, slicing, concatenation, fades, normalization  |
| Interchange | PCM 8/16/24/32 and float 32/64 WAV; validated analysis JSON/CSV                   |
| Rendering   | Peak-preserving waveform, spectrum, linear/log spectrogram, bounded viewport      |
| Streaming   | Incremental frames, bounded history, microphone resource cleanup                  |

The demo accepts files up to 20 MB and 30 seconds. Core operations have explicit allocation limits. Microphone capture needs localhost or HTTPS and browser permission. Audio stays in the page; the application has no upload service or analytics.

## Verify

```sh
npm run build
npm run test:all
npm run format:check
npm run test:package
```

Tests include independent direct Fourier references, exhaustive short-input checks, transformation properties, full export/schema goldens and executable examples. CI covers Node.js 22 and 24. See [contribution instructions](CONTRIBUTING.md).

Read the [guides](docs/README.md), run the [examples](examples/README.md), or inspect the [changelog](CHANGELOG.md). The companion project [Speechloom](https://github.com/ranshufang55/speechloom) handles speech model evaluation and dataset preparation.

## License

[MIT](LICENSE) © Huang Zeyao.
