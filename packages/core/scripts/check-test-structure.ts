import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

type Finding = {
  file: string;
  line: number;
  title: string;
  message: string;
};

const root = process.argv[2] ?? 'src';
const findings: Finding[] = [];
const testPattern = /\b(it|test)\(\s*(["'`])((?:\\.|(?!\2).)*)\2/g;
const allowPattern = /oxform-test-structure:\s*allow-multiple-assertions\s+--\s+\S+/;

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

const lineForIndex = (source: string, index: number) => source.slice(0, index).split('\n').length;

const findCaseEnd = (source: string, start: number, nextStart: number | undefined) => nextStart ?? source.length;

for (const file of collectFiles(root)) {
  const source = readFileSync(file, 'utf8');
  const matches = [...source.matchAll(testPattern)];

  matches.forEach((match, index) => {
    const [, , , title] = match;
    const start = match.index;
    const end = findCaseEnd(source, start, matches[index + 1]?.index);
    const body = source.slice(start, end);
    const runtimeExpectCount = [...body.matchAll(/\bexpect\s*\(/g)].length;
    const typeExpectCount = [...body.matchAll(/\bexpectTypeOf\s*\(/g)].length;
    const hasNegativeTypeAssertion = body.includes('@ts-expect-error');
    const allowed = allowPattern.test(body);

    if (runtimeExpectCount > 1 && !allowed) {
      findings.push({
        file: relative(process.cwd(), file),
        line: lineForIndex(source, start),
        title,
        message: `${runtimeExpectCount} runtime assertions; split the case or add an allow comment with a reason`,
      });
    }

    if (runtimeExpectCount === 0 && typeExpectCount === 0 && !hasNegativeTypeAssertion) {
      findings.push({
        file: relative(process.cwd(), file),
        line: lineForIndex(source, start),
        title,
        message: 'no runtime, type, or @ts-expect-error assertion found',
      });
    }
  });
}

if (findings.length > 0) {
  console.error('Core test structure issues found:');

  for (const finding of findings) {
    console.error(`\n${finding.file}:${finding.line} ${finding.title}`);
    console.error(`  ${finding.message}`);
  }

  process.exit(1);
}

console.log('Core test structure check passed.');
