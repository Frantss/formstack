import { FormCore } from '#form/form-core';
import { FormCoreField } from '#form/form-core-field';
import { FormCoreFields } from '#form/form-core-fields';
import { expect, it } from 'vite-plus/test';
import z from 'zod';

const schema = z.object({
  name: z.string().min(3, 'Name is too short'),
  count: z.number().min(1, 'Count must be positive'),
  nested: z.object({
    value: z.string().min(3, 'Nested value is too short'),
  }),
});

const defaultValues = {
  name: 'ab',
  count: 1,
  nested: {
    value: '',
  },
};

type Values = z.infer<typeof schema>;

const setup = () => {
  const core = new FormCore<Values>({
    schema,
    defaultValues,
    checks: {
      error: {
        validate: {
          change: z.object({
            name: z.string().min(2, 'Name is too short for change'),
          }),
        },
      },
    },
  });
  const fields = new FormCoreFields<Values>({ core });
  const field = new FormCoreField<Values>({ core, fields });

  return {
    core,
    field,
  };
};

it('does not store descendant validation errors on the parent field', async () => {
  const context = setup();

  await context.core.validate('nested');

  expect(context.field.issues('nested').error).toEqual([]);
});

it('stores descendant validation errors on the descendant field', async () => {
  const context = setup();

  await context.core.validate('nested');

  expect(context.field.issues('nested.value').error).toHaveLength(1);
});

it('stores descendant validation error messages on the descendant field', async () => {
  const context = setup();

  await context.core.validate('nested');

  expect(context.field.issues('nested.value').error[0]?.issue.message).toBe('Nested value is too short');
});

it('clears old error issues for the validated subtree', async () => {
  const context = setup();

  context.field.setIssues('nested.value', {
    error: [
      {
        level: 'error',
        issue: {
          code: 'custom',
          message: 'old nested issue',
          path: ['nested', 'value'],
        } as never,
      },
    ],
  });
  context.field.setIssues('name', {
    error: [{ level: 'error', issue: { code: 'custom', message: 'name issue', path: ['name'] } as never }],
  });

  await context.core.validate('nested');

  expect(context.field.issues('nested.value').error).toHaveLength(1);
});

it('replaces cleared subtree issues with current validation messages', async () => {
  const context = setup();

  context.field.setIssues('nested.value', {
    error: [
      {
        level: 'error',
        issue: {
          code: 'custom',
          message: 'old nested issue',
          path: ['nested', 'value'],
        } as never,
      },
    ],
  });

  await context.core.validate('nested');

  expect(context.field.issues('nested.value').error[0]?.issue.message).toBe('Nested value is too short');
});

it('keeps unrelated field error issues when validating a subtree', async () => {
  const context = setup();

  context.field.setIssues('name', {
    error: [{ level: 'error', issue: { code: 'custom', message: 'name issue', path: ['name'] } as never }],
  });

  await context.core.validate('nested');

  expect(context.field.issues('name').error).toEqual([{ level: 'error', issue: { code: 'custom', message: 'name issue', path: ['name'] } as never }]);
});

it('uses the base validator when no validation type is provided', async () => {
  const context = setup();

  const [, baseIssues] = await context.core.validate('name');

  expect(baseIssues.error).toHaveLength(1);
});

it('uses the event validator when a validation type is provided', async () => {
  const context = setup();

  const [, changeIssues] = await context.core.validate('name', {
    type: 'change',
  });

  expect(changeIssues.error).toEqual([]);
});

it('clears previous field issues when the event validator passes', async () => {
  const context = setup();

  await context.core.validate('name');
  await context.core.validate('name', {
    type: 'change',
  });

  expect(context.field.issues('name').error).toEqual([]);
});
