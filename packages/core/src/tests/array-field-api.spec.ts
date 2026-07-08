import { createArrayField } from '#form/create-array-field';
import { createForm } from '#form/create-form';
import { expect, it } from 'vite-plus/test';
import z from 'zod';

const schema = z.object({
  tags: z.string().array(),
});

const defaultValues = {
  tags: ['a'],
};

const setup = () => {
  const form = createForm({
    schema,
    defaultValues,
  });
  const array = createArrayField({
    form,
    name: 'tags',
  });

  return {
    form,
    array,
  };
};

const setupOptional = () => {
  const form = createForm({
    schema: z.object({
      tags: z.string().array().optional(),
    }),
    defaultValues: {
      tags: undefined,
    },
  });
  const array = createArrayField({
    form,
    name: 'tags',
  });

  return {
    form,
    array,
  };
};

it('appends a value', () => {
  const context = setup();

  context.array.append('b');

  expect(context.array.get()).toEqual(['a', 'b']);
});

it('prepends a value', () => {
  const context = setup();

  context.array.prepend('z');

  expect(context.array.get()).toEqual(['z', 'a']);
});

it('array field api appends a value from an updater function', () => {
  const context = setup();

  context.array.append(() => 'b');

  expect(context.array.get()).toEqual(['a', 'b']);
});

it('prepends a value from an updater function', () => {
  const context = setup();

  context.array.prepend(() => 'z');

  expect(context.array.get()).toEqual(['z', 'a']);
});

it('inserts and removes values', () => {
  const context = setup();

  context.array.insert(1, 'b');
  context.array.remove(0);

  expect(context.array.get()).toEqual(['b']);
});

it('swaps values', () => {
  const context = setup();

  context.array.append('b');
  context.array.swap(0, 1);

  expect(context.array.get()).toEqual(['b', 'a']);
});

it('moves values', () => {
  const context = setup();

  context.array.append('b');
  context.array.move(1, 0);

  expect(context.array.get()).toEqual(['b', 'a']);
});

it('replaces and updates values', () => {
  const context = setup();

  context.array.replace(['x', 'y']);
  context.array.update(1, 'z');

  expect(context.array.get()).toEqual(['x', 'z']);
});

it('exposes array options', () => {
  const context = setup();

  expect(context.array.options.name).toBe('tags');
});

it('exposes array store value', () => {
  const context = setup();

  expect(context.array.store.state.value).toEqual(['a']);
});

it('exposes array state value', () => {
  const context = setup();

  expect(context.array.state.value).toEqual(['a']);
});

it('exposes array default value', () => {
  const context = setup();

  expect(context.array.state.defaultValue).toEqual(['a']);
});

it('generates one id for the initial array item', () => {
  const context = setup();

  expect(context.array.ids).toHaveLength(1);
});

it('generates string ids for array items', () => {
  const context = setup();

  expect(context.array.ids[0]).toBeTypeOf('string');
});

it('returns empty generated ids when array value is absent', () => {
  const context = setupOptional();

  expect(context.array.ids).toEqual([]);
});

it('updates array field form option', () => {
  const context = setup();
  const unmount = context.array['~mount']();

  context.array['~update']({
    form: context.form,
    name: 'tags',
  });

  expect(context.array.options.form).toBe(context.form);
  unmount();
});

it('updates array field name option', () => {
  const context = setup();

  context.array['~update']({
    form: context.form,
    name: 'tags',
  });

  expect(context.array.options.name).toBe('tags');
});

it('mounts array field with an unmount function', () => {
  const context = setup();
  const unmount = context.array['~mount']();

  expect(unmount).toBeTypeOf('function');
  unmount();
});
