import { FormCore } from '#form/form-core';
import { FormCoreField } from '#form/form-core-field';
import { FormCoreFields } from '#form/form-core-fields';
import { expect, it, vi } from 'vite-plus/test';
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

it('validates the entire form when no fields are provided', async () => {
  const context = setup();

  const [valid, issues] = await context.core.validate();

  expect({
    nameErrors: context.core.store.state.fields['~root.name'].issues.error.length,
    nestedErrors: context.core.store.state.fields['~root.nested.value'].issues.error.length,
    returnedErrors: issues.error.length,
    valid,
    validating: context.core.persisted.state.status.validating,
  }).toEqual({
    nameErrors: 1,
    nestedErrors: 1,
    returnedErrors: 2,
    valid: false,
    validating: false,
  });
});

it('stores root-level validation issues on the root field', async () => {
  const core = new FormCore<Values>({
    schema: {
      '~standard': {
        validate: () => ({
          issues: [{ code: 'custom', message: 'Root issue', path: [] }] as never,
        }),
      },
    } as never,
    defaultValues,
  });

  const [valid, issues] = await core.validate();

  expect({
    rootIssues: core.store.state.fields['~root'].issues.error,
    returnedIssues: issues.error,
    valid,
  }).toEqual({
    rootIssues: [{ level: 'error', issue: { code: 'custom', message: 'Root issue', path: [] } as never }],
    returnedIssues: [{ level: 'error', issue: { code: 'custom', message: 'Root issue', path: [] } as never }],
    valid: false,
  });
});

it('does not toggle validating status for sync schemas', async () => {
  const context = setup();
  const validatingStates: boolean[] = [];
  const subscription = context.core.persisted.subscribe(() => {
    validatingStates.push(context.core.persisted.state.status.validating);
  });

  await context.core.validate('name');
  subscription.unsubscribe();

  expect({
    toggled: validatingStates.includes(true),
    validating: context.core.persisted.state.status.validating,
  }).toEqual({
    toggled: false,
    validating: false,
  });
});

it('keeps validating state unchanged when setting the current value', () => {
  const context = setup();
  const state = context.core.persisted.state;
  const setValidating = (
    context.core as unknown as {
      setValidating: (validating: boolean) => void;
    }
  ).setValidating;

  setValidating(false);

  expect(context.core.persisted.state).toBe(state);
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

  gate.resolve();
  await validation;

  subscription.unsubscribe();
  expect({
    toggled: validatingStates.includes(true),
    validating: core.persisted.state.status.validating,
  }).toEqual({
    toggled: true,
    validating: false,
  });
});

it('keeps validating status active for concurrent async schemas', async () => {
  const gate = deferred();
  const asyncSchema = z.object({
    name: z.string().superRefine(async () => {
      await gate.promise;
    }),
    count: z.number(),
    nested: z.object({
      value: z.string().superRefine(async () => {
        await gate.promise;
      }),
    }),
  });
  const core = new FormCore<z.infer<typeof asyncSchema>>({
    schema: asyncSchema,
    defaultValues,
  });

  const firstValidation = core.validate('name');
  const secondValidation = core.validate('nested.value');

  gate.resolve();
  await Promise.all([firstValidation, secondValidation]);

  expect(core.persisted.state.status.validating).toBe(false);
});

it('validates only the selected fields when a field list is provided', async () => {
  const context = setup();

  context.field.setIssues('name', {
    error: [{ level: 'error', issue: { code: 'custom', message: 'Existing name error', path: ['name'] } as never }],
  });

  const [valid, issues] = await context.core.validate(['nested']);

  expect({
    nameIssues: context.core.store.state.fields['~root.name'].issues.error,
    nestedErrors: context.core.store.state.fields['~root.nested.value'].issues.error.length,
    returnedErrors: issues.error.length,
    valid,
  }).toEqual({
    nameIssues: [{ level: 'error', issue: { code: 'custom', message: 'Existing name error', path: ['name'] } as never }],
    nestedErrors: 1,
    returnedErrors: 1,
    valid: false,
  });
});

it('uses the schema for the triggering event type', async () => {
  const context = setup();

  const [baseValid, baseIssues] = await context.core.validate('name');
  const [changeValid, changeIssues] = await context.core.validate('name', {
    type: 'change',
  });

  expect({
    baseErrors: baseIssues.error.length,
    baseValid,
    changeIssues: changeIssues.error,
    changeValid,
    storedIssues: context.core.store.state.fields['~root.name'].issues.error,
  }).toEqual({
    baseErrors: 1,
    baseValid: false,
    changeIssues: [],
    changeValid: true,
    storedIssues: [],
  });
});

it('uses schema builders for the triggering event type', async () => {
  let builderValues: Values | undefined;
  const schemaBuilder = vi.fn((store: { values: Values }) => {
    builderValues = store.values;

    return z.object({
      name: z.string().min(3, 'Name is too short from builder'),
    });
  });
  const core = new FormCore<Values>({
    schema,
    defaultValues,
    checks: {
      error: {
        validate: {
          change: schemaBuilder as never,
        },
      },
    },
  });

  const [valid, issues] = await core.validate('name', { type: 'change' });

  expect({
    builderCalls: schemaBuilder.mock.calls.length,
    builderValues,
    errors: issues.error.length,
    valid,
  }).toEqual({
    builderCalls: 1,
    builderValues: defaultValues,
    errors: 1,
    valid: false,
  });
});

it('removes old error issues when validating a field', async () => {
  const context = setup();

  context.core.set('name', 'valid name');
  context.field.setIssues('name', {
    error: [{ level: 'error', issue: { code: 'custom', message: 'Old error', path: ['name'] } as never }],
  });

  const [valid, issues] = await context.core.validate('name');

  expect({
    returnedIssues: issues.error,
    storedIssues: context.core.store.state.fields['~root.name'].issues.error,
    valid,
  }).toEqual({
    returnedIssues: [],
    storedIssues: [],
    valid: true,
  });
});

it('stores error issues when a validated field is invalid', async () => {
  const context = setup();

  const [firstValid, firstIssues] = await context.core.validate('name');

  expect({
    returnedErrors: firstIssues.error.length,
    storedErrors: context.core.store.state.fields['~root.name'].issues.error.length,
    valid: firstValid,
  }).toEqual({
    returnedErrors: 1,
    storedErrors: 1,
    valid: false,
  });
});

it('removes error issues when a validated field is no longer invalid', async () => {
  const context = setup();

  await context.core.validate('name');

  context.core.set('name', 'valid name');

  const [secondValid, secondIssues] = await context.core.validate('name');

  expect({
    returnedIssues: secondIssues.error,
    storedIssues: context.core.store.state.fields['~root.name'].issues.error,
    valid: secondValid,
  }).toEqual({
    returnedIssues: [],
    storedIssues: [],
    valid: true,
  });
});

it('ignores stale async errors when the target value changes before validation resolves', async () => {
  const gate = deferred();
  const asyncSchema = {
    '~standard': {
      validate: async (values: Values) => {
        await gate.promise;

        return {
          issues: [{ code: 'custom', message: `Stale ${values.name}`, path: ['name'] }] as never,
        };
      },
    },
  };
  const core = new FormCore<Values>({
    schema: asyncSchema as never,
    defaultValues: {
      ...defaultValues,
      name: 'stale name',
    },
  });

  const validation = core.validate('name');
  core.set('name', 'valid name');

  gate.resolve();
  const [valid, issues] = await validation;

  expect({
    returnedIssues: issues.error,
    storedIssues: core.store.state.fields['~root.name'].issues.error,
    valid,
  }).toEqual({
    returnedIssues: [],
    storedIssues: [],
    valid: true,
  });
});

it('keeps async errors current when an unrelated target changes before validation resolves', async () => {
  const gate = deferred();
  const asyncSchema = {
    '~standard': {
      validate: async () => {
        await gate.promise;

        return {
          issues: [{ code: 'custom', message: 'Name error', path: ['name'] }] as never,
        };
      },
    },
  };
  const core = new FormCore<Values>({
    schema: asyncSchema as never,
    defaultValues,
  });

  const validation = core.validate('name');
  core.set('nested.value', 'changed');

  gate.resolve();
  const [valid, issues] = await validation;

  expect({
    returnedErrors: issues.error.length,
    storedIssues: core.store.state.fields['~root.name'].issues.error,
    valid,
  }).toEqual({
    returnedErrors: 1,
    storedIssues: [{ level: 'error', issue: { code: 'custom', message: 'Name error', path: ['name'] } as never }],
    valid: false,
  });
});
