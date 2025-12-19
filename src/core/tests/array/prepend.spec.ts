import { FormApi } from '#/core/form-api';
import type { FormOptions } from '#/core/form-api.types';
import { describe, expect, it } from 'vitest';
import z from 'zod';

const schema = z.object({
  array: z.string().array(),
});

const defaultValues = {
  array: ['item1', 'item2'],
};

const setup = (options?: Partial<FormOptions<typeof schema>>) => {
  const form = new FormApi({
    schema,
    defaultValues,
    ...options,
  });

  form['~mount']();

  return { form };
};

describe('value updates', () => {
  it('should prepend a value to the end of an array', () => {
    const { form } = setup();

    form.array.prepend('array', 'item0');

    expect(form.field.get('array')).toStrictEqual(['item0', 'item1', 'item2']);
  });

  it('should prepend a value if the array is undefined', () => {
    const { form } = setup();

    form.field.change('array', undefined as any);

    form.array.prepend('array', 'item0');

    expect(form.field.get('array')).toStrictEqual(['item0']);
  });

  it('should prepend a value if the array is null', () => {
    const { form } = setup();

    form.field.change('array', null as any);

    form.array.prepend('array', 'item0');

    expect(form.field.get('array')).toStrictEqual(['item0']);
  });

  it('should prepend a value if the array is empty', () => {
    const { form } = setup();

    form.field.change('array', []);

    form.array.prepend('array', 'item0');

    expect(form.field.get('array')).toStrictEqual(['item0']);
  });
});

describe('meta handling', () => {
  it('should update the array field meta when prepending', () => {
    const { form } = setup();

    form.array.prepend('array', 'item0');

    expect(form.field.meta('array').dirty).toBe(true);
    expect(form.field.meta('array').touched).toBe(true);
  });

  it('should not update the array field meta when prepending with should.dirty false', () => {
    const { form } = setup();

    form.array.prepend('array', 'item0', { should: { dirty: false } });

    expect(form.field.meta('array').dirty).toBe(false);
    expect(form.field.meta('array').touched).toBe(true);
  });

  it('should not update the array field meta when prepending with should.touch false', () => {
    const { form } = setup();

    form.array.prepend('array', 'item0', { should: { touch: false } });

    expect(form.field.meta('array').dirty).toBe(true);
    expect(form.field.meta('array').touched).toBe(false);
  });

  it('should update the first items meta when prepending', () => {
    const { form } = setup();

    form.array.prepend('array', 'item0');

    expect(form.field.meta('array.0').dirty).toBe(false);
    expect(form.field.meta('array.0').touched).toBe(false);
  });

  it('should leave the rest of the items untouched when prepending', () => {
    const { form } = setup();

    form.field.change('array.0', 'updated', { should: { touch: false } });
    form.array.prepend('array', 'item0');

    expect(form.field.meta('array.1').dirty).toBe(true);
    expect(form.field.meta('array.1').touched).toBe(false);

    expect(form.field.meta('array.2').dirty).toBe(false);
    expect(form.field.meta('array.2').touched).toBe(false);
  });
});

describe('validation', () => {
  it('should validate a field', async () => {
    const { form } = setup({validate: { change: schema }});

    form.array.prepend('array', 0 as any);

    await expect.poll(() => form.field.meta('array.0').valid).toBe(false);
    expect(form.field.errors('array.0')).toHaveLength(1);
  });

  it('should not validate a field when should.validate is false', async () => {
    const { form } = setup({ validate: { change: schema } });

    form.array.prepend('array', 0 as any, { should: { validate: false } });

    expect(form.field.meta('array.0').valid).toBe(true);
    expect(form.field.errors('array.0')).toHaveLength(0);
  });
});
