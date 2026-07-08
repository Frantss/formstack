import { expect, it } from 'vite-plus/test';

import { itAppliesArrayFieldStatus, itKeepsSiblingValue } from '#tests/form-core-array/behavior';
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

it('removes from an absent array value as an empty array', () => {
  const context = setup();

  context.field.change('array', undefined as never);
  context.array.remove('array', 0);
  const value = context.field.get('array');

  expect(value).toEqual([]);
});

itAppliesArrayFieldStatus('remove', (context, options) => context.array.remove('array', 0, options));

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

itKeepsSiblingValue('remove', (context, options) => context.array.remove('array', 0, options));

it('shifts issues with remaining entries', () => {
  const context = setup();

  context.field.setIssues('array.1', {
    warning: [{ level: 'warning', issue: { code: 'custom', message: 'array warning', path: ['array', 1] } as never }],
  });

  context.array.remove('array', 0);

  expect(context.fields.get('array.0').issues.warning).toHaveLength(1);
});
