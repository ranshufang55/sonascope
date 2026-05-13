# Validation strategy

## Checks

Run `npm run build`, `npm run test:all` and `npm run format:check` in that order. Test checking includes TypeScript compilation of every test, followed by Vitest. The numerical core runs without browser dependencies.

Tests combine known signals, independent direct Fourier sums, exhaustive short-input enumerations, transformation invariants, round trips and complete public-schema goldens. A property such as channel split/join recovery covers all samples and channels, not just one chosen output.

Browser session tests use explicit device/context doubles for cancellation and resource cleanup. Interactive review uses Firefox, including actual audio playback and virtual microphone capture. The package smoke check installs the generated tarball into a fresh temporary consumer.

When a public contract changes, update its complete golden deliberately. Avoid snapshots that merely copy implementation internals without checking useful behavior.
