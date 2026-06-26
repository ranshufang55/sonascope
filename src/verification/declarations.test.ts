import { it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
it('keeps complete declaration contracts explicit across core IO and browser modules', () => {
  const result = spawnSync(process.execPath, ['scripts/public-api.mjs'], { encoding: 'utf8' });
  expect(result.status, result.stderr).toBe(0);
  expect(JSON.parse(result.stdout)).toEqual(
    JSON.parse(readFileSync('src/verification/public-declarations.json', 'utf8')),
  );
});
