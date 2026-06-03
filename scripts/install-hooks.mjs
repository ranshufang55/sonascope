import { existsSync, writeFileSync, chmodSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
const result = spawnSync('git', ['rev-parse', '--git-path', 'hooks/pre-commit'], {
  encoding: 'utf8',
});
if (result.status !== 0) throw new Error('Run this script inside a Git checkout');
const target = resolve(result.stdout.trim());
if (existsSync(target))
  throw new Error('A pre-commit hook already exists; inspect it before replacing it');
mkdirSync(dirname(target), { recursive: true });
writeFileSync(
  target,
  `#!/bin/sh
exec node scripts/pre-commit.js
`,
);
chmodSync(target, 0o755);
console.log('Installed build, test and format validation');
