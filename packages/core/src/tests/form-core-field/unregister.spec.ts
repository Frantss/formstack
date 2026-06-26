import { expect, it } from 'vite-plus/test';

import { setup } from '#tests/form-core-field/setup';

it('clears the stored field reference', () => {
  const context = setup();
  const element = document.createElement('input');

  context.field.register('name')(element);
  context.field.unregister('name');
  const ref = context.fields.get('name').ref;

  expect(ref).toBe(null);
});

it('keeps sibling field references unchanged', () => {
  const context = setup();
  const nameElement = document.createElement('input');
  const nestedElement = document.createElement('input');

  context.field.register('name')(nameElement);
  context.field.register('nested.value')(nestedElement);
  context.field.unregister('name');
  const ref = context.fields.get('nested.value').ref;

  expect(ref).toBe(nestedElement);
});
