import { expect, it } from 'vite-plus/test';

import { itAppliesArrayFieldStatus, itKeepsSiblingValue } from '#tests/form-core-array/behavior';
import { setup } from '#tests/form-core-array/setup';

it('replaces array values with provided array', () => {
  const context = setup();

  context.array.replace('array', ['new1', 'new2', 'new3']);
  const value = context.field.get('array');

  expect(value).toEqual(['new1', 'new2', 'new3']);
});

it('replaces array values with updater function', () => {
  const context = setup();

  context.array.replace('array', current => [...current, 'item3']);
  const value = context.field.get('array');

  expect(value).toEqual(['item1', 'item2', 'item3']);
});

itAppliesArrayFieldStatus('replace', (context, options) => context.array.replace('array', ['new1'], options));

it('does not set array field status when replace dirty and touch flags are false', () => {
  const context = setup();

  context.array.replace('array', ['new1'], {
    should: {
      dirty: false,
      touch: false,
    },
  });
  const status = context.field.status('array');

  expect(status).toMatchObject({
    dirty: false,
    touched: false,
  });
});

it('creates field entries for all replaced indices', () => {
  const context = setup();

  context.array.replace('array', ['new1', 'new2', 'new3']);
  const entry = context.fields.get('array.2');

  expect(entry).toEqual({
    id: entry.id,
    status: { dirty: false, touched: false, blurred: false },
    issues: { error: [] },
    ref: null,
  });
});

it('removes field entries beyond new length', () => {
  const context = setup();

  context.array.replace('array', ['new1']);
  const entry = context.fields.get('array.1');

  expect(entry).toBeUndefined();
});

itKeepsSiblingValue('replace', (context, options) => context.array.replace('array', ['new1'], options));
