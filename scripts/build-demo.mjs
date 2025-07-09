import { cp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const out = new URL('../web-dist/', import.meta.url);
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(new URL('../dist/', import.meta.url), new URL('dist/', out), { recursive: true });
await cp(new URL('../demo/styles.css', import.meta.url), new URL('styles.css', out));
const html = await readFile(new URL('../demo/index.html', import.meta.url), 'utf8');
await writeFile(
  new URL('index.html', out),
  html.replace('../dist/demo/main.js', './dist/demo/main.js'),
);
console.log(`Static workbench built at ${root}web-dist`);
