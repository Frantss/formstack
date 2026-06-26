import type { FormIssue } from '#types/api/form-issue';
import { expect, it } from 'vite-plus/test';

import { setup } from '#tests/form-core-field/setup';

const issueA: FormIssue = {
  code: 'custom_a',
  message: 'Issue A',
  path: ['name'],
} as never;

const issueB: FormIssue = {
  code: 'custom_b',
  message: 'Issue B',
  path: ['name'],
} as never;

it('replaces errors by default', () => {
  const context = setup();

  context.field.setErrors('name', [issueA]);
  context.field.setErrors('name', [issueB]);
  const errors = context.field.errors('name');

  expect(errors).toEqual([issueB]);
});

it('appends errors in append mode', () => {
  const context = setup();

  context.field.setErrors('name', [issueA]);
  context.field.setErrors('name', [issueB], { mode: 'append' });
  const errors = context.field.errors('name');

  expect(errors).toEqual([issueA, issueB]);
});

it('keeps existing errors in keep mode when present', () => {
  const context = setup();

  context.field.setErrors('name', [issueA]);
  context.field.setErrors('name', [issueB], { mode: 'keep' });
  const errors = context.field.errors('name');

  expect(errors).toEqual([issueA]);
});

it('sets errors in keep mode when no existing errors are present', () => {
  const context = setup();

  context.field.setErrors('name', [issueB], { mode: 'keep' });
  const errors = context.field.errors('name');

  expect(errors).toEqual([issueB]);
});

it('updates form validity to invalid when errors are set', () => {
  const context = setup();

  context.field.setErrors('name', [issueA]);
  const valid = context.core.store.state.status.valid;

  expect(valid).toBe(false);
});

it('updates form validity to valid when errors are cleared', () => {
  const context = setup();

  context.field.setErrors('name', [issueA]);
  context.field.setErrors('name', []);
  const valid = context.core.store.state.status.valid;

  expect(valid).toBe(true);
});
