# WAV interchange

## Supported formats

The reader supports integer PCM at 8, 16, 24 and 32 bits, IEEE floating-point samples at 32 and 64 bits, and supported extensible PCM/float subformats. Eight-bit PCM is unsigned; wider PCM is signed little-endian. Non-finite float samples are rejected.

The RIFF scanner validates container and chunk sizes, odd-byte padding, duplicate required chunks and bounded chunk counts. PCM format fields must agree on channel count, block alignment and byte rate. Inputs are limited to 128 MB before sample-allocation checks.

`encodeWav` accepts `pcm8`, `pcm16`, `pcm24`, `pcm32`, `float32` or `float64`. Integer output clips to its representable range and quantizes. Floating output includes the fact chunk and sample count. The encoder does not compress audio.

For compressed browser files, the demo uses native browser decoding after duration and byte checks. The core WAV reader remains deterministic across browser and Node runtimes.
