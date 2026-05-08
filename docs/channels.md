# Channel conversion and editing

## Channel policies

`splitChannels` produces independent mono buffers. `joinChannels` accepts mono inputs with matching sample rate and length. Multichannel inputs are rejected so no extra channels disappear implicitly.

`downmixToMono` supports explicit policies. A mean mix can cancel opposite-phase stereo content; use a selected channel when that distinction matters. Mid/side operations require stereo input, including for empty recordings.

`sliceAudio` uses a half-open sample range. `concatAudio` requires matching formats. `reverseAudio`, `gainAudio` and `fadeAudio` return new buffers. Fade lengths are in samples and must fit the recording.

Edits preserve sample rate and channel count. Convert time to samples deliberately, choose rounding at boundaries, and keep the original buffer when comparing before and after waveforms.
