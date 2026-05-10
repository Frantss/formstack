import { expect, it } from 'vitest';

import { setup } from '#tests/form-core-array/setup';

it('removes an item at the provided index', () => {
  const context = setup();

  context.array.remove('array', 0);
  const value = context.field.get('array');

  expect(value).toEqual(['item2']);
});

it('normalizes negative index to zero', () => {
  const context = setup();

  context.array.remove('array', -100);
  const value = context.field.get('array');

  expect(value).toEqual(['item2']);
});

it('normalizes out-of-range index to last index', () => {
  const context = setup();

  context.array.remove('array', 100);
  const value = context.field.get('array');

  expect(value).toEqual(['item1']);
});

it('marks the array field as dirty by default', () => {
  const context = setup();

  context.array.remove('array', 0);
  const status = context.field.status('array');

  expect(status.dirty).toBe(true);
});

it('marks the array field as touched by default', () => {
  const context = setup();

  context.array.remove('array', 0);
  const status = context.field.status('array');

  expect(status.touched).toBe(true);
});

it('does not mark the array field as dirty when should.dirty is false', () => {
  const context = setup();

  context.array.remove('array', 0, { should: { dirty: false } });
  const status = context.field.status('array');

  expect(status.dirty).toBe(false);
});

it('does not mark the array field as touched when should.touch is false', () => {
  const context = setup();

  context.array.remove('array', 0, { should: { touch: false } });
  const status = context.field.status('array');

  expect(status.touched).toBe(false);
});

it('moves index 1 field entry id to index 0 after removing index 0', () => {
  const context = setup();
  const beforeId = context.fields.get('array.1').id;

  context.array.remove('array', 0);
  const afterId = context.fields.get('array.0').id;

  expect(afterId).toBe(beforeId);
});

it('removes trailing field entry after shifting', () => {
  const context = setup();

  context.array.remove('array', 0);
  const entry = context.fields.get('array.1');

  expect(entry).toBeUndefined();
});

it('keeps sibling values unchanged', () => {
  const context = setup();

  context.array.remove('array', 0);
  const value = context.field.get('sibling');

  expect(value).toBe('sibling');
});
