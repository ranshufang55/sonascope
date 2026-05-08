# Incremental analysis

## StreamingAnalyzer

Construct a StreamingAnalyzer with sampleRate, frameSize, hopSize and optional retainFrames. Push consecutive sample chunks in order. Each call returns newly completed frames; framesOut exposes retained history. reset clears both samples and frame position.

Chunk boundaries do not change frame results. Hop sizes may overlap frames or skip samples. Internal sample storage remains bounded, and retained history is limited independently from incoming chunk length. A retainFrames value of zero is useful when the caller consumes emitted frames immediately.

Streaming analysis does not own an audio device. Feed it decoded file chunks, an application stream or captured samples. It produces signal descriptors, not transcription tokens. Keep acquisition timestamps separately if the producer can pause or drop data.
