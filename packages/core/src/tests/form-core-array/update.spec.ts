import { expect, it } from 'vite-plus/test';

import { setup } from '#tests/form-core-array/setup';

it('updates an array item at the provided index', () => {
  const context = setup();

  context.array.update('array', 1, 'updated');
  const value = context.field.get('array');

  expect(value).toEqual(['item1', 'updated']);
});

it('updates an absent array value as an empty array', () => {
  const context = setup();

  context.field.change('array', undefined as never);
  context.array.update('array', 0, 'item1');
  const value = context.field.get('array');

  expect(value).toEqual(['item1']);
});
