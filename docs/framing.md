# Frames, hops and reconstruction

## Sample geometry

Frame size determines the analysis window. Hop size determines the spacing between frame starts. A hop smaller than the frame overlaps observations; an equal hop produces adjacent frames; a larger hop leaves gaps.

`frameSignal` and low-level STFT use complete frames. High-level `analyzeAudio` includes a zero-padded tail and records the true sampleCount. It avoids adding redundant frames after the last sample has been covered. StreamingAnalyzer emits complete frames only and accepts arbitrarily partitioned input chunks.

`overlapAdd` sums frames at their supplied hop. `istft` compensates window overlap using squared weights. Request the intended output length explicitly when reconstructing. Zero-weight endpoints are unobservable with a symmetric Hann window unless another frame covers them.

Frame and transform sizes are checked even for empty input. Materialized matrices have allocation limits; increase hop size or process smaller selections when limits are reached.
