import type { FormIssue } from '#types/api/form-issue';
import { expect, it } from 'vite-plus/test';

import { setup } from '#tests/form-core-fields/setup';

const issue: FormIssue = {
  code: 'custom',
  message: 'Issue',
  path: ['name'],
} as never;

it('updates target entry status', () => {
  const context = setup();
  const expected = context.fields.get('name');

  context.fields.set('name', { status: { dirty: true } });
  const entry = context.fields.get('name');

  expect(entry).toEqual({
    ...expected,
    status: { dirty: true, touched: false, blurred: false },
  });
});

it('updates target entry error issues', () => {
  const context = setup();

  context.fields.set('name', { issues: { error: [{ level: 'error', issue }] } });
  const entry = context.fields.get('name');

  expect(entry.issues).toEqual({ error: [{ level: 'error', issue }] });
});

it('updates target entry ref', () => {
  const context = setup();
  const element = {} as HTMLElement;

  context.fields.set('name', { ref: element });
  const entry = context.fields.get('name');

  expect(entry.ref).toBe(element);
});

it('updates ascendant entry when setting a descendant path', () => {
  const context = setup();
  const expected = context.fields.get('nested');

  context.fields.set('nested.value', { status: { touched: true } });
  const entry = context.fields.get('nested');

  expect(entry).toEqual({
    ...expected,
    status: { dirty: false, touched: true, blurred: false },
  });
});

it('does not propagate error issues to ascendant entries when setting a descendant path', () => {
  const context = setup();
  const expected = context.fields.get('nested');

  context.fields.set('nested.value', {
    status: { touched: true },
    issues: { error: [{ level: 'error', issue }] },
  });
  const entry = context.fields.get('nested');

  expect(entry).toEqual({
    ...expected,
    status: { dirty: false, touched: true, blurred: false },
  });
});

it('does not propagate refs to ascendant entries when setting a descendant path', () => {
  const context = setup();
  const expected = context.fields.get('nested');
  const element = {} as HTMLElement;

  context.fields.set('nested.value', { status: { touched: true }, ref: element });
  const entry = context.fields.get('nested');

  expect(entry).toEqual({
    ...expected,
    status: { dirty: false, touched: true, blurred: false },
  });
});

it('does not update descendant entry when setting a parent path', () => {
  const context = setup();
  const expected = context.fields.get('nested.value');

  context.fields.set('nested', {
    status: { touched: true, dirty: true, blurred: true },
  });
  const entry = context.fields.get('nested.value');

  expect(entry).toEqual(expected);
});

it('does not update sibling entries', () => {
  const context = setup();
  const expected = context.fields.get('name');

  context.fields.set('nested.value', { status: { touched: true } });
  const entry = context.fields.get('name');

  expect(entry).toEqual(expected);
});
