import { FormCore } from '#form/form-core';
import { FormCoreField } from '#form/form-core-field';
import { FormCoreFields } from '#form/form-core-fields';
import type { FormIssueEntry, FormIssuesByLevel } from '#types/api/form-issue-entry';
import { expect, expectTypeOf, it } from 'vite-plus/test';
import z from 'zod';

import { setup } from '#tests/form-core-field/setup';

const issues: FormIssueEntry[] = [
  { level: 'warning', issue: { code: 'custom', message: 'Name warning', path: ['name'] } as never },
  { level: 'notice', issue: { code: 'custom', message: 'Nested notice', path: ['nested', 'value'] } as never },
];

const setupIssues = () =>
  setup({
    checks: {
      warning: {},
      notice: {},
      risk: {
        blocking: true,
      },
    },
  });

it('returns issues for a specific field', () => {
  const context = setupIssues();

  context.field.setIssues('name', { warning: [issues[0]!] });

  expect(context.field.issues('name').warning).toEqual([issues[0]]);
});

it('returns aggregated nested issues when nested option is enabled', () => {
  const context = setupIssues();

  context.field.setIssues('nested.value', { notice: [issues[1]!] });

  expect(context.field.issues('nested', { nested: true }).notice).toEqual([issues[1]]);
});

it('does not include sibling fields with the same prefix in nested issues', () => {
  const core = new FormCore({
    schema: z.object({
      name: z.string(),
      nameExtra: z.string(),
    }),
    defaultValues: {
      name: 'name',
      nameExtra: 'extra',
    },
  });
  const fields = new FormCoreFields({ core });
  const field = new FormCoreField({ core, fields });

  field.setIssues('name', { warning: [issues[0]!] });
  field.setIssues('nameExtra', {
    warning: [{ level: 'warning', issue: { code: 'custom', message: 'Sibling warning', path: ['nameExtra'] } as never }],
  });

  expect(field.issues('name', { nested: true }).warning).toEqual([issues[0]]);
});

it('appends issues without replacing existing levels', () => {
  const context = setupIssues();

  context.field.setIssues('name', { warning: [issues[0]!] });
  context.field.setIssues('name', { notice: [issues[1]!] }, { mode: 'append' });

  expect(context.field.issues('name')).toMatchObject({
    notice: [issues[1]],
    warning: [issues[0]],
  });
});

it('keeps existing issues when keep mode receives a populated level', () => {
  const context = setupIssues();

  context.field.setIssues('name', { warning: [issues[0]!] });
  context.field.setIssues('name', { notice: [issues[1]!] }, { mode: 'append' });

  context.field.setIssues(
    'name',
    {
      risk: [{ level: 'risk', issue: { code: 'custom', message: 'ignored', path: ['name'] } as never }],
    },
    {
      mode: 'keep',
    },
  );

  expect(context.field.issues('name')).toMatchObject({
    notice: [issues[1]],
    warning: [issues[0]],
  });
});

it('replaces previous issues when replace mode receives a populated level', () => {
  const context = setupIssues();

  context.field.setIssues('name', { warning: [issues[0]!] });
  context.field.setIssues('name', { notice: [issues[1]!] }, { mode: 'append' });

  context.field.setIssues(
    'name',
    {
      risk: [{ level: 'risk', issue: { code: 'custom', message: 'replacement', path: ['name'] } as never }],
    },
    {
      mode: 'replace',
    },
  );

  expect(context.field.issues('name')).toMatchObject({
    notice: [],
    risk: [{ level: 'risk' }],
    warning: [],
  });
});

it('does not expose non-error issues as error issues', () => {
  const context = setupIssues();

  context.field.setIssues('name', { warning: [issues[0]!] });

  expect(context.field.issues('name').error).toEqual([]);
});

const setupErrorIssue = () => {
  const schema = z.object({
    name: z.string(),
  });
  const core = new FormCore({
    schema,
    defaultValues: {
      name: 'name',
    },
    checks: {
      error: {},
    },
  });
  const fields = new FormCoreFields({ core });
  const field = new FormCoreField({ core, fields });
  const issue: FormIssueEntry<'error'> = {
    level: 'error',
    issue: { code: 'custom', message: 'Public error-level issue', path: ['name'] } as never,
  };

  field.setIssues('name', { error: [issue] });

  return {
    core,
    issue,
    field,
  };
};

it('reserves error as the public blocking error issue level', () => {
  const { issue, field } = setupErrorIssue();

  expect(field.issues('name').error).toEqual([issue]);
});

it('marks form invalid when public error issues are set', () => {
  const { core } = setupErrorIssue();

  expect(core.store.state.status.valid).toBe(false);
});

it('types issues reads correctly', () => {
  const context = setupIssues();
  const result = context.field.issues('name');

  expectTypeOf(result).toEqualTypeOf<FormIssuesByLevel<string>>();
  expectTypeOf<(typeof result.error)[number]['level']>().toEqualTypeOf<string>();
});
