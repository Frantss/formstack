import { FormApi } from '#form/form-api';
import type { FormIssuesByLevel } from '#types/api/form-issue-entry';
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
    checks: {
      error: {
        validate: {
          submit: z.object({
            name: z.string().min(5, 'Name is too short for submit'),
          }),
        },
      },
    },
  });

  return {
    form,
  };
};

const submitWithHandlers = async (form: FormApi<Values>) => {
  const onSuccess = vi.fn<FormSubmitSuccessHandler<Values>>(async () => {});
  const onError = vi.fn<FormSubmitErrorHandler<Values>>(async () => {});

  await form.submit(onSuccess, onError)();

  return {
    onError,
    onSuccess,
  };
};

const setupNonBlockingIssues = () =>
  new FormApi<Values>({
    schema: baseSchema,
    defaultValues: { name: 'valid' },
    checks: {
      warning: {
        blocking: false,
        validate: {
          submit: z.object({
            name: z.string().min(10, 'Suspiciously short but allowed'),
          }),
        },
      },
    },
  });

const setupBlockingIssues = () =>
  new FormApi<Values>({
    schema: baseSchema,
    defaultValues: { name: 'valid' },
    checks: {
      risk: {
        blocking: true,
        validate: {
          submit: z.object({
            name: z.string().min(10, 'Blocked by risk issues'),
          }),
        },
      },
    },
  });

it('calls onSuccess with values and form when submit validation passes', async () => {
  const context = setup({ name: 'valid' });
  const { onSuccess } = await submitWithHandlers(context.form);

  expect(onSuccess.mock.calls).toEqual([[{ name: 'valid' }, context.form]]);
});

it('does not call onError when submit validation passes', async () => {
  const context = setup({ name: 'valid' });
  const { onError } = await submitWithHandlers(context.form);

  expect(onError).not.toHaveBeenCalled();
});

it('increments submit count when submit validation passes', async () => {
  const context = setup({ name: 'valid' });

  await submitWithHandlers(context.form);

  expect(context.form.status.submits).toBe(1);
});

it('clears submitting status when submit validation passes', async () => {
  const context = setup({ name: 'valid' });

  await submitWithHandlers(context.form);

  expect(context.form.status.submitting).toBe(false);
});

it('marks submit as successful when validation passes', async () => {
  const context = setup({ name: 'valid' });

  await submitWithHandlers(context.form);

  expect(context.form.status.successful).toBe(true);
});

it('marks form dirty after successful submit', async () => {
  const context = setup({ name: 'valid' });

  await submitWithHandlers(context.form);

  expect(context.form.status.dirty).toBe(true);
});

it('allows submit success when only non-blocking issues exist', async () => {
  const form = setupNonBlockingIssues();
  const { onSuccess } = await submitWithHandlers(form);

  expect(onSuccess).toHaveBeenCalledOnce();
});

it('does not call onError when only non-blocking issues exist', async () => {
  const form = setupNonBlockingIssues();
  const { onError } = await submitWithHandlers(form);

  expect(onError).not.toHaveBeenCalled();
});

it('stores non-blocking issues during allowed submit success', async () => {
  const form = setupNonBlockingIssues();

  await submitWithHandlers(form);

  expect(form.field.issues('name').warning).toHaveLength(1);
});

it('marks submit successful when only non-blocking issues exist', async () => {
  const form = setupNonBlockingIssues();

  await submitWithHandlers(form);

  expect(form.status.successful).toBe(true);
});

it('does not call onSuccess when blocking issues exist', async () => {
  const form = setupBlockingIssues();
  const { onSuccess } = await submitWithHandlers(form);

  expect(onSuccess).not.toHaveBeenCalled();
});

it('passes blocking issues to onError', async () => {
  const form = setupBlockingIssues();
  const { onError } = await submitWithHandlers(form);

  expect(onError.mock.calls[0]![0].risk[0]?.issue.message).toBe('Blocked by risk issues');
});

it('stores blocking issues on the field', async () => {
  const form = setupBlockingIssues();

  await submitWithHandlers(form);

  expect(form.field.issues('name').risk).toHaveLength(1);
});

it('marks submit unsuccessful when blocking issues exist', async () => {
  const form = setupBlockingIssues();

  await submitWithHandlers(form);

  expect(form.status.successful).toBe(false);
});

it('does not call onSuccess when manual blocking issues already exist', async () => {
  const form = new FormApi<Values>({
    schema: baseSchema,
    defaultValues: { name: 'valid' },
    checks: {
      risk: {
        blocking: true,
      },
    },
  });
  form.field.setIssues('name', {
    risk: [{ level: 'risk', issue: { code: 'custom', message: 'Manual risk', path: ['name'] } as never }],
  });

  const { onSuccess } = await submitWithHandlers(form);

  expect(onSuccess).not.toHaveBeenCalled();
});

it('passes manual blocking issues to onError', async () => {
  const form = new FormApi<Values>({
    schema: baseSchema,
    defaultValues: { name: 'valid' },
    checks: {
      risk: {
        blocking: true,
      },
    },
  });
  form.field.setIssues('name', {
    risk: [{ level: 'risk', issue: { code: 'custom', message: 'Manual risk', path: ['name'] } as never }],
  });

  const { onError } = await submitWithHandlers(form);

  expect(onError.mock.calls[0]![0].risk[0]?.issue.message).toBe('Manual risk');
});

it('marks form invalid when manual blocking issues already exist', async () => {
  const form = new FormApi<Values>({
    schema: baseSchema,
    defaultValues: { name: 'valid' },
    checks: {
      risk: {
        blocking: true,
      },
    },
  });
  form.field.setIssues('name', {
    risk: [{ level: 'risk', issue: { code: 'custom', message: 'Manual risk', path: ['name'] } as never }],
  });

  await submitWithHandlers(form);

  expect(form.status.valid).toBe(false);
});

it('marks submit unsuccessful when manual blocking issues already exist', async () => {
  const form = new FormApi<Values>({
    schema: baseSchema,
    defaultValues: { name: 'valid' },
    checks: {
      risk: {
        blocking: true,
      },
    },
  });
  form.field.setIssues('name', {
    risk: [{ level: 'risk', issue: { code: 'custom', message: 'Manual risk', path: ['name'] } as never }],
  });

  await submitWithHandlers(form);

  expect(form.status.successful).toBe(false);
});

it('does not call onSuccess when blocking issues from another event already exist', async () => {
  const form = new FormApi<Values>({
    schema: baseSchema,
    defaultValues: { name: 'valid' },
    checks: {
      risk: {
        blocking: true,
        validate: {
          change: z.object({
            name: z.string().min(10, 'Change risk'),
          }),
        },
      },
    },
  });

  await form.validate(undefined, { type: 'change' });
  const { onSuccess } = await submitWithHandlers(form);

  expect(onSuccess).not.toHaveBeenCalled();
});

it('passes blocking issues from another event to onError', async () => {
  const form = new FormApi<Values>({
    schema: baseSchema,
    defaultValues: { name: 'valid' },
    checks: {
      risk: {
        blocking: true,
        validate: {
          change: z.object({
            name: z.string().min(10, 'Change risk'),
          }),
        },
      },
    },
  });

  await form.validate(undefined, { type: 'change' });
  const { onError } = await submitWithHandlers(form);

  expect(onError.mock.calls[0]![0].risk[0]?.type).toBe('change');
});

it('keeps blocking issues from another event on the field', async () => {
  const form = new FormApi<Values>({
    schema: baseSchema,
    defaultValues: { name: 'valid' },
    checks: {
      risk: {
        blocking: true,
        validate: {
          change: z.object({
            name: z.string().min(10, 'Change risk'),
          }),
        },
      },
    },
  });

  await form.validate(undefined, { type: 'change' });
  await submitWithHandlers(form);

  expect(form.field.issues('name').risk[0]?.type).toBe('change');
});

it('marks submit unsuccessful when blocking issues from another event already exist', async () => {
  const form = new FormApi<Values>({
    schema: baseSchema,
    defaultValues: { name: 'valid' },
    checks: {
      risk: {
        blocking: true,
        validate: {
          change: z.object({
            name: z.string().min(10, 'Change risk'),
          }),
        },
      },
    },
  });

  await form.validate(undefined, { type: 'change' });
  await submitWithHandlers(form);

  expect(form.status.successful).toBe(false);
});

it('allows submit success when only existing non-blocking issues exist', async () => {
  const form = new FormApi<Values>({
    schema: baseSchema,
    defaultValues: { name: 'valid' },
    checks: {
      warning: {
        blocking: false,
      },
    },
  });
  form.field.setIssues('name', {
    warning: [{ level: 'warning', issue: { code: 'custom', message: 'Manual warning', path: ['name'] } as never }],
  });

  const { onSuccess } = await submitWithHandlers(form);

  expect(onSuccess).toHaveBeenCalledOnce();
});

it('does not call onError when only existing non-blocking issues exist', async () => {
  const form = new FormApi<Values>({
    schema: baseSchema,
    defaultValues: { name: 'valid' },
    checks: {
      warning: {
        blocking: false,
      },
    },
  });
  form.field.setIssues('name', {
    warning: [{ level: 'warning', issue: { code: 'custom', message: 'Manual warning', path: ['name'] } as never }],
  });

  const { onError } = await submitWithHandlers(form);

  expect(onError).not.toHaveBeenCalled();
});

it('keeps form valid when only existing non-blocking issues exist', async () => {
  const form = new FormApi<Values>({
    schema: baseSchema,
    defaultValues: { name: 'valid' },
    checks: {
      warning: {
        blocking: false,
      },
    },
  });
  form.field.setIssues('name', {
    warning: [{ level: 'warning', issue: { code: 'custom', message: 'Manual warning', path: ['name'] } as never }],
  });

  await submitWithHandlers(form);

  expect(form.status.valid).toBe(true);
});

it('marks submit successful when only existing non-blocking issues exist', async () => {
  const form = new FormApi<Values>({
    schema: baseSchema,
    defaultValues: { name: 'valid' },
    checks: {
      warning: {
        blocking: false,
      },
    },
  });
  form.field.setIssues('name', {
    warning: [{ level: 'warning', issue: { code: 'custom', message: 'Manual warning', path: ['name'] } as never }],
  });

  await submitWithHandlers(form);

  expect(form.status.successful).toBe(true);
});

it('does not call onSuccess when submit validation fails', async () => {
  const context = setup({ name: 'bad' });
  const { onSuccess } = await submitWithHandlers(context.form);

  expect(onSuccess).not.toHaveBeenCalled();
});

it('calls onError when submit validation fails', async () => {
  const context = setup({ name: 'bad' });
  const { onError } = await submitWithHandlers(context.form);

  expect(onError).toHaveBeenCalledOnce();
});

it('stores field issues when submit validation fails', async () => {
  const context = setup({ name: 'bad' });

  await submitWithHandlers(context.form);

  expect(context.form.field.issues('name').error).toHaveLength(1);
});

it('increments submit count when submit validation fails', async () => {
  const context = setup({ name: 'bad' });

  await submitWithHandlers(context.form);

  expect(context.form.status.submits).toBe(1);
});

it('clears submitting status when submit validation fails', async () => {
  const context = setup({ name: 'bad' });

  await submitWithHandlers(context.form);

  expect(context.form.status.submitting).toBe(false);
});

it('marks submit unsuccessful when validation fails', async () => {
  const context = setup({ name: 'bad' });

  await submitWithHandlers(context.form);

  expect(context.form.status.successful).toBe(false);
});

it('marks form dirty after failed submit', async () => {
  const context = setup({ name: 'bad' });

  await submitWithHandlers(context.form);

  expect(context.form.status.dirty).toBe(true);
});

it('does not call onSuccess when submit validator rejects the value', async () => {
  const context = setup({ name: 'four' });
  const { onSuccess } = await submitWithHandlers(context.form);

  expect(onSuccess).not.toHaveBeenCalled();
});

it('calls onError when submit validator rejects the value', async () => {
  const context = setup({ name: 'four' });
  const { onError } = await submitWithHandlers(context.form);

  expect(onError).toHaveBeenCalledOnce();
});

it('uses submit validator issues when provided', async () => {
  const context = setup({ name: 'four' });

  await submitWithHandlers(context.form);

  expect(context.form.field.issues('name').error[0]?.issue.message).toBe('Name is too short for submit');
});

it('types callback second argument as FormApi', () => {
  const context = setup({ name: 'valid' });

  const onSuccess: FormSubmitSuccessHandler<Values> = (values, form) => {
    expectTypeOf(values).toEqualTypeOf<Values>();
    expectTypeOf(form).toEqualTypeOf<FormApi<Values>>();
  };
  const onError: FormSubmitErrorHandler<Values> = (issues, form) => {
    expectTypeOf(issues).toEqualTypeOf<FormIssuesByLevel<string>>();
    expectTypeOf(form).toEqualTypeOf<FormApi<Values>>();
  };

  void context.form.submit(onSuccess, onError);
});

it('types validation results', async () => {
  const context = setup({ name: 'valid' });
  const result = await context.form.validate('name');

  expectTypeOf(result).toEqualTypeOf<[boolean, FormIssuesByLevel<string>]>();
});

it('exposes form options', () => {
  const context = setup({ name: 'valid' });

  expect(context.form.options.defaultValues).toEqual({ name: 'valid' });
});

it('exposes form store values', () => {
  const context = setup({ name: 'valid' });

  context.form.field.change('name', 'changed');

  expect(context.form.store.state.values).toEqual({ name: 'changed' });
});

it('exposes form values', () => {
  const context = setup({ name: 'valid' });

  context.form.field.change('name', 'changed');

  expect(context.form.values).toEqual({ name: 'changed' });
});

it('exposes dirty form status', () => {
  const context = setup({ name: 'valid' });

  context.form.field.change('name', 'changed');

  expect(context.form.status.dirty).toBe(true);
});

it('validates through the form api', async () => {
  const context = setup({ name: 'valid' });

  const [valid] = await context.form.validate();

  expect(valid).toBe(true);
});

it('resets through the form api', () => {
  const context = setup({ name: 'valid' });

  context.form.field.change('name', 'changed');
  context.form.reset();

  expect(context.form.values).toEqual({ name: 'valid' });
});

it('mounts form api with an unmount function', () => {
  const context = setup({ name: 'valid' });
  const unmount = context.form['~mount']();

  expect(unmount).toBeTypeOf('function');
  unmount();
});

it('creates id when id is not provided', () => {
  const form = new FormApi<Values>({
    schema: baseSchema,
    defaultValues: {
      name: 'valid',
    },
  });

  expect(form.id).toBeTypeOf('string');
});

it('creates a non-empty id when id is not provided', () => {
  const form = new FormApi<Values>({
    schema: baseSchema,
    defaultValues: {
      name: 'valid',
    },
  });

  expect(form.id.length).toBeGreaterThan(0);
});

it('uses provided id when constructing a form api', () => {
  const form = new FormApi<Values>({
    id: 'provided-form-id',
    schema: baseSchema,
    defaultValues: {
      name: 'valid',
    },
  });

  expect(form.id).toBe('provided-form-id');
});
