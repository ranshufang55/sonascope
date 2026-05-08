# Canvas rendering

## Views

Waveform columns use min/max peaks across the visible sample range, preserving narrow transients. The pyramid accelerates range queries while exact boundary handling avoids including samples outside a selection.

Spectrum columns aggregate peaks across bins. Spectrogram pixels map time horizontally and frequency vertically, with linear or logarithmic frequency geometry. The default workbench uses logarithmic display so low-frequency structure remains visible.

`prepareCanvas` accounts for device pixel ratio within a pixel budget. Render again after a container resize. `Viewport` tracks a bounded sample interval and provides anchor-preserving zoom, pan and pixel-to-sample mapping.

Palettes are 256-entry RGBA tables: ocean, ember and mono. They map normalized decibels to color. Color changes leave numerical analysis unchanged.
