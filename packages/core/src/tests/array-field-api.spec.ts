import { createArrayField } from '#form/create-array-field';
import { createForm } from '#form/create-form';
import { expect, it } from 'vitest';
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

it('appends and prepends values', () => {
  const context = setup();

  context.array.append('b');
  context.array.prepend('z');

  expect(context.array.get()).toEqual(['z', 'a', 'b']);
  expect(context.form.field.get('tags')).toEqual(['z', 'a', 'b']);
});

it('appends and prepends values from updater functions', () => {
  const context = setup();

  context.array.append(() => 'b');
  context.array.prepend(() => 'z');

  expect(context.array.get()).toEqual(['z', 'a', 'b']);
  expect(context.form.field.get('tags')).toEqual(['z', 'a', 'b']);
});

it('inserts and removes values', () => {
  const context = setup();

  context.array.insert(1, 'b');
  context.array.remove(0);

  expect(context.array.get()).toEqual(['b']);
});

it('replaces and updates values', () => {
  const context = setup();

  context.array.replace(['x', 'y']);
  context.array.update(1, 'z');

  expect(context.array.get()).toEqual(['x', 'z']);
});

it('exposes array state through store/state', () => {
  const context = setup();

  expect(context.array.state.value).toEqual(['a']);
  expect(context.array.state.defaultValue).toEqual(['a']);
});
