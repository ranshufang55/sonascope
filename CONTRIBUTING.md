# Contributing

## Setup

Use Node.js 22 or 24. Run `npm ci`, then `node scripts/install-hooks.mjs` to install the repository's pre-commit validation. Work on a branch and keep a change focused on one coherent behavior.

## Required checks

```sh
npm run build
npm run test:all
npm run format:check
```

Format with `npm run format` when needed, then repeat the checks. Stage explicit changed paths before committing. The hook requires the working source to match the staged tree and records build, test and format results under Git's validation directory. Do not bypass failed checks.

## Contracts

Keep ESM imports explicit with `.js` suffixes, use named exports, strict TypeScript and single-quoted strings. Add behavior tests for a numerical change and cover both transformation directions. Public exports and serialized schemas have complete golden checks; update these intentionally when a contract changes.

Run `node scripts/check-package.mjs` for packaging changes. Browser work should exercise playback, microphone release, frame selection, exports and narrow layouts. Use small synthetic reproductions instead of private recordings in issues.
