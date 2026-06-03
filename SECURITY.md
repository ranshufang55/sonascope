# Security

## Supported version

Security fixes target the latest patch release on `main`.

## Reporting

Use GitHub's private vulnerability reporting for this repository when available. Include a minimal reproducer, affected version, expected boundary and actual behavior. Do not publish credentials or private recordings in public issues. If private reporting is unavailable, open an issue requesting a private contact without including exploit details or sensitive data.

## Boundaries

The workbench processes selected files and microphone samples locally. Core parsers validate container size, sample geometry and allocation budgets. Host applications remain responsible for input origin, permissions and the sensitivity of downloaded artifacts. Review [resource limits](docs/limits.md) and [audio privacy](docs/privacy.md).
