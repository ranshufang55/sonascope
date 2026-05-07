# Time-domain descriptors

## Numerical summaries

RMS summarizes signal energy, peak reports the largest absolute sample, and crest factor relates peak to RMS. Mean measures DC offset; variance measures deviations from the mean. Empty buffers return explicit zero summaries where defined.

Zero-crossing rate treats zero as nonnegative. Reversing a signal preserves its crossing count, including transitions through exact zeros. This convention avoids direction-dependent behavior at silence boundaries.

Envelope helpers summarize local energy, RMS or peak. Smoothing and envelope widths are validated to keep work bounded. Energy thresholds can distinguish activity from near-silence, but an active region can contain music, noise or speech.

Samples containing NaN or infinity fail before producing descriptors. This prevents one invalid input from silently contaminating a complete visualization.
