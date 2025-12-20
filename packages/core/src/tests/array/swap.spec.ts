import { FormApi } from '#form-api';
import type { FormOptions } from '#form-api.types';
import { sleep } from '#utils/testing/sleep';
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
  it('should swap two items in an array', () => {
    const { form } = setup();

    form.array.swap('array', 0, 1);

    expect(form.field.get('array')).toStrictEqual(['item2', 'item1']);
  });

  it('should swap two items when one is not in the array', () => {
    const { form } = setup();

    form.array.swap('array', 0, 2);

    expect(form.field.get('array')).toStrictEqual([undefined, 'item2', 'item1']);
  });

  it('should swap two items when both are not in the array', () => {
    const { form } = setup();

    form.array.swap('array', 2, 3);

    expect(form.field.get('array')).toStrictEqual(['item1', 'item2', undefined, undefined]);
  });
});

describe('meta handling', () => {
  it('should update the array field meta when swapping', () => {
    const { form } = setup();

    form.array.swap('array', 0, 1);

    expect(form.field.meta('array').dirty).toBe(true);
    expect(form.field.meta('array').touched).toBe(true);
  });

  it('should not update the array field meta when swapping with should.dirty false', () => {
    const { form } = setup();

    form.array.swap('array', 0, 1, { should: { dirty: false } });

    expect(form.field.meta('array').dirty).toBe(false);
    expect(form.field.meta('array').touched).toBe(true);
  });

  it('should not update the array field meta when swapping with should.touch false', () => {
    const { form } = setup();

    form.array.swap('array', 0, 1, { should: { touch: false } });

    expect(form.field.meta('array').dirty).toBe(true);
    expect(form.field.meta('array').touched).toBe(false);
  });

  it('should update the swapped item meta when swapping', () => {
    const { form } = setup();

    form.field.change('array.0', 'updated', { should: { touch: false } });
    form.field.change('array.1', 'updated', { should: { dirty: false } });
    form.array.swap('array', 0, 1);

    expect(form.field.meta('array.0').dirty).toBe(false);
    expect(form.field.meta('array.0').touched).toBe(true);

    expect(form.field.meta('array.1').dirty).toBe(true);
    expect(form.field.meta('array.1').touched).toBe(false);
  });

  it('should leave the rest of the items untouched when swapping', () => {
    const { form } = setup();

    form.field.change('array', ['item1', 'item2', 'item3', 'item4']);
    form.array.swap('array', 0, 2);

    expect(form.field.meta('array.1').dirty).toEqual(false);
    expect(form.field.meta('array.3').dirty).toEqual(false);
  });
});

describe('edge cases', () => {
  it('should handle negative index', () => {
    const { form } = setup();

    form.array.swap('array', -100, 1);

    expect(form.field.get('array')).toEqual(['item2', 'item1']);
  });

  it('should handle swapping with the same index', () => {
    const { form } = setup();

    form.array.swap('array', 0, 0);

    expect(form.field.get('array')).toEqual(['item1', 'item2']);
  });
});

describe('validation', () => {
  it('should validate on swap by default', async () => {
    const { form } = setup({ validate: { change: schema } });

    form.field.change('array.0', 0 as any, { should: { validate: false } });
    form.array.swap('array', 0, 1);

    await sleep(0);

    expect(form.field.meta('array.1').valid).toBe(false);
    expect(form.field.errors('array.1')).toHaveLength(1);

    expect(form.field.meta('array.0').valid).toBe(true);
    expect(form.field.errors('array.0')).toHaveLength(0);
  });

  it('should not validate on swap by default when should.validate is false', async () => {
    const { form } = setup({ validate: { change: schema } });

    form.field.change('array.0', 0 as any, { should: { validate: false } });
    form.array.swap('array', 0, 1, { should: { validate: false } });

    expect(form.field.meta('array.1').valid).toBe(true);
    expect(form.field.errors('array.1')).toHaveLength(0);

    expect(form.field.meta('array.0').valid).toBe(true);
    expect(form.field.errors('array.0')).toHaveLength(0);
  });
});
