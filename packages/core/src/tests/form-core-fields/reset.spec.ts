import type { FormIssue } from '#types/api/form-issue';
import { expect, it } from 'vite-plus/test';

import { setup } from '#tests/form-core-fields/setup';

const issue: FormIssue = {
  code: 'custom',
  message: 'Issue',
  path: ['nested', 'value'],
} as never;

it('resets target field status to defaults', () => {
  const context = setup();

  context.fields.set('nested.value', {
    status: { dirty: true, touched: true, blurred: true },
  });
  context.fields.reset('nested.value');
  const entry = context.fields.get('nested.value');

  expect(entry.status).toEqual({ dirty: false, touched: false, blurred: false });
});

it('resets target field status using wildcard and field-specific defaults', () => {
  const context = setup({
    defaultFieldStatus: {
      '*': { touched: true },
      'nested.value': { dirty: true },
    },
  });

  context.fields.set('nested.value', {
    status: { dirty: false, touched: false, blurred: true },
  });
  context.fields.reset('nested.value');
  const entry = context.fields.get('nested.value');

  expect(entry.status).toEqual({ dirty: true, touched: true, blurred: false });
});

it('clears target field error issues', () => {
  const context = setup();

  context.fields.set('nested.value', { issues: { error: [{ level: 'error', issue }] } });
  context.fields.reset('nested.value');
  const entry = context.fields.get('nested.value');

  expect(entry.issues).toEqual({ error: [] });
});

it('clears target field ref', () => {
  const context = setup();
  const element = {} as HTMLElement;

  context.fields.set('nested.value', { ref: element });
  context.fields.reset('nested.value');
  const entry = context.fields.get('nested.value');

  expect(entry.ref).toBe(null);
});

it('resets descendant field when resetting a parent path', () => {
  const context = setup();
  const element = {} as HTMLElement;

  context.fields.set('nested.value', {
    status: { dirty: true, touched: true, blurred: true },
    issues: { error: [{ level: 'error', issue }] },
    ref: element,
  });
  context.fields.reset('nested');
  const entry = context.fields.get('nested.value');

  expect(entry).toEqual({
    id: entry.id,
    status: { dirty: false, touched: false, blurred: false },
    issues: { error: [] },
    ref: null,
  });
});

it('keeps sibling field state unchanged when resetting another path', () => {
  const context = setup();
  const element = {} as HTMLElement;

  context.fields.set('name', {
    status: { dirty: true, touched: true, blurred: true },
    issues: { error: [{ level: 'error', issue }] },
    ref: element,
  });
  const expected = context.fields.get('name');
  context.fields.reset('nested');
  const entry = context.fields.get('name');

  expect(entry).toEqual(expected);
});

it('does not affect ascendant field state when resetting a descendant path', () => {
  const context = setup();
  const element = {} as HTMLElement;

  context.fields.set('nested', {
    status: { dirty: true, touched: true, blurred: true },
    issues: { error: [{ level: 'error', issue }] },
    ref: element,
  });
  const expected = context.fields.get('nested');
  context.fields.reset('nested.value');
  const entry = context.fields.get('nested');

  expect(entry).toEqual(expected);
});
