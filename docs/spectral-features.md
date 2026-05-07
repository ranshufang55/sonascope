# Spectral feature interpretation

## Feature meanings

| Feature  | Meaning                                                     |
| -------- | ----------------------------------------------------------- |
| Centroid | Magnitude-weighted mean frequency                           |
| Spread   | Weighted dispersion around the centroid                     |
| Rolloff  | Frequency containing a chosen cumulative magnitude fraction |
| Flatness | Geometric mean divided by arithmetic mean                   |
| Entropy  | Normalized distribution entropy                             |
| Flux     | Increasing energy between matching spectral shapes          |

Inputs must be finite and nonnegative. Frequency-aware operations require a consistent FFT size and sample rate. Silence receives defined zero-valued feature results instead of division by zero.

These descriptors summarize spectra. They do not classify speakers, instruments or emotions. Test a feature against known signals before using its threshold on recordings with changing gain or background noise.
