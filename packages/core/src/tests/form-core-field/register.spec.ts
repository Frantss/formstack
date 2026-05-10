import { expect, it } from 'vitest';

import { setup } from '#tests/form-core-field/setup';

it('stores a field reference when a DOM element is provided', () => {
  const context = setup();
  const element = document.createElement('input');

  context.field.register('name')(element);
  const ref = context.fields.get('name').ref;

  expect(ref).toBe(element);
});

it('keeps the existing ref when the registered element is null', () => {
  const context = setup();

  context.field.register('name')(null);
  const ref = context.fields.get('name').ref;

  expect(ref).toBe(null);
});
