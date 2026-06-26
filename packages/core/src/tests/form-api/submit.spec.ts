import { FormApi } from '#form/form-api';
import type { FormIssue } from '#types/api/form-issue';
import type { FormSubmitErrorHandler } from '#types/api/form-submit-error-handler';
import type { FormSubmitSuccessHandler } from '#types/api/form-submit-success-handler';
import { expect, expectTypeOf, it, vi } from 'vite-plus/test';
import z from 'zod';

const baseSchema = z.object({
  name: z.string().min(3, 'Name is too short'),
});

type Values = z.infer<typeof baseSchema>;

const setup = (defaultValues: Values) => {
  const form = new FormApi<Values>({
    schema: baseSchema,
    defaultValues,
    validate: {
      submit: z.object({
        name: z.string().min(5, 'Name is too short for submit'),
      }),
    },
  });
  return {
    form,
  };
};

it('calls onSuccess and updates status when submit validation passes', async () => {
  const context = setup({ name: 'valid' });
  const onSuccess = vi.fn(async () => {});
  const onError = vi.fn(async () => {});

  await context.form.submit(onSuccess, onError)();

  expect(onSuccess).toHaveBeenCalledOnce();
  expect(onSuccess).toHaveBeenCalledWith({ name: 'valid' }, context.form);
  expect(onError).not.toHaveBeenCalled();
  expect(context.form.status.submits).toBe(1);
  expect(context.form.status.submitting).toBe(false);
  expect(context.form.status.successful).toBe(true);
  expect(context.form.status.dirty).toBe(true);
});

it('calls onError and updates status when submit validation fails', async () => {
  const context = setup({ name: 'bad' });
  const onSuccess = vi.fn(async () => {});
  const onError = vi.fn(async () => {});

  await context.form.submit(onSuccess, onError)();

  expect(onSuccess).not.toHaveBeenCalled();
  expect(onError).toHaveBeenCalledOnce();
  expect(onError).toHaveBeenCalledWith(expect.any(Array), context.form);
  expect(context.form.field.errors('name')).toHaveLength(1);
  expect(context.form.status.submits).toBe(1);
  expect(context.form.status.submitting).toBe(false);
  expect(context.form.status.successful).toBe(false);
  expect(context.form.status.dirty).toBe(true);
});

it('uses submit validator when provided', async () => {
  const context = setup({ name: 'four' });
  const onSuccess = vi.fn(async () => {});
  const onError = vi.fn(async () => {});

  await context.form.submit(onSuccess, onError)();

  expect(onSuccess).not.toHaveBeenCalled();
  expect(onError).toHaveBeenCalledOnce();
  expect(context.form.field.errors('name')[0]?.message).toBe('Name is too short for submit');
});

it('types callback second argument as FormApi', () => {
  const context = setup({ name: 'valid' });

  const onSuccess: FormSubmitSuccessHandler<Values> = (values, form) => {
    expectTypeOf(values).toEqualTypeOf<Values>();
    expectTypeOf(form).toEqualTypeOf<FormApi<Values>>();
  };
  const onError: FormSubmitErrorHandler<Values> = (issues, form) => {
    expectTypeOf(issues).toEqualTypeOf<FormIssue[]>();
    expectTypeOf(form).toEqualTypeOf<FormApi<Values>>();
  };

  void context.form.submit(onSuccess, onError);
});

it('creates id when id is not provided', () => {
  const form = new FormApi<Values>({
    schema: baseSchema,
    defaultValues: {
      name: 'valid',
    },
  });

  expect(form.id).toBeTypeOf('string');
  expect(form.id.length).toBeGreaterThan(0);
});

it('uses provided id', () => {
  const form = new FormApi<Values>({
    id: 'provided-form-id',
    schema: baseSchema,
    defaultValues: {
      name: 'valid',
    },
  });

  expect(form.id).toBe('provided-form-id');
});
