import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

type TestTitle = {
  kind: string;
  file: string;
  line: number;
};

const root = process.argv[2] ?? 'src';
const titles = new Map<string, TestTitle[]>();
const titlePattern = /\b(describe|it|test)\(\s*(["'`])((?:\\.|(?!\2).)*)\2/g;

const collectFiles = (dir: string): string[] => {
  if (!existsSync(dir)) return [];

  return readdirSync(dir).flatMap(entry => {
    const path = join(dir, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) return collectFiles(path);
    if (/\.spec\.tsx?$/.test(path)) return [path];

    return [];
  });
};

for (const file of collectFiles(root)) {
  const source = readFileSync(file, 'utf8');

  for (const match of source.matchAll(titlePattern)) {
    const [, kind, , title] = match;
    const line = source.slice(0, match.index).split('\n').length;
    const entries = titles.get(title) ?? [];

    entries.push({
      kind,
      file: relative(process.cwd(), file),
      line,
    });
    titles.set(title, entries);
  }
}

const duplicates = [...titles.entries()].filter(([, entries]) => entries.length > 1);

if (duplicates.length > 0) {
  console.error('Duplicate core test titles found:');

  for (const [title, entries] of duplicates) {
    console.error(`\n${entries.length}x ${title}`);
    for (const entry of entries) {
      console.error(`  ${entry.file}:${entry.line} ${entry.kind}`);
    }
  }

  process.exit(1);
}

console.log(`No duplicate core test titles found across ${titles.size} titles.`);
