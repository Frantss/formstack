import { expect, it } from 'vite-plus/test';

import { setup } from '#tests/form-core-field/setup';

it('returns untouched by default', () => {
  const context = setup();

  const status = context.field.status('name');

  expect(status.touched).toBe(false);
});

it('returns dirty as false by default', () => {
  const context = setup();

  const status = context.field.status('name');

  expect(status.dirty).toBe(false);
});

it('returns touched as true after focus', () => {
  const context = setup();

  context.field.focus('name');
  const status = context.field.status('name');

  expect(status.touched).toBe(true);
});

it('returns blurred as true after blur', () => {
  const context = setup();

  context.field.blur('name');
  const status = context.field.status('name');

  expect(status.blurred).toBe(true);
});
