import { formOptions } from '#form/form-options';
import type { FormOptions, FormValidator } from '#types/api/form-options';
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
};

const setup = (overrides: Partial<Omit<FormOptions<{ name: string; age: number }>, 'schema' | 'defaultValues'>> = {}) =>
  formOptions({
    ...defaults,
    ...overrides,
  });

it('infers defaultValues sub-properties from schema', () => {
  const options = setup();

  expectTypeOf(options.defaultValues.name).toEqualTypeOf<string>();
  expectTypeOf(options.defaultValues.age).toEqualTypeOf<number>();
  expect(options.defaultValues.name).toBe('john');
  expect(options.defaultValues.age).toBe(20);
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

  expect(options.defaultStatus?.submits).toBe(1);
  expect(options.defaultStatus?.submitting).toBe(false);
  expect(options.defaultStatus?.validating).toBe(false);
  expect(options.defaultStatus?.successful).toBe(true);
  expect(options.defaultStatus?.dirty).toBe(true);
});

it('types defaultFieldStatus sub-properties and keeps values', () => {
  const options = setup();

  expectTypeOf(options.defaultFieldStatus?.['*']?.dirty).toEqualTypeOf<boolean | undefined>();
  expectTypeOf(options.defaultFieldStatus?.name?.touched).toEqualTypeOf<boolean | undefined>();
  expectTypeOf(options.defaultFieldStatus?.name?.blurred).toEqualTypeOf<boolean | undefined>();
  expectTypeOf(options.defaultFieldStatus?.name?.dirty).toEqualTypeOf<boolean | undefined>();

  expect(options.defaultFieldStatus?.['*']?.dirty).toBe(true);
  expect(options.defaultFieldStatus?.name?.touched).toBe(true);
  expect(options.defaultFieldStatus?.name?.blurred).toBe(true);
  expect(options.defaultFieldStatus?.name?.dirty).toBe(false);
});

it('types validate sub-properties', () => {
  const options = setup();

  expectTypeOf(options.validate?.change).toEqualTypeOf<FormValidator<{ name: string; age: number }> | undefined>();
  expectTypeOf(options.validate?.submit).toEqualTypeOf<FormValidator<{ name: string; age: number }> | undefined>();
  expectTypeOf(options.validate?.blur).toEqualTypeOf<FormValidator<{ name: string; age: number }> | undefined>();
  expectTypeOf(options.validate?.focus).toEqualTypeOf<FormValidator<{ name: string; age: number }> | undefined>();

  expect(typeof options.validate?.change).toBe('function');
  expect(typeof options.validate?.submit).toBe('function');
  expect(typeof options.validate?.blur).toBe('object');
  expect(typeof options.validate?.focus).toBe('undefined');
});
