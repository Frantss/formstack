import { expect, it } from 'vite-plus/test';

import { itAppliesArrayFieldStatus, itKeepsSiblingValue } from '#tests/form-core-array/behavior';
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

it('appends an updater value when array is undefined', () => {
  const context = setup();

  context.field.change('array', undefined as never);
  context.array.append('array', () => 'item3');
  const value = context.field.get('array');

  expect(value).toEqual(['item3']);
});

itAppliesArrayFieldStatus('append', (context, options) => context.array.append('array', 'item3', options));

it('creates a field entry for the appended index', () => {
  const context = setup();

  context.array.append('array', 'item3');
  const entry = context.fields.get('array.2');

  expect(entry).toEqual({
    id: entry.id,
    status: { dirty: false, touched: false, blurred: false },
    issues: { error: [] },
    ref: null,
  });
});

itKeepsSiblingValue('append', (context, options) => context.array.append('array', 'item3', options));
