import { FormApi } from '#form-api';
import type { FormOptions } from '#form-api.types';
import { sleep } from '#utils/testing/sleep';
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
  it('should remove an item from an array', () => {
    const { form } = setup();

    form.array.remove('array', 1);

    expect(form.field.get('array')).toStrictEqual(['item1', 'item3']);
  });

  it('removes the first item if the index is 0', () => {
    const { form } = setup();

    form.array.remove('array', 0);

    expect(form.field.get('array')).toStrictEqual(['item2', 'item3']);
  });

  it('removes the last item if the index is equal to the length', () => {
    const { form } = setup();

    form.array.remove('array', 2);

    expect(form.field.get('array')).toStrictEqual(['item1', 'item2']);
  });

  it('should set the array to empty if it is undefined', () => {
    const { form } = setup();

    form.field.change('array', undefined as any);
    form.array.remove('array', 0);

    expect(form.field.get('array')).toStrictEqual([]);
  });

  it('should set the array to empty if it is null', () => {
    const { form } = setup();

    form.field.change('array', null as any);
    form.array.remove('array', 0);

    expect(form.field.get('array')).toStrictEqual([]);
  });
});

describe('meta handling', () => {
  it('should update the array field meta when removing', () => {
    const { form } = setup();

    form.array.remove('array', 1);

    expect(form.field.meta('array').dirty).toBe(true);
    expect(form.field.meta('array').touched).toBe(true);
  });

  it('should not update the array field meta when removing with should.dirty false', () => {
    const { form } = setup();

    form.array.remove('array', 1, { should: { dirty: false } });

    expect(form.field.meta('array').dirty).toBe(false);
    expect(form.field.meta('array').touched).toBe(true);
  });

  it('should not update the array field meta when removing with should.touch false', () => {
    const { form } = setup();

    form.array.remove('array', 1, { should: { touch: false } });

    expect(form.field.meta('array').dirty).toBe(true);
    expect(form.field.meta('array').touched).toBe(false);
  });

  it('should update the rest of the items meta when removing at the start', () => {
    const { form } = setup();

    form.field.change('array.1', 'updated', { should: { touch: false } });
    form.field.change('array.2', 'updated', { should: { dirty: false } });

    form.array.remove('array', 0);

    expect(form.field.meta('array.0').dirty).toBe(true);
    expect(form.field.meta('array.0').touched).toBe(false);

    expect(form.field.meta('array.1').dirty).toBe(false);
    expect(form.field.meta('array.1').touched).toBe(true);
  });

  it('should update the rest of the items meta when removing at the end', () => {
    const { form } = setup();

    form.field.change('array.0', 'updated', { should: { touch: false } });
    form.field.change('array.1', 'updated', { should: { dirty: false } });

    form.array.remove('array', 2);

    expect(form.field.meta('array.0').dirty).toBe(true);
    expect(form.field.meta('array.0').touched).toBe(false);

    expect(form.field.meta('array.1').dirty).toBe(false);
    expect(form.field.meta('array.1').touched).toBe(true);
  });

  it('should update the rest of the items meta when removing in the middle', () => {
    const { form } = setup();

    form.field.change('array.0', 'updated', { should: { touch: false } });
    form.field.change('array.2', 'updated', { should: { dirty: false } });
    form.array.remove('array', 1);

    expect(form.field.meta('array.0').dirty).toBe(true);
    expect(form.field.meta('array.0').touched).toBe(false);

    expect(form.field.meta('array.1').dirty).toBe(false);
    expect(form.field.meta('array.1').touched).toBe(true);
  });
});

describe('edge cases', () => {
  it('should handle negative index', () => {
    const { form } = setup();

    form.array.remove('array', -100);

    expect(form.field.get('array')).toEqual(['item2', 'item3']);
  });

  it('should handle an index greater than the length', () => {
    const { form } = setup();

    form.array.remove('array', 100);

    expect(form.field.get('array')).toEqual(['item1', 'item2']);
  });
});

describe('validation', () => {
  it('should validate on remove by default', async () => {
    const { form } = setup({ validate: { change: schema } });

    form.field.change('array.0', 0 as any);
    form.array.remove('array', 0);

    await sleep(0);

    expect(form.field.meta('array.0').valid).toBe(true);
    expect(form.field.errors('array.0')).toHaveLength(0);
  });
});
