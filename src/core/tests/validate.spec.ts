import { FormApi } from '#/core/form-api';
import type { FormOptions } from '#/core/form-api.types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import z from 'zod';

const schema = z.object({
  name: z.string(),
  nested: z.object({
    deep: z.object({
      deeper: z.string().array(),
    }),
  }),
});

const partial = z.object({
  name: z.string().length(100),
});

const values = {
  name: 'John',
  nested: {
    deep: {
      deeper: ['hello'],
    },
  },
};

const setup = async ({
  values,
  validate,
}: Partial<FormOptions<typeof schema>> & { values: z.infer<typeof schema> }) => {
  const form = new FormApi({
    schema,
    defaultValues: values,
    validate,
  });

  form['~mount']();

  return { form };
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('on submit', async () => {
  it('should use validate.submit when provided', async () => {
    const spySchema = vi.spyOn(schema['~standard'], 'validate');
    const spyPartial = vi.spyOn(partial['~standard'], 'validate');

    const { form } = await setup({
      values,
      validate: {
        submit: partial,
      },
    });

    await form.submit(() => {})();

    expect(spyPartial).toHaveBeenCalledWith(values);
    expect(spySchema).not.toHaveBeenCalled();
  });

  it('should be dynamic when validate.submit is a function', async () => {
    const submit = vi.fn((store: typeof form.store.state) => {
      const submitted = store.status.submitted;
      return submitted ? schema : partial;
    });

    const { form } = await setup({
      values,
      validate: {
        submit,
      },
    });

    await form.submit(() => {})();

    expect(form.store.state.status.valid).toBe(false);
    expect(form.store.state.errors.name).toHaveLength(1);
    expect(form.store.state.errors.name[0].message).toStrictEqual(
      'Too small: expected string to have >=100 characters',
    );

    await form.submit(() => {})();

    expect(form.store.state.status.valid).toBe(true);
    expect(form.store.state.errors.name).toEqual(undefined);
  });
});

describe('on change', async () => {
  it('should use validate.change when provided', async () => {
    const spy = vi.spyOn(schema['~standard'], 'validate');

    const { form } = await setup({
      values,
      validate: {
        change: schema,
      },
    });

    form.field.change('name', 2 as any);

    expect(spy).toHaveBeenCalledWith({ ...values, name: 2 });
    await expect.poll(() => form.store.state.status.valid).toBe(false);
  });
});

describe('on blur', async () => {
  it('should use validate.blur when provided', async () => {
    const spy = vi.spyOn(schema['~standard'], 'validate');

    const { form } = await setup({
      values: { ...values, name: 2 as any },
      validate: {
        blur: schema,
      },
    });

    form.field.blur('name');

    expect(spy).toHaveBeenCalledWith({ ...values, name: 2 });
    await expect.poll(() => form.store.state.status.valid).toBe(false);
  });
});

describe('on touch', async () => {
  it('should use validate.touch when provided', async () => {
    const spy = vi.spyOn(schema['~standard'], 'validate');

    const { form } = await setup({
      values: { ...values, name: 2 as any },
      validate: {
        focus: schema,
      },
    });

    form.field.focus('name');

    expect(spy).toHaveBeenCalledWith({ ...values, name: 2 });
    await expect.poll(() => form.store.state.status.valid).toBe(false);
  });
});
