# Workbench controls

## Explore a recording

Choose a source, then inspect waveform, selected-frame spectrum and spectrogram together. Change FFT size and window to compare time/frequency tradeoffs. The window dropdown offers six types: Hann, Hamming, Blackman, rectangular, triangular, and Bartlett. Adjust dB floor for contrast, switch palettes, and compare linear with logarithmic frequency display.

The frame slider and spectrogram click select a frame. Waveform wheel navigation zooms around the pointer; dragging pans the visible range. Reset restores the complete recording. Playback and microphone controls show their current state.

Export JSON for the full numerical analysis, CSV for scalar frame descriptors, WAV for sample interchange and PNG for a view image. Files remain local to the browser; no application server receives recordings.

The demo accepts recordings up to 20 MB and 30 seconds. Short selections and larger hops keep analysis responsive within its frame and matrix limits.
