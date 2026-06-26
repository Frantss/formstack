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
    validate: {
      change: z.object({
        name: z.string().min(2, 'Name is too short for change'),
      }),
    },
  });
  const fields = new FormCoreFields<Values>({ core });
  const field = new FormCoreField<Values>({ core, fields });

  return {
    core,
    field,
  };
};

it('validates using current values and updates descendant field errors', async () => {
  const context = setup();

  await context.core.validate('nested');

  expect(context.field.errors('nested')).toEqual([]);
  expect(context.field.errors('nested.value')).toHaveLength(1);
  expect(context.field.errors('nested.value')[0]?.message).toBe('Nested value is too short');
});

it('clears old errors for the validated subtree and keeps unrelated field errors', async () => {
  const context = setup();

  context.field.setErrors('nested.value', [
    {
      code: 'custom',
      message: 'old nested issue',
      path: ['nested', 'value'],
    } as never,
  ]);
  context.field.setErrors('name', [{ code: 'custom', message: 'name issue', path: ['name'] } as never]);

  await context.core.validate('nested');

  expect(context.field.errors('nested.value')).toHaveLength(1);
  expect(context.field.errors('nested.value')[0]?.message).toBe('Nested value is too short');
  expect(context.field.errors('name')).toEqual([{ code: 'custom', message: 'name issue', path: ['name'] } as never]);
});

it('uses the event validator when a validation type is provided', async () => {
  const context = setup();

  const [, baseIssues] = await context.core.validate('name');
  const [, changeIssues] = await context.core.validate('name', {
    type: 'change',
  });

  expect(baseIssues).toHaveLength(1);
  expect(changeIssues).toEqual([]);
  expect(context.field.errors('name')).toEqual([]);
});
