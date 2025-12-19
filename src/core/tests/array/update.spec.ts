import { FormApi } from '#/core/form-api';
import type { FormOptions } from '#/core/form-api.types';
import { describe, expect, it } from 'vitest';
import z from 'zod';

const schema = z.object({
  array: z.string().array(),
});

const defaultValues = {
  array: ['item1', 'item2', 'item3'],
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
  it('should update an item in an array', () => {
    const { form } = setup();

    form.array.update('array', 1, 'updated');

    expect(form.field.get('array')).toStrictEqual(['item1', 'updated', 'item3']);
  });

  it('should update an item if the array is undefined', () => {
    const { form } = setup();

    form.field.change('array', undefined as any);
    form.array.update('array', 0, 'updated');

    expect(form.field.get('array')).toStrictEqual(['updated']);
  });

  it('should update an item if the array is null', () => {
    const { form } = setup();

    form.field.change('array', null as any);
    form.array.update('array', 0, 'updated');

    expect(form.field.get('array')).toStrictEqual(['updated']);
  });

  it('should update an item if the array is empty', () => {
    const { form } = setup();

    form.field.change('array', []);
    form.array.update('array', 0, 'updated');

    expect(form.field.get('array')).toStrictEqual(['updated']);
  });

  it('should allow passing an updater function', () => {
    const { form } = setup();

    form.array.update('array', 0, value => value.length + ' updated');

    expect(form.field.get('array')).toStrictEqual(['3 updated', 'item2', 'item3']);
  });
});

describe('meta handling', () => {
  it('should update the array field meta when updating', () => {
    const { form } = setup();

    form.array.update('array', 1, 'updated');

    expect(form.field.meta('array').dirty).toBe(true);
    expect(form.field.meta('array').touched).toBe(true);
  });

  it('should not update the array field meta when updating with should.dirty false', () => {
    const { form } = setup();

    form.array.update('array', 1, 'updated', { should: { dirty: false } });

    expect(form.field.meta('array').dirty).toBe(false);
    expect(form.field.meta('array').touched).toBe(true);
  });

  it('should not update the array field meta when updating with should.touch false', () => {
    const { form } = setup();

    form.array.update('array', 1, 'updated', { should: { touch: false } });

    expect(form.field.meta('array').dirty).toBe(true);
    expect(form.field.meta('array').touched).toBe(false);
  });

  it('should update the updated item meta when updating', () => {
    const { form } = setup();

    form.array.update('array', 0, 'updated');

    expect(form.field.meta('array.0').dirty).toBe(true);
    expect(form.field.meta('array.0').touched).toBe(true);
  });
});


describe('edge cases', () => {
  it('should handle negative index', () => {
    const { form } = setup();

    form.array.update('array', -100, 'updated');

    expect(form.field.get('array')).toEqual(['updated', 'item2', 'item3']);
  });

  it('should handle updating an index out of bounds', () => {
    const { form } = setup();

    form.array.update('array', 5, 'updated');

    expect(form.field.get('array')).toEqual(['item1', 'item2', 'updated']);
  });
});

describe('validation', () => {
  it('should validate on update by default', async () => {
    const { form } = setup({validate: { change: schema }});

    form.array.update('array', 0, 0 as any);

    await expect.poll(() => form.field.meta('array.0').valid).toBe(false);
    expect(form.field.errors('array.0')).toHaveLength(1);
  });

  it('should not validate on update by default when should.validate is false', async () => {
    const { form } = setup({ validate: { change: schema } });

    form.array.update('array', 0, 0 as any, { should: { validate: false } });

    expect(form.field.meta('array.0').valid).toBe(true);
    expect(form.field.errors('array.0')).toHaveLength(0);
  });
});
