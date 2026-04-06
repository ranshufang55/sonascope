# Sample buffers and ownership

## Representation

`AudioBuffer(sampleRate, numChannels, numSamples, data?)` stores planar Float32 samples. Construction copies supplied channels, checks equal lengths and rejects non-finite values. Sample rates range from 1 through 192000 Hz; the numerical API also accepts fractional clocks. WAV output needs integer rates.

`getChannel(index)` returns mutable sample storage. Changes are visible to subsequent analysis. Call `clone()` when independent ownership is needed. Buffer allocation is limited to 2^24 total samples and 32 channels.

Most processing functions return a new buffer. `normalizePeak`, `normalizeRms`, DC removal, clipping and emphasis functions mutate their Float32Array input after validating the complete operation. `fftInPlace` and `ifftInPlace` explicitly mutate both planes. Equal-rate resampling may return the original buffer, so clone before editing a result whose ownership must be independent.
