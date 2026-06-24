import { it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
function markdown(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = resolve(directory, name);
    return statSync(path).isDirectory() ? markdown(path) : path.endsWith('.md') ? [path] : [];
  });
}
it('keeps local documentation links resolvable', () => {
  const files = [
    'README.md',
    'CONTRIBUTING.md',
    'SECURITY.md',
    'CHANGELOG.md',
    ...markdown('docs'),
    ...markdown('examples'),
  ];
  for (const file of files)
    for (const match of readFileSync(file, 'utf8').matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1]!;
      if (/^(?:https?:|#|mailto:)/.test(target)) continue;
      expect(existsSync(resolve(dirname(file), target.split('#')[0]!)), `${file}: ${target}`).toBe(
        true,
      );
    }
});
