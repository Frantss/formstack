import { expect, it } from 'vite-plus/test';

import { setup } from '#tests/form-core-array/setup';

it('appends a value to the end of an array', () => {
  const context = setup();

  context.array.append('array', 'item3');
  const value = context.field.get('array');

  expect(value).toEqual(['item1', 'item2', 'item3']);
});

it('appends a value from an updater function', () => {
  const context = setup();

  context.array.append('array', () => 'item3');
  const value = context.field.get('array');

  expect(value).toEqual(['item1', 'item2', 'item3']);
});

it('appends a value when array is undefined', () => {
  const context = setup();

  context.field.change('array', undefined as never);
  context.array.append('array', 'item3');
  const value = context.field.get('array');

  expect(value).toEqual(['item3']);
});

it('marks the array field as dirty by default', () => {
  const context = setup();

  context.array.append('array', 'item3');
  const status = context.field.status('array');

  expect(status.dirty).toBe(true);
});

it('marks the array field as touched by default', () => {
  const context = setup();

  context.array.append('array', 'item3');
  const status = context.field.status('array');

  expect(status.touched).toBe(true);
});

it('does not mark the array field as dirty when should.dirty is false', () => {
  const context = setup();

  context.array.append('array', 'item3', { should: { dirty: false } });
  const status = context.field.status('array');

  expect(status.dirty).toBe(false);
});

it('does not mark the array field as touched when should.touch is false', () => {
  const context = setup();

  context.array.append('array', 'item3', { should: { touch: false } });
  const status = context.field.status('array');

  expect(status.touched).toBe(false);
});

it('creates a field entry for the appended index', () => {
  const context = setup();

  context.array.append('array', 'item3');
  const entry = context.fields.get('array.2');

  expect(entry).toEqual({
    id: entry.id,
    status: { dirty: false, touched: false, blurred: false },
    errors: [],
    ref: null,
  });
});

it('keeps sibling values unchanged', () => {
  const context = setup();

  context.array.append('array', 'item3');
  const value = context.field.get('sibling');

  expect(value).toBe('sibling');
});
