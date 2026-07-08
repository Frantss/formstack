import {
  issues_filter,
  issues_fromIssues,
  issues_group,
  issues_hasAny,
  issues_hasBlocking,
  checks_hasValidator,
  checks_levelsFromOptions,
  issues_merge,
  issues_normalize,
} from '#utils/issues';
import { buildPathsMap } from '#utils/build-paths-map';
import { getAscendantPaths } from '#utils/get-ascendant-paths';
import { get } from '#utils/get';
import { schema_validate } from '#utils/schema-validate';
import { update } from '#utils/update';
import { expect, it } from 'vite-plus/test';
import z from 'zod';

const issue = {
  code: 'custom',
  message: 'issue',
  path: ['name'],
} as never;

const warningIssue = {
  level: 'warning',
  issue,
} as const;

const buildNestedPaths = () =>
  buildPathsMap(
    {
      name: 'name',
      nested: { value: 'value' },
      list: [{ label: 'first' }],
    },
    (path, value) => ({ path, value }),
  );

it('builds path keys for nested objects and arrays', () => {
  const paths = buildNestedPaths();

  expect(Object.keys(paths)).toEqual(['name', 'nested', 'nested.value', 'list', 'list.0', 'list.0.label']);
});

it('builds path entries for nested array leaves', () => {
  const paths = buildNestedPaths();

  expect(paths['list.0.label']).toEqual({ path: 'list.0.label', value: 'first' });
});

it('returns an empty paths map for null input', () => {
  expect(buildPathsMap(null, path => path)).toEqual({});
});

it('returns an empty paths map for undefined input', () => {
  expect(buildPathsMap(undefined, path => path)).toEqual({});
});

it('gets ascendant paths from root to leaf', () => {
  expect(getAscendantPaths('nested.value.deep')).toEqual(['nested', 'nested.value', 'nested.value.deep']);
});

it('gets nested values', () => {
  expect(get({ nested: { value: 'value' } }, ['nested', 'value'])).toBe('value');
});

it('returns fallback for nested undefined values', () => {
  expect(get({ nested: undefined }, ['nested', 'value'], 'fallback')).toBe('fallback');
});

it('returns fallback for nested null values', () => {
  expect(get({ nested: null }, ['nested', 'value'], 'fallback')).toBe('fallback');
});

it('returns null when the source value is null', () => {
  expect(get(null, ['nested'], 'fallback')).toBeNull();
});

it('returns fallback for missing nested keys', () => {
  expect(get({ nested: {} }, ['nested', 'missing'], 'fallback')).toBe('fallback');
});

it('applies direct updaters', () => {
  expect(update('next', 'current')).toBe('next');
});

it('applies function updaters', () => {
  expect(update((current: string) => `${current} next`, 'current')).toBe('current next');
});

it('validates synchronous standard schemas', async () => {
  const result = await schema_validate(z.object({ name: z.string() }), { name: 'name' });

  expect(result.issues).toBeUndefined();
});

it('validates asynchronous standard schemas', async () => {
  const schema = {
    '~standard': {
      validate: async () => ({ issues: [issue] }),
    },
  };

  const result = await schema_validate(schema as never, {});

  expect(result.issues).toEqual([issue]);
});

it('derives issue levels from options with error first', () => {
  expect(
    checks_levelsFromOptions({
      checks: {
        warning: {},
        error: {},
      },
    }),
  ).toEqual(['error', 'warning']);
});

it('detects configured issue validators', () => {
  expect(
    checks_hasValidator(
      {
        checks: {
          warning: {
            validate: {
              change: z.object({ name: z.string() }),
            },
          },
        },
      },
      'change',
    ),
  ).toBe(true);
});

it('detects missing issue validators', () => {
  expect(checks_hasValidator({ checks: {} }, 'change')).toBe(false);
});

it('groups issues by level', () => {
  expect(issues_group([warningIssue], ['error', 'warning'])).toEqual({
    error: [],
    warning: [warningIssue],
  });
});

it('normalizes issues by level', () => {
  expect(issues_normalize({ stale: [], warning: [warningIssue] } as never, ['error', 'warning'])).toEqual({
    error: [],
    warning: [warningIssue],
  });
});

it('filters issues without configured levels', () => {
  expect(issues_filter({ warning: [warningIssue] }, () => false)).toEqual({});
});

it('filters issues with configured levels', () => {
  expect(issues_filter({ warning: [warningIssue] }, () => true, ['error', 'warning'])).toEqual({
    error: [],
    warning: [warningIssue],
  });
});

it('merges issues without configured levels', () => {
  expect(issues_merge([{ warning: [warningIssue] }, { warning: [] }])).toEqual({
    warning: [warningIssue],
  });
});

it('merges issues with configured levels', () => {
  expect(issues_merge([{ warning: [warningIssue] }], ['error', 'warning'])).toEqual({
    error: [],
    warning: [warningIssue],
  });
});

it('detects empty issues as having no issues', () => {
  expect(issues_hasAny({ warning: [] })).toBe(false);
});

it('detects populated issues as having issues', () => {
  expect(issues_hasAny({ warning: [warningIssue] })).toBe(true);
});

it('detects error issues as blocking', () => {
  expect(issues_hasBlocking({ error: [warningIssue as never] }, { checks: {} })).toBe(true);
});

it('detects configured blocking issues', () => {
  expect(
    issues_hasBlocking(
      {
        warning: [warningIssue],
      },
      {
        checks: {
          warning: {
            blocking: true,
          },
        },
      },
    ),
  ).toBe(true);
});

it('detects configured non-blocking issues', () => {
  expect(issues_hasBlocking({ warning: [warningIssue] }, { checks: { warning: {} } })).toBe(false);
});

it('creates no issues from empty issues', () => {
  expect(issues_fromIssues('warning', [])).toEqual({});
});

it('creates issues from issues', () => {
  expect(issues_fromIssues('warning', [issue])).toEqual({
    warning: [{ level: 'warning', issue }],
  });
});

it('creates event issues from issues', () => {
  expect(issues_fromIssues('warning', [issue], 'change')).toEqual({
    warning: [{ type: 'change', level: 'warning', issue }],
  });
});
