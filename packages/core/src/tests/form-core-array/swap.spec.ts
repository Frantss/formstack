import { expect, it } from 'vite-plus/test';

import { itAppliesArrayFieldStatus, itKeepsSiblingValue } from '#tests/form-core-array/behavior';
import { setup } from '#tests/form-core-array/setup';

it('swaps two items in the array', () => {
  const context = setup();

  context.array.swap('array', 0, 1);
  const value = context.field.get('array');

  expect(value).toEqual(['item2', 'item1']);
});

it('normalizes negative indices to zero', () => {
  const context = setup();

  context.array.swap('array', -100, 1);
  const value = context.field.get('array');

  expect(value).toEqual(['item2', 'item1']);
});

it('normalizes negative target indices to zero', () => {
  const context = setup();

  context.array.swap('array', 1, -100);
  const value = context.field.get('array');

  expect(value).toEqual(['item2', 'item1']);
});

it('swaps an absent array value as an empty array', () => {
  const context = setup();

  context.field.change('array', undefined as never);
  context.array.swap('array', 0, 1);
  const value = context.field.get('array');

  expect(value).toEqual([undefined, undefined]);
});

it('keeps values unchanged when swapping the same index', () => {
  const context = setup();

  context.array.swap('array', 0, 0);
  const value = context.field.get('array');

  expect(value).toEqual(['item1', 'item2']);
});

itAppliesArrayFieldStatus('swap', (context, options) => context.array.swap('array', 0, 1, options));

it('swap moves index 0 field entry id to index 1', () => {
  const context = setup();
  const beforeId = context.fields.get('array.0').id;

  context.array.swap('array', 0, 1);
  const afterId = context.fields.get('array.1').id;

  expect(afterId).toBe(beforeId);
});

it('swap moves index 1 field entry id to index 0', () => {
  const context = setup();
  const beforeId = context.fields.get('array.1').id;

  context.array.swap('array', 0, 1);
  const afterId = context.fields.get('array.0').id;

  expect(afterId).toBe(beforeId);
});

itKeepsSiblingValue('swap', (context, options) => context.array.swap('array', 0, 1, options));
