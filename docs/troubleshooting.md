# Troubleshooting

## Common issues

| Symptom                   | Check                                                    |
| ------------------------- | -------------------------------------------------------- |
| Empty chart               | Choose a nonempty recording and wait for analysis status |
| Microphone unavailable    | Use localhost or HTTPS and grant browser permission      |
| Compressed file rejected  | Try PCM WAV or a shorter supported recording             |
| Analysis too large        | Increase hop size or shorten the selection               |
| Weak low-frequency detail | Use logarithmic frequency display                        |
| Unexpected mono silence   | Inspect stereo phase cancellation and select a channel   |
| Imports cannot resolve    | Run npm run build before local dist imports              |

FFT resolution is sampleRate/fftSize; increasing canvas size does not create additional frequency bins. A wider waveform view aggregates more samples per column while preserving their extrema.

When reporting a bug, include the command, runtime version, expected behavior and a small synthetic reproducer where possible. Do not attach recordings containing private speech to public issues.
