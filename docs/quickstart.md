# Run the workbench

## Local setup

Use Node.js 22 or 24 and npm. Clone this repository, then run:

```sh
npm ci
npm run demo
```

Open `http://127.0.0.1:4173`. Start with Harmonics, then compare Chirp, Pulse and Noise. Choose a local recording to inspect your own audio. The built-in signals are synthetic references, so their structure is known.

## First analysis

```js
import { generateSine, analyzeAudio } from './dist/index.js';
const audio = generateSine(48000, 0.1, 1000);
const result = analyzeAudio(audio, { fftSize: 1024, hopSize: 256 });
console.log(result.frames[0].centroid);
```

Run `npm run build` before importing `dist`. The library has no runtime dependencies. Package examples use local build paths; this guide does not assume an npm registry release.
