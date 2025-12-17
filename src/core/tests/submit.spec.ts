import { FormApi } from '#/core/form-api';
import { viPromise } from '#/utils/tests';
import { afterAll, describe, expect, it, vi } from 'vitest';
import z from 'zod';

const schema = z.object({
  name: z.string(),
  nested: z.object({
    deep: z.object({
      deeper: z.string().array(),
    }),
  }),
});

const validValues = {
  name: 'John',
  nested: {
    deep: {
      deeper: ['hello'],
    },
  },
};

const setup = async ({ values }: { values: z.infer<typeof schema> }) => {
  const form = new FormApi({
    schema,
    defaultValues: values,
  });

  form['~mount']();

  return { form };
};

describe('on success', async () => {
  const { form } = await setup({ values: validValues });

  const onSuccess = vi.fn();
  const onError = vi.fn();

  await form.submit(onSuccess, onError)();

  it('should call onSuccess', () => {
    expect(onError).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(onSuccess).toHaveBeenCalledWith(validValues, form);
  });

  it('mark form as successful', () => {
    expect(form.store.state.status.successful).toBe(true);
  });

  it('should reset the submitting status', () => {
    expect(form.store.state.status.submitting).toBe(false);
  });

  it('should reset the validating status', () => {
    expect(form.store.state.status.validating).toBe(false);
  });

  it('should increase the submits count', () => {
    expect(form.store.state.status.submits).toBe(1);
  });

  it('should mark the form as valid', () => {
    expect(form.store.state.status.valid).toBe(true);
  });

  it('should mark the form as dirty', () => {
    expect(form.store.state.status.dirty).toBe(true);
  });

  it('should mark the form as submitted', () => {
    expect(form.store.state.status.submitted).toBe(true);
  });
});

describe('on error', async () => {
  const { form } = await setup({ values: { ...validValues, name: 2 } as any });

  const onSuccess = vi.fn();
  const onError = vi.fn();

  await form.submit(onSuccess, onError)();

  it('should call onError', () => {
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith(
      [
        {
          code: 'invalid_type',
          expected: 'string',
          message: 'Invalid input: expected string, received number',
          path: ['name'],
        },
      ],
      form,
    );
  });

  it('should set the corresponding field errors', () => {
    expect(form.errors('nested')).toStrictEqual([]);
    expect(form.errors('name')).toEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Invalid input: expected string, received number',
        path: ['name'],
      },
    ]);
  });

  it('mark form as successful false', () => {
    expect(form.store.state.status.successful).toBe(false);
  });

  it('should reset the submitting status', () => {
    expect(form.store.state.status.submitting).toBe(false);
  });

  it('should reset the validating status', () => {
    expect(form.store.state.status.validating).toBe(false);
  });

  it('should increase the submits count', () => {
    expect(form.store.state.status.submits).toBe(1);
  });

  it('should mark the form as invalid', () => {
    expect(form.store.state.status.valid).toBe(false);
  });

  it('should mark the form as dirty', () => {
    expect(form.store.state.status.dirty).toBe(true);
  });

  it('should mark the form as submitted', () => {
    expect(form.store.state.status.submitted).toBe(true);
  });
});

describe('while submitting', async () => {
  const { form } = await setup({ values: validValues });

  const submitting = viPromise();
  const submit = form.submit(submitting.fn)();

  it('should mark the form as submitting', () => {
    expect(form.store.state.status.submitting).toBe(true);
  });

  it('should have not yet increased the submits count', () => {
    expect(form.store.state.status.submits).toBe(0);
  });

  afterAll(async () => {
    await submitting.release();
    await submit;
  });
});

it('marks the form as validating when submit is called and schema is async', async () => {
  const validating = viPromise();
  const submitting = viPromise();

  const form = new FormApi({
    schema: z
      .object({
        name: z.string(),
      })
      .refine(async () => {
        await validating.fn();
        return true;
      }),
    defaultValues: {
      name: 'John',
    },
  });

  const submit = form.submit(submitting.fn)();

  await expect.poll(() => form.store.state.status.validating).toBe(true);

  await validating.release();
  await submitting.release();
  await submit;

  expect(form.store.state.status.validating).toBe(false);
});
