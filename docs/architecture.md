# Architecture and data flow

## Components

```text
local file / generated signal
          |
     AudioBuffer
          |
   analysis + DSP core
      /        \
JSON / CSV    browser canvases
```

`src/core` contains numerical operations, signal generators and buffer utilities. It does not require the DOM. `src/io` handles WAV interchange and analysis exports. `src/browser` owns canvas rendering and Web Audio lifecycle. `src/demo` connects these modules into the workbench.

Import `sonascope` for the main analysis workflow, `sonascope/core` for DSP, `sonascope/io` for binary interchange, and `sonascope/browser` for rendering. Browser modules can be imported on a server; they access browser facilities when operations are called.

Analysis works on bounded in-memory recordings. StreamingAnalyzer emits complete frames incrementally and keeps only the requested history. It is independent of microphone capture.
