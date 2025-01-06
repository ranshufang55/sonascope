#!/usr/bin/env node
// Sonascope pre-commit hook: build, test, format check, fail on error.
// Installed by bootstrap commit. Bypassing this hook is a violation of
// the project's contribution rules — never use --no-verify.

import { spawnSync } from 'node:child_process';

// Git invokes hooks with the project root as the working directory, so
// process.cwd() is always the right anchor here.
const root = process.cwd();

const run = (bin, args) => spawnSync(bin, args, { cwd: root, stdio: 'inherit', shell: false });

const steps = [
  { name: 'build', bin: 'npx', args: ['--no-install', 'tsc', '-p', 'tsconfig.build.json'] },
  { name: 'test', bin: 'npx', args: ['--no-install', 'vitest', 'run', '--reporter=dot'] },
  { name: 'format', bin: 'npx', args: ['--no-install', 'prettier', '--check', '.'] },
];

for (const s of steps) {
  const res = run(s.bin, s.args);
  if (res.status !== 0) {
    console.error(`[pre-commit] step '${s.name}' failed with exit code ${res.status}`);
    process.exit(1);
  }
}

process.exit(0);
