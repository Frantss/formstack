import { expect, it } from 'vitest';

import { setup } from '#tests/form-core-array/setup';

it('inserts a value at the provided index', () => {
  const context = setup();

  context.array.insert('array', 1, 'item1.5');
  const value = context.field.get('array');

  expect(value).toEqual(['item1', 'item1.5', 'item2']);
});

it('inserts at index 0 when index is negative', () => {
  const context = setup();

  context.array.insert('array', -2, 'start');
  const value = context.field.get('array');

  expect(value).toEqual(['start', 'item1', 'item2']);
});

it('pads with undefined entries when inserting beyond length', () => {
  const context = setup();

  context.array.insert('array', 4, 'item5');
  const value = context.field.get('array');

  expect(value).toEqual(['item1', 'item2', undefined, undefined, 'item5']);
});

it('marks the array field as dirty by default', () => {
  const context = setup();

  context.array.insert('array', 1, 'item1.5');
  const status = context.field.status('array');

  expect(status.dirty).toBe(true);
});

it('marks the array field as touched by default', () => {
  const context = setup();

  context.array.insert('array', 1, 'item1.5');
  const status = context.field.status('array');

  expect(status.touched).toBe(true);
});

it('does not mark the array field as dirty when should.dirty is false', () => {
  const context = setup();

  context.array.insert('array', 1, 'item1.5', { should: { dirty: false } });
  const status = context.field.status('array');

  expect(status.dirty).toBe(false);
});

it('does not mark the array field as touched when should.touch is false', () => {
  const context = setup();

  context.array.insert('array', 1, 'item1.5', { should: { touch: false } });
  const status = context.field.status('array');

  expect(status.touched).toBe(false);
});

it('creates a field entry for the inserted index', () => {
  const context = setup();

  context.array.insert('array', 1, 'item1.5');
  const entry = context.fields.get('array.1');

  expect(entry).toEqual({
    id: entry.id,
    status: { dirty: false, touched: false, blurred: false },
    errors: [],
    ref: null,
  });
});

it('shifts existing field entries to the right from insertion index', () => {
  const context = setup();
  const previous = context.fields.get('array.1');
  const previousId = previous.id;

  context.array.insert('array', 1, 'item1.5');
  const entry = context.fields.get('array.2');
  const movedId = entry.id;

  expect(movedId).toBe(previousId);
});

it('moves all index entries correctly when inserting in the middle', () => {
  const context = setup();
  const before0 = context.fields.get('array.0').id;
  const before1 = context.fields.get('array.1').id;

  context.array.insert('array', 1, 'item1.5');
  const after0 = context.fields.get('array.0').id;
  const after1 = context.fields.get('array.1').id;
  const after2 = context.fields.get('array.2').id;

  expect(after0).toBe(before0);
  expect(after1).not.toBe(before1);
  expect(after2).toBe(before1);
});
