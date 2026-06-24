import { it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { VERSION } from '../index.js';
it('keeps every version declaration and exported file consistent', () => {
  const metadata = JSON.parse(readFileSync('package.json', 'utf8'));
  const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
  expect([lock.version, lock.packages[''].version, VERSION]).toEqual([
    metadata.version,
    metadata.version,
    metadata.version,
  ]);
  expect(Object.keys(metadata.exports).sort()).toEqual([
    '.',
    './browser',
    './core',
    './io',
    './package.json',
  ]);
  for (const value of Object.values(metadata.exports))
    for (const path of typeof value === 'string'
      ? [value]
      : Object.values(value as Record<string, string>))
      expect(existsSync(path), path).toBe(true);
});
