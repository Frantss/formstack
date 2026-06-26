import type { FormIssue } from '#types/api/form-issue';
import { expect, it } from 'vite-plus/test';

import { setup } from '#tests/form-core-field/setup';

const issue: FormIssue = {
  code: 'custom',
  message: 'Issue',
  path: ['name'],
} as never;

it('resets a field value to its default value', () => {
  const context = setup();

  context.field.change('name', 'updated');
  context.field.reset('name');
  const value = context.field.get('name');

  expect(value).toBe('name');
});

it('resets a nested field value to its default value', () => {
  const context = setup();

  context.field.change('nested.value', 'updated nested');
  context.field.reset('nested.value');
  const value = context.field.get('nested.value');

  expect(value).toBe('value');
});

it('resets a field value to the provided reset value', () => {
  const context = setup();

  context.field.change('name', 'updated');
  context.field.reset('name', { value: 'custom reset' });
  const value = context.field.get('name');

  expect(value).toBe('custom reset');
});

it('sets dirty to false after reset', () => {
  const context = setup();

  context.field.change('name', 'updated');
  context.field.reset('name');
  const status = context.field.status('name');

  expect(status.dirty).toBe(false);
});

it('sets touched to false after reset', () => {
  const context = setup();

  context.field.focus('name');
  context.field.reset('name');
  const status = context.field.status('name');

  expect(status.touched).toBe(false);
});

it('sets blurred to false after reset', () => {
  const context = setup();

  context.field.blur('name');
  context.field.reset('name');
  const status = context.field.status('name');

  expect(status.blurred).toBe(false);
});

it('resets field status using wildcard and per-field defaults', () => {
  const context = setup({
    defaultFieldStatus: {
      '*': { touched: true },
      name: { dirty: true },
    },
  });

  context.field.change('name', 'updated');
  context.field.blur('name');
  context.field.reset('name');
  const status = context.field.status('name');

  expect(status).toMatchObject({
    dirty: true,
    touched: true,
    blurred: false,
  });
});

it('clears field errors after reset', () => {
  const context = setup();

  context.field.setErrors('name', [issue]);
  context.field.reset('name');
  const errors = context.field.errors('name');

  expect(errors).toEqual([]);
});

it('keeps sibling field value unchanged when resetting a different field', () => {
  const context = setup();

  context.field.change('count', 2);
  context.field.change('name', 'updated');
  context.field.reset('name');
  const value = context.field.get('count');

  expect(value).toBe(2);
});
