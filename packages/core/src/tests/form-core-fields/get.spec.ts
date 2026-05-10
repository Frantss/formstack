import { expect, it } from 'vitest';

import { setup } from '#tests/form-core-fields/setup';

it('returns the root field entry when using a root-prefixed path', () => {
  const context = setup();

  const entry = context.fields.get('~root.name');

  expect(entry).toBeDefined();
});

it('returns the field entry when path omits the root prefix', () => {
  const context = setup();

  const entry = context.fields.get('name');

  expect(entry).toBeDefined();
});

it('returns undefined for a missing path', () => {
  const context = setup();

  const entry = context.fields.get('missing');

  expect(entry).toBeUndefined();
});
