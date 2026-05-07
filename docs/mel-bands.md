# Mel filters and frequency bands

## Scale convention

`hzToMel` and `melToHz` use the Slaney piecewise scale: linear below 1000 Hz and logarithmic above it. The logarithmic step is ln(6.4)/27. This matches the conversion convention in [librosa](https://librosa.org/doc/0.11.0/_modules/librosa/core/convert.html#hz_to_mel).

`melFilterbank` builds continuous triangular filters over actual FFT-bin frequencies. Filter edges are not rounded to bin indices. `applyMelFilterbank` requires matching input and filter widths and returns one weighted sum per band.

`linearBands` and `logBands` provide alternate frequency edges. Logarithmic bands need a positive lower bound. Filterbanks are useful for comparing broad frequency regions; these utilities do not train a perceptual model or infer semantic audio content.
