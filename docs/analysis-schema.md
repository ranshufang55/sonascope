# Analysis export contract

## Version 1

An AudioAnalysis includes schemaVersion, sampleRate, channels, numSamples, duration, fftSize, hopSize, window, frequencies and frames. Frequencies include DC and Nyquist. Every frame contains index, startSample, sampleCount, timeSeconds, rms, peak, centroid, rolloff, flatness, magnitude and decibels.

`serializeAnalysis` converts typed arrays to JSON arrays. `analysisToCsv` exports scalar frame descriptors; it does not flatten all spectral bins into CSV columns. Both validate metadata, frame geometry, finite values and array shapes before writing.

Frame start time is startSample/sampleRate. The final frame can contain fewer samples than fftSize; padding affects its spectrum but sampleCount records observed data. Empty audio has zero frames.

The complete serialized and runtime field sets are pinned by contract tests. Schema changes require a deliberate test and documentation update.
