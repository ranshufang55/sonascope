import assert from 'node:assert/strict';
import { generateSine, encodeWav, decodeWav } from '../dist/index.js';
const original = generateSine(16000, 0.02, 500, { amplitude: 0.25 });
for (const encoding of ['pcm8', 'pcm16', 'pcm24', 'pcm32', 'float32', 'float64']) {
  const restored = decodeWav(encodeWav(original, encoding));
  assert.equal(restored.numSamples, original.numSamples);
  const error = Math.max(
    ...restored.getChannel(0).map((v, i) => Math.abs(v - original.getChannel(0)[i])),
  );
  assert.ok(error < 0.008);
  console.log(encoding, error);
}
