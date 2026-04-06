# Fourier conventions

## Forward and inverse transforms

The radix-2 transform uses the negative exponential for the forward FFT. Forward output is unnormalized; the inverse divides by N. `fft(samples)` copies real input and returns `{ re, im }`. `ifft` accepts both planes. Lengths must be equal powers of two within MAX_FFT_SIZE.

Full transforms contain N complex bins. A real signal has conjugate symmetry. `halfSpectrum` returns floor(N/2)+1 bins, including DC and Nyquist for even lengths. Interior bins have negative-frequency partners; DC and Nyquist do not.

Magnitude is `sqrt(re² + im²)` and power is `re² + im²`. Neither operation alone creates an amplitude-calibrated spectrum. `analyzeAudio` applies window coherent-gain scaling and doubles only the paired interior bins.

Tests compare transforms with an independent direct Fourier sum and check Parseval energy, convolution, phase shifts, reversal, linearity and round trips.
