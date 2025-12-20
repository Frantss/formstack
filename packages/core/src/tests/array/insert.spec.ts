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
  it('should insert string at beginning (index 0)', () => {
    const { form } = setup();

    form.array.insert('array', 0, 'inserted');

    expect(form.field.get('array')).toStrictEqual(['inserted', 'item1', 'item2']);
  });

  it('should insert string at middle index', () => {
    const { form } = setup();

    form.array.insert('array', 1, 'inserted');

    expect(form.field.get('array')).toStrictEqual(['item1', 'inserted', 'item2']);
  });

  it('should insert string at end (index equal to length)', () => {
    const { form } = setup();

    form.array.insert('array', 2, 'inserted');

    expect(form.field.get('array')).toStrictEqual(['item1', 'item2', 'inserted']);
  });

  it('should insert at an index greater than length', () => {
    const { form } = setup();

    form.array.insert('array', 4, 'inserted');

    expect(form.field.get('array')).toEqual(['item1', 'item2', undefined, undefined, 'inserted']);
  });

  it('should insert into an empty array', () => {
    const { form } = setup();

    form.field.change('array', []);
    form.array.insert('array', 1, 'inserted');

    expect(form.field.get('array')).toStrictEqual([undefined, 'inserted']);
  });

  it('should insert into an undefined array', () => {
    const { form } = setup();

    form.field.change('array', undefined as any);
    form.array.insert('array', 0, 'inserted');

    expect(form.field.get('array')).toStrictEqual(['inserted']);
  });

  it('should insert into a null array', () => {
    const { form } = setup();

    form.field.change('array', null as any);
    form.array.insert('array', 0, 'inserted');

    expect(form.field.get('array')).toStrictEqual(['inserted']);
  });

  it('should allow passing an updater function', () => {
    const { form } = setup();

    form.array.insert('array', 0, value => value.length + ' updated');

    expect(form.field.get('array')).toStrictEqual(['2 updated', 'item1', 'item2']);
  });
});

describe('meta handling', () => {
  it('should update the array field meta when inserting', () => {
    const { form } = setup();

    form.array.insert('array', 0, 'inserted');

    expect(form.field.meta('array').dirty).toBe(true);
    expect(form.field.meta('array').touched).toBe(true);
  });

  it('should not update the array field meta when inserting with should.dirty false', () => {
    const { form } = setup();

    form.array.insert('array', 0, 'inserted', { should: { dirty: false } });

    expect(form.field.meta('array').dirty).toBe(false);
    expect(form.field.meta('array').touched).toBe(true);
  });

  it('should not update the array field meta when inserting with should.touch false', () => {
    const { form } = setup();

    form.array.insert('array', 0, 'inserted', { should: { touch: false } });

    expect(form.field.meta('array').dirty).toBe(true);
    expect(form.field.meta('array').touched).toBe(false);
  });

  it('should update the inserted item meta when inserting', () => {
    const { form } = setup();

    form.field.change('array.0', 'updated', { should: { touch: false } });
    form.array.insert('array', 0, 'inserted');

    expect(form.field.meta('array.0').dirty).toBe(false);
    expect(form.field.meta('array.0').touched).toBe(false);
  });

  it('should leave the rest of the items untouched when inserting', () => {
    const { form } = setup();

    form.field.change('array.0', 'updated', { should: { touch: false } });
    form.field.change('array.2', 'updated', { should: { dirty: false } });
    form.array.insert('array', 0, 'inserted');

    expect(form.field.meta('array.1').dirty).toBe(true);
    expect(form.field.meta('array.1').touched).toBe(false);

    expect(form.field.meta('array.2').dirty).toBe(false);
    expect(form.field.meta('array.2').touched).toBe(false);

    expect(form.field.meta('array.3').dirty).toBe(false);
    expect(form.field.meta('array.3').touched).toBe(true);
  });
});

describe('edge cases', () => {
  it('handles negative index', () => {
    const { form } = setup();

    form.array.insert('array', -100, 'inserted');

    expect(form.field.get('array')).toEqual(['inserted', 'item1', 'item2']);
  });
});

describe('validation', () => {
  it('should validate on insert by default', async () => {
    const { form } = setup({ validate: { change: schema } });

    form.array.insert('array', 0, 0 as any);

    await sleep(0);

    expect(form.field.meta('array.0').valid).toBe(false);
    expect(form.field.errors('array.0')).toHaveLength(1);
  });

  it('should not validate on insert by default when should.validate is false', async () => {
    const { form } = setup({ validate: { change: schema } });

    form.array.insert('array', 0, 0 as any, { should: { validate: false } });

    expect(form.field.meta('array.0').valid).toBe(true);
    expect(form.field.errors('array.0')).toHaveLength(0);
  });
});
