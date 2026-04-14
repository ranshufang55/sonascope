# Window selection and normalization

## Available windows

Rectangular, Hann, Hamming, Blackman, Bartlett and triangular windows use symmetric sample geometry. Bartlett reaches zero at both ends. Triangular has nonzero end weights; it is a distinct window, not an alias for Bartlett.

Windowing trades frequency resolution for leakage suppression. A rectangular window preserves an on-bin tone sharply but leaks more when periods do not fit. Hann is the workbench default. Larger FFT sizes improve frequency spacing and increase the time span represented by each frame.

`windowSum` supplies coherent gain. `analyzeAudio` uses it to report sinusoidal amplitude. Inverse STFT uses accumulated squared window weights where observable. Samples multiplied by zero with no overlapping support cannot be recovered.

The triangular convention follows the symmetric definition documented by [SciPy](https://docs.scipy.org/doc/scipy/reference/generated/scipy.signal.windows.triang.html).
