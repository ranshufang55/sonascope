import { it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
it('runs every documented example with its own outcome assertions', () => {
  const result = spawnSync(process.execPath, ['scripts/check-examples.mjs'], { encoding: 'utf8' });
  expect(result.stdout + result.stderr).not.toContain('AssertionError');
  expect(result.status, result.stdout + result.stderr).toBe(0);
}, 10000);
