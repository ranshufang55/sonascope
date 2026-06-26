import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const ts = createRequire(new URL('../package.json', import.meta.url))('typescript');
const printer = ts.createPrinter({ removeComments: true, newLine: ts.NewLineKind.LineFeed });
const names = [
  'index.d.ts',
  'analysis.d.ts',
  ...['core', 'io', 'browser'].flatMap((directory) =>
    readdirSync(new URL('../dist/' + directory, import.meta.url))
      .filter((name) => name.endsWith('.d.ts'))
      .map((name) => directory + '/' + name),
  ),
].sort();
const result = Object.fromEntries(
  names.map((name) => [
    name,
    printer.printFile(
      ts.createSourceFile(
        name,
        readFileSync(new URL('../dist/' + name, import.meta.url), 'utf8'),
        ts.ScriptTarget.Latest,
        true,
      ),
    ),
  ]),
);
console.log(JSON.stringify(result, null, 2));
