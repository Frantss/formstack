import { expect, it } from 'vitest';

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

it('keeps values unchanged when swapping the same index', () => {
  const context = setup();

  context.array.swap('array', 0, 0);
  const value = context.field.get('array');

  expect(value).toEqual(['item1', 'item2']);
});

it('marks the array field as dirty by default', () => {
  const context = setup();

  context.array.swap('array', 0, 1);
  const status = context.field.status('array');

  expect(status.dirty).toBe(true);
});

it('marks the array field as touched by default', () => {
  const context = setup();

  context.array.swap('array', 0, 1);
  const status = context.field.status('array');

  expect(status.touched).toBe(true);
});

it('does not mark the array field as dirty when should.dirty is false', () => {
  const context = setup();

  context.array.swap('array', 0, 1, { should: { dirty: false } });
  const status = context.field.status('array');

  expect(status.dirty).toBe(false);
});

it('does not mark the array field as touched when should.touch is false', () => {
  const context = setup();

  context.array.swap('array', 0, 1, { should: { touch: false } });
  const status = context.field.status('array');

  expect(status.touched).toBe(false);
});

it('moves index 0 field entry id to index 1', () => {
  const context = setup();
  const beforeId = context.fields.get('array.0').id;

  context.array.swap('array', 0, 1);
  const afterId = context.fields.get('array.1').id;

  expect(afterId).toBe(beforeId);
});

it('moves index 1 field entry id to index 0', () => {
  const context = setup();
  const beforeId = context.fields.get('array.1').id;

  context.array.swap('array', 0, 1);
  const afterId = context.fields.get('array.0').id;

  expect(afterId).toBe(beforeId);
});

it('keeps sibling values unchanged', () => {
  const context = setup();

  context.array.swap('array', 0, 1);
  const value = context.field.get('sibling');

  expect(value).toBe('sibling');
});
