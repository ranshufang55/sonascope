# Numerical references and scope

## Conventions used here

The Fourier implementation follows the conventional negative-sign forward transform and 1/N inverse normalization. Tests include an independent O(N²) reference sum for small arrays so transform correctness does not depend only on inverse symmetry.

The symmetric triangular window follows [SciPy's triangular-window definition](https://docs.scipy.org/doc/scipy/reference/generated/scipy.signal.windows.triang.html). The Slaney mel conversion follows [librosa's conversion implementation](https://librosa.org/doc/0.11.0/_modules/librosa/core/convert.html#hz_to_mel).

These references establish numerical conventions. Sonascope is an independently implemented educational and practical analysis toolkit. It does not reproduce every feature or normalization option of those libraries, and it does not claim calibrated acoustic measurements or learned audio understanding.
