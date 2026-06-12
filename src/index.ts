export const VERSION = '0.1.1';
export const NAME = 'sonascope';
export function describe(): string {
  return `${NAME} v${VERSION}`;
}
export { AudioBuffer } from './core/buffer.js';
export { fft, ifft } from './core/fft.js';
export { stft, istft } from './core/frame.js';
export { generateSine, generateWhiteNoise } from './core/generators.js';
export { analyzeAudio } from './analysis.js';
export type { AnalysisOptions, AnalysisFrame, AudioAnalysis } from './analysis.js';
export { parseWav, decodeWav, encodeWav } from './io/wav.js';
export type { WavInfo, WavEncoding } from './io/wav.js';
export { serializeAnalysis, analysisToCsv } from './io/analysis-export.js';
