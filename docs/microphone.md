# Microphone and playback lifecycle

## User interaction

AudioSession creates Web Audio resources lazily. Start playback or microphone capture from a user action so browser permission and autoplay rules can be satisfied. Microphone capture requires a secure context or localhost.

Capture is connected through a muted gain node. It does not feed live microphone audio audibly to the speakers. Stop and close release owned tracks and disconnect nodes. Pause and resume control playback state; a completed source can be played again.

Concurrent starts and stops use generation tracking so a late permission response cannot reactivate an old session. The demo disables offline frame navigation during live capture and restores recording labels afterward.

Live history is bounded to 128 frames and drawn at approximately ten updates per second. Time labels use observed animation timestamps, so rendering pauses do not invent a continuous capture cadence.
