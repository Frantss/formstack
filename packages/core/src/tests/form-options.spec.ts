import { formOptions } from '#form/form-options';
import type { FormChecksMap, FormCheckValidator } from '#types/api/form-checks-map';
import type { FormOptions } from '#types/api/form-options';
import type { FormStore } from '#types/api/form-store';
import { expect, expectTypeOf, it } from 'vite-plus/test';
import z from 'zod';

const defaults: FormOptions<{ name: string; age: number }> = {
  id: 'form-id',
  schema: z.object({
    name: z.string(),
    age: z.number(),
  }),
  defaultValues: {
    name: 'john',
    age: 20,
  },
  defaultStatus: {
    submits: 1,
    submitting: false,
    validating: false,
    successful: true,
    dirty: true,
  },
  defaultFieldStatus: {
    '*': {
      dirty: true,
    },
    name: {
      touched: true,
      blurred: true,
      dirty: false,
    },
  },
  checks: {
    error: {
      validate: {
        change: store =>
          z.object({
            name: z.string().min(store.values.name.length),
          }),
        submit: store =>
          z.object({
            name: z.string().min(store.values.name.length),
            age: z.number().min(store.values.age),
          }),
        blur: z.object({
          age: z.number().min(10),
        }),
      },
    },
    warning: {
      blocking: false,
      validate: {
        change: z.object({
          name: z.string().min(5),
        }),
        submit: store =>
          z.object({
            name: z.string().min(store.values.name.length),
          }),
      },
    },
    risk: {
      blocking: true,
      validate: {
        submit: z.object({
          name: z.string().min(10),
        }),
      },
    },
  },
};

const setup = (overrides: Partial<Omit<FormOptions<{ name: string; age: number }>, 'schema' | 'defaultValues'>> = {}) =>
  formOptions({
    ...defaults,
    ...overrides,
  });

it('rejects the old event-first checks shape', () => {
  formOptions({
    schema: z.object({
      name: z.string(),
    }),
    defaultValues: {
      name: 'john',
    },
    checks: {
      change: {
        // @ts-expect-error checks are keyed by level, then validate event
        warning: z.object({
          name: z.string().min(5),
        }),
      },
    },
  });
});

it('rejects the old issueLevels option', () => {
  formOptions({
    schema: z.object({
      name: z.string(),
    }),
    defaultValues: {
      name: 'john',
    },
    checks: {
      warning: {
        validate: {
          change: z.object({
            name: z.string().min(5),
          }),
        },
      },
    },
    // @ts-expect-error issue level config now lives under checks[level]
    issueLevels: {
      warning: {
        blocking: false,
      },
    },
  });
});

it('infers defaultValues sub-properties from schema', () => {
  const options = setup();

  expectTypeOf(options.defaultValues.name).toEqualTypeOf<string>();
  expectTypeOf(options.defaultValues.age).toEqualTypeOf<number>();
  expect(options.defaultValues).toEqual({ name: 'john', age: 20 });
});

it('types schema property', () => {
  const options = setup();

  expectTypeOf(options.schema).toEqualTypeOf<FormOptions<{ name: string; age: number }>['schema']>();
});

it('types id property and keeps values', () => {
  const options = setup();

  expectTypeOf(options.id).toEqualTypeOf<string | undefined>();
  expect(options.id).toBe('form-id');
});

it('types defaultStatus sub-properties and keeps values', () => {
  const options = setup();

  expectTypeOf(options.defaultStatus?.submits).toEqualTypeOf<number | undefined>();
  expectTypeOf(options.defaultStatus?.submitting).toEqualTypeOf<boolean | undefined>();
  expectTypeOf(options.defaultStatus?.validating).toEqualTypeOf<boolean | undefined>();
  expectTypeOf(options.defaultStatus?.successful).toEqualTypeOf<boolean | undefined>();
  expectTypeOf(options.defaultStatus?.dirty).toEqualTypeOf<boolean | undefined>();

  expect(options.defaultStatus).toEqual({
    dirty: true,
    submits: 1,
    submitting: false,
    successful: true,
    validating: false,
  });
});

it('types defaultFieldStatus sub-properties and keeps values', () => {
  const options = setup();

  expectTypeOf(options.defaultFieldStatus?.['*']?.dirty).toEqualTypeOf<boolean | undefined>();
  expectTypeOf(options.defaultFieldStatus?.name?.touched).toEqualTypeOf<boolean | undefined>();
  expectTypeOf(options.defaultFieldStatus?.name?.blurred).toEqualTypeOf<boolean | undefined>();
  expectTypeOf(options.defaultFieldStatus?.name?.dirty).toEqualTypeOf<boolean | undefined>();

  expect(options.defaultFieldStatus).toEqual({
    '*': {
      dirty: true,
    },
    name: {
      blurred: true,
      dirty: false,
      touched: true,
    },
  });
});

it('types error issue validate sub-properties', () => {
  const options = setup();

  expectTypeOf(options.checks?.error?.validate?.change).toEqualTypeOf<FormCheckValidator<{ name: string; age: number }> | undefined>();
  expectTypeOf(options.checks?.error?.validate?.submit).toEqualTypeOf<FormCheckValidator<{ name: string; age: number }> | undefined>();
  expectTypeOf(options.checks?.error?.validate?.blur).toEqualTypeOf<FormCheckValidator<{ name: string; age: number }> | undefined>();
  expectTypeOf(options.checks?.error?.validate?.focus).toEqualTypeOf<FormCheckValidator<{ name: string; age: number }> | undefined>();

  expect({
    blur: typeof options.checks?.error?.validate?.blur,
    change: typeof options.checks?.error?.validate?.change,
    focus: typeof options.checks?.error?.validate?.focus,
    submit: typeof options.checks?.error?.validate?.submit,
  }).toEqual({
    blur: 'object',
    change: 'function',
    focus: 'undefined',
    submit: 'function',
  });
});

it('types checks sub-properties', () => {
  const options = setup();

  expectTypeOf(options.checks).toEqualTypeOf<FormChecksMap<{ name: string; age: number }> | undefined>();
  expectTypeOf(options.checks?.warning).toEqualTypeOf<NonNullable<FormChecksMap<{ name: string; age: number }>['warning']> | undefined>();
  expectTypeOf(options.checks?.warning?.blocking).toEqualTypeOf<boolean | undefined>();
  expectTypeOf(options.checks?.warning?.validate?.change).toEqualTypeOf<FormCheckValidator<{ name: string; age: number }> | undefined>();
  expectTypeOf(options.checks?.warning?.validate?.submit).toEqualTypeOf<FormCheckValidator<{ name: string; age: number }> | undefined>();

  const builder = options.checks?.warning?.validate?.submit;
  if (typeof builder === 'function') {
    expectTypeOf(builder).parameter(0).toEqualTypeOf<FormStore<{ name: string; age: number }>>();
  }

  expect({
    riskBlocking: options.checks?.risk?.blocking,
    warningBlocking: options.checks?.warning?.blocking,
    warningChange: typeof options.checks?.warning?.validate?.change,
    warningSubmit: typeof options.checks?.warning?.validate?.submit,
  }).toEqual({
    riskBlocking: true,
    warningBlocking: false,
    warningChange: 'object',
    warningSubmit: 'function',
  });
});
