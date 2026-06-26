import { FormCore } from '#form/form-core';
import { FormCoreField } from '#form/form-core-field';
import { FormCoreFields } from '#form/form-core-fields';
import { expect, it } from 'vite-plus/test';
import z from 'zod';

const schema = z.object({
  name: z.string().min(3, 'Name is too short'),
  count: z.number(),
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

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>(resolver => {
    resolve = resolver;
  });

  return {
    promise,
    resolve,
  };
};

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

it('validates the entire form when no fields are provided', async () => {
  const context = setup();

  const [valid, issues] = await context.core.validate();

  expect(valid).toBe(false);
  expect(issues).toHaveLength(2);
  expect(context.core.persisted.state.fields['~root.name'].errors).toHaveLength(1);
  expect(context.core.persisted.state.fields['~root.nested.value'].errors).toHaveLength(1);
  expect(context.core.persisted.state.status.validating).toBe(false);
});

it('does not toggle validating status for sync schemas', async () => {
  const context = setup();
  const validatingStates: boolean[] = [];
  const subscription = context.core.persisted.subscribe(() => {
    validatingStates.push(context.core.persisted.state.status.validating);
  });

  await context.core.validate('name');
  expect(validatingStates).not.toContain(true);
  expect(context.core.persisted.state.status.validating).toBe(false);
  subscription.unsubscribe();
});

it('toggles validating status for async schemas', async () => {
  const gate = deferred();
  const asyncSchema = z.object({
    name: z.string().superRefine(async () => {
      await gate.promise;
    }),
    count: z.number(),
    nested: z.object({
      value: z.string(),
    }),
  });

  const core = new FormCore<z.infer<typeof asyncSchema>>({
    schema: asyncSchema,
    defaultValues,
  });
  const validatingStates: boolean[] = [];
  const subscription = core.persisted.subscribe(() => {
    validatingStates.push(core.persisted.state.status.validating);
  });

  const validation = core.validate('name');

  expect(core.persisted.state.status.validating).toBe(true);

  gate.resolve();
  await validation;

  subscription.unsubscribe();
  expect(validatingStates).toContain(true);
  expect(core.persisted.state.status.validating).toBe(false);
});

it('validates only the selected fields when a field list is provided', async () => {
  const context = setup();

  context.field.setErrors('name', [{ code: 'custom', message: 'Existing name error', path: ['name'] } as never]);

  const [valid, issues] = await context.core.validate(['nested']);

  expect(valid).toBe(false);
  expect(issues).toHaveLength(1);
  expect(context.core.persisted.state.fields['~root.nested.value'].errors).toHaveLength(1);
  expect(context.core.persisted.state.fields['~root.name'].errors).toEqual([
    { code: 'custom', message: 'Existing name error', path: ['name'] } as never,
  ]);
});

it('uses the schema for the triggering event type', async () => {
  const context = setup();

  const [baseValid, baseIssues] = await context.core.validate('name');
  const [changeValid, changeIssues] = await context.core.validate('name', {
    type: 'change',
  });

  expect(baseValid).toBe(false);
  expect(baseIssues).toHaveLength(1);
  expect(changeValid).toBe(true);
  expect(changeIssues).toEqual([]);
  expect(context.core.persisted.state.fields['~root.name'].errors).toEqual([]);
});

it('removes old errors when validating a field', async () => {
  const context = setup();

  context.core.set('name', 'valid name');
  context.field.setErrors('name', [{ code: 'custom', message: 'Old error', path: ['name'] } as never]);

  const [valid, issues] = await context.core.validate('name');

  expect(valid).toBe(true);
  expect(issues).toEqual([]);
  expect(context.core.persisted.state.fields['~root.name'].errors).toEqual([]);
});

it('removes errors when a validated field is no longer invalid', async () => {
  const context = setup();

  const [firstValid, firstIssues] = await context.core.validate('name');
  expect(firstValid).toBe(false);
  expect(firstIssues).toHaveLength(1);
  expect(context.core.persisted.state.fields['~root.name'].errors).toHaveLength(1);

  context.core.set('name', 'valid name');

  const [secondValid, secondIssues] = await context.core.validate('name');

  expect(secondValid).toBe(true);
  expect(secondIssues).toEqual([]);
  expect(context.core.persisted.state.fields['~root.name'].errors).toEqual([]);
});
