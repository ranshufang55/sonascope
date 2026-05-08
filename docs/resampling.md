# Resampling and aliasing

## Modes

| Mode    | Behavior                                                             |
| ------- | -------------------------------------------------------------------- |
| nearest | Closest source sample; inexpensive and discontinuous                 |
| linear  | Interpolated adjacent samples                                        |
| sinc    | Windowed-sinc interpolation with a low-pass cutoff when downsampling |

Use sinc when reducing rate and retaining spectral shape matters. Nearest and linear interpolation do not supply the same anti-alias filtering. Output length follows the ratio of target to source rate.

All channels use the same geometry. `resampleMono` delegates to the canonical resampling implementation so the two APIs agree. A same-rate call validates options and may return the original buffer.

The implementation is bounded and intended for local analysis, not a claim of mastering-grade sample-rate conversion. Compare known tones near the target Nyquist frequency when assessing a workflow.
