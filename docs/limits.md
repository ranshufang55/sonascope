# Resource limits and error behavior

## Explicit budgets

| Surface                             | Bound             |
| ----------------------------------- | ----------------- |
| AudioBuffer samples across channels | 2^24              |
| Channels                            | 32                |
| Sample rate                         | 1–192000 Hz       |
| WAV bytes                           | 128 MB            |
| Analysis frames                     | 4096              |
| Analysis frame × bin cells          | 2^22              |
| Demo file                           | 20 MB, 30 seconds |

Additional matrix, FFT, padding and direct-autocorrelation limits protect individual operations. Limits are checked before allocating large results or mutating caller-owned storage.

Invalid numeric values, inconsistent shapes and unsupported modes raise errors. Empty input does not bypass option validation. If analysis exceeds a limit, shorten the selection or increase hop size. A smaller FFT can reduce bin count but changes frequency resolution.
