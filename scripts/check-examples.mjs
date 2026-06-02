import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const directory = new URL('../examples/', import.meta.url);
for (const name of (await readdir(directory)).filter((name) => name.endsWith('.mjs')).sort()) {
  const result = spawnSync(process.execPath, [new URL(name, directory)], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
