import { expect, it } from 'vitest';

import { setup } from '#tests/form-core-field/setup';

it('returns the default value of a field', () => {
  const context = setup();

  const value = context.field.get('name');

  expect(value).toBe('name');
});

it('returns the default value of a nested field', () => {
  const context = setup();

  const value = context.field.get('nested.value');

  expect(value).toBe('value');
});

it('returns the updated value after change', () => {
  const context = setup();

  context.field.change('name', 'updated');
  const value = context.field.get('name');

  expect(value).toBe('updated');
});
