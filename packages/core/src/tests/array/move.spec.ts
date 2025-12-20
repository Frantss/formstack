import { FormApi } from '#form-api';
import type { FormOptions } from '#form-api.types';
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
  it('should move an item forward in an array', () => {
    const { form } = setup();

    form.array.move('array', 0, 1);

    expect(form.field.get('array')).toEqual(['item2', 'item1', 'item3']);
  });

  it('should move an item backward in an array', () => {
    const { form } = setup();

    form.array.move('array', 2, 1);

    expect(form.field.get('array')).toEqual(['item1', 'item3', 'item2']);
  });

  it('moves an item from the beginning to the end of the array', () => {
    const { form } = setup();

    form.array.move('array', 0, 2);

    expect(form.field.get('array')).toEqual(['item2', 'item3', 'item1']);
  });

  it('moves an item from the end to the beginning of the array', () => {
    const { form } = setup();

    form.array.move('array', 2, 0);

    expect(form.field.get('array')).toEqual(['item3', 'item1', 'item2']);
  });
});

describe('meta handling', () => {
  it('should update the array field meta when moving', () => {
    const { form } = setup();

    form.array.move('array', 0, 1);

    expect(form.field.meta('array').dirty).toBe(true);
    expect(form.field.meta('array').touched).toBe(true);
  });

  it('should not update the array field meta when moving with should.dirty false', () => {
    const { form } = setup();

    form.array.move('array', 0, 1, { should: { dirty: false } });

    expect(form.field.meta('array').dirty).toBe(false);
    expect(form.field.meta('array').touched).toBe(true);
  });

  it('should not update the array field meta when moving with should.touch false', () => {
    const { form } = setup();

    form.array.move('array', 0, 1, { should: { touch: false } });

    expect(form.field.meta('array').dirty).toBe(true);
    expect(form.field.meta('array').touched).toBe(false);
  });

  it('should update the moved item meta when moving forwards', () => {
    const { form } = setup();

    form.field.change('array.0', 'updated', { should: { touch: false } });
    form.field.change('array.1', 'updated', { should: { dirty: false } });
    form.array.move('array', 0, 1);

    expect(form.field.meta('array.0').dirty).toBe(false);
    expect(form.field.meta('array.0').touched).toBe(true);

    expect(form.field.meta('array.1').dirty).toBe(true);
    expect(form.field.meta('array.1').touched).toBe(false);
  });

  it('should update the moved item meta when moving backwards', () => {
    const { form } = setup();

    form.field.change('array.0', 'updated', { should: { touch: false } });
    form.field.change('array.1', 'updated', { should: { dirty: false } });
    form.array.move('array', 1, 0);

    expect(form.field.meta('array.0').dirty).toBe(true);
    expect(form.field.meta('array.0').touched).toBe(false);

    expect(form.field.meta('array.1').dirty).toBe(false);
    expect(form.field.meta('array.1').touched).toBe(true);
  });
});

describe('edge cases', () => {
  it('should handle negative from as 0', () => {
    const { form } = setup();

    form.array.move('array', -100, 1);

    expect(form.field.get('array')).toEqual(['item2', 'item1', 'item3']);
  });

  it('should handle negative to as 0', () => {
    const { form } = setup();

    form.array.move('array', 1, -100);

    expect(form.field.get('array')).toEqual(['item2', 'item1', 'item3']);
  });

  it('should handle moving with the same index', () => {
    const { form } = setup();

    form.array.move('array', 0, 0);

    expect(form.field.get('array')).toEqual(['item1', 'item2', 'item3']);
  });

  it('should move an item across a wide gap', () => {
    const { form } = setup({
      defaultValues: {
        array: ['item1', 'item2', 'item3', 'item4', 'item5', 'item6', 'item7', 'item8', 'item9', 'item10'],
      },
    });

    form.field.change('array.1', 'moved', { should: { touch: false } });
    form.field.change('array.5', 'updated', { should: { dirty: false } });
    form.array.move('array', 1, 8);

    expect(form.field.get('array')).toEqual([
      'item1',
      'item3',
      'item4',
      'item5',
      'updated',
      'item7',
      'item8',
      'item9',
      'moved',
      'item10',
    ]);

    expect(form.field.meta('array.1').dirty).toEqual(false);
    expect(form.field.meta('array.1').touched).toEqual(false);

    expect(form.field.meta('array.4').dirty).toEqual(false);
    expect(form.field.meta('array.4').touched).toEqual(true);

    expect(form.field.meta('array.8').dirty).toEqual(true);
    expect(form.field.meta('array.8').touched).toEqual(false);
  });
});
