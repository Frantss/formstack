import { expect, it } from 'vite-plus/test';

import { itAppliesArrayFieldStatus } from '#tests/form-core-array/behavior';
import { setup } from '#tests/form-core-array/setup';

it('moves an item forward in the array', () => {
  const context = setup();

  context.array.move('array', 0, 1);
  const value = context.field.get('array');

  expect(value).toEqual(['item2', 'item1']);
});

it('moves an item backward in the array', () => {
  const context = setup();

  context.array.move('array', 1, 0);
  const value = context.field.get('array');

  expect(value).toEqual(['item2', 'item1']);
});

it('keeps values unchanged when moving to the same index', () => {
  const context = setup();

  context.array.move('array', 1, 1);
  const value = context.field.get('array');

  expect(value).toEqual(['item1', 'item2']);
});

it('moves from a negative index as zero', () => {
  const context = setup();

  context.array.move('array', -100, 1);
  const value = context.field.get('array');

  expect(value).toEqual(['item2', 'item1']);
});

it('moves an absent array value as an empty array', () => {
  const context = setup();

  context.field.change('array', undefined as never);
  context.array.move('array', 0, 1);
  const value = context.field.get('array');

  expect(value).toEqual([]);
});

itAppliesArrayFieldStatus('move', (context, options) => context.array.move('array', 0, 1, options));

it('move moves index 0 field entry id to index 1', () => {
  const context = setup();
  const beforeId = context.fields.get('array.0').id;

  context.array.move('array', 0, 1);
  const afterId = context.fields.get('array.1').id;

  expect(afterId).toBe(beforeId);
});

it('move moves index 1 field entry id to index 0', () => {
  const context = setup();
  const beforeId = context.fields.get('array.1').id;

  context.array.move('array', 1, 0);
  const afterId = context.fields.get('array.0').id;

  expect(afterId).toBe(beforeId);
});

it('moves issues with field entries', () => {
  const context = setup();

  context.field.setIssues('array.0', {
    warning: [{ level: 'warning', issue: { code: 'custom', message: 'array warning', path: ['array', 0] } as never }],
  });

  context.array.move('array', 0, 1);

  expect(context.fields.get('array.1').issues.warning).toHaveLength(1);
});
