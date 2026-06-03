import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = process.cwd(),
  directory = await mkdtemp(join(tmpdir(), 'sonascope-consumer-'));
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(result.stdout + result.stderr);
  return result.stdout;
}
try {
  const packed = JSON.parse(
    run('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', directory]),
  )[0];
  const paths = new Set(packed.files.map((file) => file.path));
  for (const name of [
    'README.md',
    'LICENSE',
    'CHANGELOG.md',
    'dist/index.js',
    'dist/index.d.ts',
    'dist/core/index.js',
    'dist/io/index.js',
    'dist/browser/index.js',
  ])
    assert(paths.has(name), name);
  assert(![...paths].some((name) => name.includes('node_modules') || name.startsWith('.git/')));
  const consumer = join(directory, 'consumer');
  await mkdir(consumer);
  await writeFile(
    join(consumer, 'package.json'),
    JSON.stringify({ name: 'sonascope-smoke', private: true, type: 'module' }),
  );
  run(
    'npm',
    [
      'install',
      '--offline',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      join(directory, packed.filename),
    ],
    consumer,
  );
  await writeFile(
    join(consumer, 'smoke.mjs'),
    `import assert from 'node:assert/strict';
import * as root from 'sonascope';
import * as core from 'sonascope/core';
import * as io from 'sonascope/io';
import * as browser from 'sonascope/browser';
const audio=root.generateSine(8000,0.02,500);
assert.equal(io.decodeWav(io.encodeWav(audio)).numSamples,160);
assert.equal(core.fft(new Float32Array(16)).re.length,16);
assert.equal(new browser.Viewport(100).range.end,100);
assert.equal(root.VERSION,${JSON.stringify(JSON.parse(await readFile(resolve('package.json'), 'utf8')).version)});
`,
  );
  run(process.execPath, ['smoke.mjs'], consumer);
  await writeFile(
    join(consumer, 'consumer.ts'),
    `import {analyzeAudio,generateSine,type AudioAnalysis} from 'sonascope';
import {Viewport,type ViewRange} from 'sonascope/browser';
const result:AudioAnalysis=analyzeAudio(generateSine(16000,0.1,500));
const range:ViewRange=new Viewport(result.numSamples).range;
console.log(range);
`,
  );
  run(
    process.execPath,
    [
      resolve('node_modules/typescript/bin/tsc'),
      '--strict',
      '--noEmit',
      '--module',
      'NodeNext',
      '--moduleResolution',
      'NodeNext',
      '--target',
      'ES2022',
      '--lib',
      'ES2022,DOM',
      'consumer.ts',
    ],
    consumer,
  );
  const metadata = JSON.parse(
    await readFile(join(consumer, 'node_modules/sonascope/package.json'), 'utf8'),
  );
  assert.equal(
    metadata.version,
    JSON.parse(await readFile(resolve('package.json'), 'utf8')).version,
  );
  console.log(
    'Tarball, all subpath exports, runtime behavior and strict TypeScript consumer passed',
  );
} finally {
  await rm(directory, { recursive: true, force: true });
}
