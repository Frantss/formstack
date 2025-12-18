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
    expect(form.field.errors('nested')).toStrictEqual([]);
    expect(form.field.errors('name')).toEqual([
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

  form['~mount']();

  const submit = form.submit(submitting.fn)();

  await expect.poll(() => form.store.state.status.validating).toBe(true);

  await validating.release();
  await submitting.release();
  await submit;

  expect(form.store.state.status.validating).toBe(false);
});

describe('submit without onError callback', async () => {
  const { form } = await setup({ values: { ...validValues, name: 3 } as any });

  await form.submit(() => {})();

  it('should not throw when onError is not provided', () => {
    expect(form.store.state.status.successful).toBe(false);
    expect(form.store.state.status.submitting).toBe(false);
  });

  it('should still set field errors', () => {
    expect(form.field.errors('name')).toEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Invalid input: expected string, received number',
        path: ['name'],
      },
    ]);
  });
});

describe('submit with async onSuccess callback', async () => {
  const { form } = await setup({ values: validValues });
  const asyncSuccess = viPromise();
  const onSuccess = vi.fn().mockImplementation(asyncSuccess.fn);

  const submit = form.submit(onSuccess)();

  it('should handle async success callbacks', async () => {
    expect(form.store.state.status.submitting).toBe(true);

    await asyncSuccess.release();
    await submit;

    expect(onSuccess).toHaveBeenCalledOnce();
    expect(form.store.state.status.submitting).toBe(false);
    expect(form.store.state.status.successful).toBe(true);
  });
});

describe('submit with async onError callback', async () => {
  const { form } = await setup({ values: { ...validValues, name: 4 } as any });
  const asyncError = viPromise();
  const onError = vi.fn().mockImplementation(asyncError.fn);

  const submit = form.submit(() => {}, onError)();

  it('should handle async error callbacks', async () => {
    expect(form.store.state.status.submitting).toBe(true);

    await asyncError.release();
    await submit;

    expect(onError).toHaveBeenCalledOnce();
    expect(form.store.state.status.submitting).toBe(false);
    expect(form.store.state.status.successful).toBe(false);
  });
});

describe('multiple submit calls', async () => {
  const { form } = await setup({ values: validValues });

  await form.submit(() => {})();
  await form.submit(() => {})();
  await form.submit(() => {})();

  it('should increment submits count correctly', () => {
    expect(form.store.state.status.submits).toBe(3);
  });

  it('should maintain successful status after multiple successful submits', () => {
    expect(form.store.state.status.successful).toBe(true);
  });
});

describe('submit with custom submit validator', async () => {
  const customValidator = z.object({
    name: z.string().min(5, 'Name must be at least 5 characters'),
  });

  const form = new FormApi({
    schema,
    defaultValues: validValues,
    validate: {
      submit: customValidator,
    },
  });

  form['~mount']();

  const onSuccess = vi.fn();
  const onError = vi.fn();

  await form.submit(onSuccess, onError)();

  it('should use custom submit validator instead of main schema', () => {
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      [
        {
          code: 'too_small',
          origin: 'string',
          inclusive: true,
          message: 'Name must be at least 5 characters',
          minimum: 5,
          path: ['name'],
        },
      ],
      form,
    );
  });

  it('should set corresponding field errors from custom validator', () => {
    expect(form.field.errors('name')).toEqual([
      {
        code: 'too_small',
        origin: 'string',
        inclusive: true,
        message: 'Name must be at least 5 characters',
        minimum: 5,
        path: ['name'],
      },
    ]);
  });
});

describe('submit with deep nested errors', async () => {
  const invalidNestedValues = {
    name: 'John',
    nested: {
      deep: {
        deeper: [5] as any, // should be string array
      },
    },
  };

  const { form } = await setup({ values: invalidNestedValues });

  const onSuccess = vi.fn();
  const onError = vi.fn();

  await form.submit(onSuccess, onError)();

  it('should handle deep nested validation errors', () => {
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      [
        {
          code: 'invalid_type',
          expected: 'string',
          message: 'Invalid input: expected string, received number',
          path: ['nested', 'deep', 'deeper', 0],
        },
      ],
      form,
    );
  });

  it('should set errors on nested paths', () => {
    expect(form.field.errors('nested.deep.deeper.0' as any)).toEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Invalid input: expected string, received number',
        path: ['nested', 'deep', 'deeper', 0],
      },
    ]);
  });
});

describe('submit sequence - success then error', async () => {
  const { form } = await setup({ values: validValues });
  await form.submit(() => {})();

  form.field.change('name', 5 as any);

  const onError = vi.fn();
  await form.submit(() => {}, onError)();

  it('should handle success followed by error correctly', () => {
    expect(form.store.state.status.submits).toBe(2);
    expect(form.store.state.status.successful).toBe(false);
    expect(onError).toHaveBeenCalledOnce();
  });
});

describe('submit sequence - error then success', async () => {
  const { form } = await setup({ values: { ...validValues, name: 6 } as any });
  await form.submit(() => {})();

  form.field.change('name', 'John');

  const onSuccess = vi.fn();
  await form.submit(onSuccess)();

  it('should handle error followed by success correctly', () => {
    expect(form.store.state.status.submits).toBe(2);
    expect(form.store.state.status.successful).toBe(true);
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it('should clear previous errors', () => {
    expect(form.field.errors('name')).toEqual([]);
  });
});

it('should set dirty status to true when submit is called', async () => {
  const { form } = await setup({ values: validValues });

  expect(form.store.state.status.dirty).toBe(false);

  await form.submit(() => {})();

  expect(form.store.state.status.dirty).toBe(true);
});
