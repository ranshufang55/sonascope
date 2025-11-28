#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const run = (command, args) =>
  spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
const unstaged = run('git', ['diff', '--name-only']);
const untracked = run('git', ['ls-files', '--others', '--exclude-standard']);
if (
  unstaged.status !== 0 ||
  untracked.status !== 0 ||
  unstaged.stdout.trim() ||
  untracked.stdout.trim()
) {
  console.error('The checked working tree must exactly match the staged source snapshot.');
  console.error('Finish the current coherent step and stage its explicit paths before committing.');
  console.error(unstaged.stdout + untracked.stdout);
  process.exit(1);
}
const treeResult = run('git', ['write-tree']);
if (treeResult.status !== 0) process.exit(1);
const tree = treeResult.stdout.trim();
const directoryResult = run('git', ['rev-parse', '--git-path', 'validation']);
if (directoryResult.status !== 0) process.exit(1);
const directory = resolve(root, directoryResult.stdout.trim());
mkdirSync(directory, { recursive: true });
const checks = [
  ['build', ['run', 'build']],
  ['test', ['run', 'test:all']],
  ['format', ['run', 'format:check']],
];
const receipt = { tree, checkedAt: new Date().toISOString(), passed: false, checks: [] };
let output = '';
for (const [name, args] of checks) {
  const result = run('npm', args);
  output += `\n[${name}]\n${result.stdout ?? ''}${result.stderr ?? ''}`;
  receipt.checks.push({ name, exitCode: result.status });
  writeFileSync(resolve(directory, `${tree}.log`), output);
  writeFileSync(resolve(directory, `${tree}.json`), JSON.stringify(receipt, null, 2) + '\n');
  if (result.status !== 0) {
    console.error(output.slice(-14000));
    console.error('Fix this step before writing or staging the next feature.');
    process.exit(1);
  }
}
receipt.passed = true;
writeFileSync(resolve(directory, `${tree}.json`), JSON.stringify(receipt, null, 2) + '\n');
console.log(`Build, tests and format passed for staged tree ${tree.slice(0, 12)}.`);
