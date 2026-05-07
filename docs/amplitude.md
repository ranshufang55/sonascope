# Amplitude, power and decibels

## Units

Amplitude decibels use `20 * log10(abs(x) / reference)`. Power decibels use `10 * log10(power / reference)`. The inverse functions are `dbToLin` and `dbToPower`. References must be positive and finite.

Zero magnitude maps to the configured floor. `analyzeAudio` produces finite decibel arrays suitable for JSON export. Changing the display floor changes color contrast, not the underlying samples or FFT magnitudes.

The workbench amplitude reference is the digital sample scale. Its values are not calibrated sound-pressure levels. A microphone, room and input gain can change recorded amplitude substantially.

An isolated on-bin sinusoid reaches its amplitude after coherent-gain correction. Noise and off-bin tones spread energy over bins; comparing their maximum bin directly with a time-domain peak answers a different question.
