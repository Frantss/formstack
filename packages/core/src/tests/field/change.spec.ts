import { FormApi } from '#form-api';
import type { FormOptions } from '#form-api.types';
import { sleep } from '#utils/testing/sleep';
import { describe, expect, it } from 'vitest';
import z from 'zod';

const schema = z.object({
  string: z.string(),
  optional: z.string().optional(),
  nullable: z.string().nullable(),
  nullish: z.string().nullish(),
  number: z.number(),
  boolean: z.boolean(),
  array: z.string().array(),
  object: z.object({
    nested: z.object({
      deep: z.string(),
    }),
  }),
});

const defaultValues = {
  string: 'string',
  optional: undefined,
  nullable: null,
  nullish: null,
  number: 1,
  boolean: true,
  array: ['array'],
  object: {
    nested: {
      deep: 'deep',
    },
  },
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
  it('should update string field value', () => {
    const { form } = setup();

    form.field.change('string', 'updated');

    expect(form.field.get('string')).toBe('updated');
  });

  it('should update optional field value', () => {
    const { form } = setup();

    form.field.change('optional', 'updated');

    expect(form.field.get('optional')).toBe('updated');
  });

  it('should update nullable field value', () => {
    const { form } = setup();

    form.field.change('nullable', 'updated');

    expect(form.field.get('nullable')).toBe('updated');
  });

  it('should update nullish field value', () => {
    const { form } = setup();

    form.field.change('nullish', 'updated');

    expect(form.field.get('nullish')).toBe('updated');
  });

  it('should update number field value', () => {
    const { form } = setup();

    form.field.change('number', 2);

    expect(form.field.get('number')).toBe(2);
  });

  it('should update boolean field value', () => {
    const { form } = setup();

    form.field.change('boolean', false);

    expect(form.field.get('boolean')).toBe(false);
  });

  it('should update array field value', () => {
    const { form } = setup();

    const newArray = ['new1', 'new2'];
    form.field.change('array', newArray);

    expect(form.field.get('array')).toStrictEqual(newArray);
  });

  it('should update an array index field value', () => {
    const { form } = setup();

    form.field.change('array.2', 'updated');

    expect(form.field.get('array.2')).toEqual('updated');
    expect(form.field.get('array')).toEqual(['array', undefined, 'updated']);
  });

  it('should update object field value', () => {
    const { form } = setup();

    const newObject = {
      nested: {
        deep: 'new',
      },
    };
    form.field.change('object', newObject);

    expect(form.field.get('object')).toStrictEqual(newObject);
  });

  it('should update nested field value', () => {
    const { form } = setup();

    form.field.change('object.nested.deep', 'updated');

    expect(form.field.get('object.nested.deep')).toBe('updated');
  });

  it('should allow passing an updater function', () => {
    const { form } = setup();

    form.field.change('string', value => value + ' updated');

    expect(form.field.get('string')).toBe('string updated');
  });
});

describe('should update field metadata', () => {
  it('on first change', () => {
    const { form } = setup();

    form.field.change('string', 'updated');

    expect(form.field.meta('string').dirty).toBe(true);
    expect(form.field.meta('string').touched).toBe(true);
    expect(form.field.meta('string').blurred).toBe(false);
    expect(form.field.meta('string').pristine).toBe(false);
    expect(form.field.meta('string').default).toBe(false);
    expect(form.field.meta('string').valid).toBe(true);
  });

  it('on second change', () => {
    const { form } = setup();

    form.field.change('string', 'updated');
    form.field.change('string', 'updated again');

    expect(form.field.meta('string').dirty).toBe(true);
    expect(form.field.meta('string').touched).toBe(true);
    expect(form.field.meta('string').blurred).toBe(false);
    expect(form.field.meta('string').pristine).toBe(false);
    expect(form.field.meta('string').default).toBe(false);
    expect(form.field.meta('string').valid).toBe(true);
  });

  it('should not mark fields as dirty if should.dirty is false', () => {
    const { form } = setup();

    form.field.change('string', 'updated', { should: { dirty: false } });

    expect(form.field.meta('string').dirty).toBe(false);
  });

  it('should not mark fields as touched if should.touch is false', () => {
    const { form } = setup();

    form.field.change('string', 'updated', { should: { touch: false } });

    expect(form.field.meta('string').touched).toBe(false);
  });
});

describe('if form.options.validate.change is provided ', () => {
  it('should validate on update by default', async () => {
    const { form } = setup({ validate: { change: schema } });

    form.field.change('string', 2 as any);

    await sleep(0);

    expect(form.field.get('string')).toBe(2);
    expect(form.field.meta('string').valid).toBe(false);
    expect(form.field.errors('string')).toHaveLength(1);
  });

  it('should skip validation if should.validate is false', async () => {
    const { form } = setup({ validate: { change: schema } });

    form.field.change('string', 2 as any, { should: { validate: false } });

    expect(form.field.get('string')).toBe(2);
    expect(form.field.meta('string').valid).toBe(true);
    expect(form.field.errors('string')).toHaveLength(0);
  });
});

describe('if form.options.validate.change is not provided ', () => {
  it('should not validate on update by default', async () => {
    const { form } = setup();

    form.field.change('string', 2 as any);
    await sleep(0);

    expect(form.field.get('string')).toBe(2);
    expect(form.field.meta('string').valid).toBe(true);
    expect(form.field.errors('string')).toHaveLength(0);
  });
});
