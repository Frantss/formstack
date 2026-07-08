import { expect, it } from 'vite-plus/test';

import { setup } from '#tests/form-core-field/setup';

const issueA = {
  level: 'error' as const,
  issue: {
    code: 'custom_a',
    message: 'Issue A',
    path: ['name'],
  } as never,
};

const issueB = {
  level: 'error' as const,
  issue: {
    code: 'custom_b',
    message: 'Issue B',
    path: ['name'],
  } as never,
};

it('replaces error issues by default', () => {
  const context = setup();

  context.field.setIssues('name', { error: [issueA] });
  context.field.setIssues('name', { error: [issueB] });
  const errors = context.field.issues('name').error;

  expect(errors).toEqual([issueB]);
});

it('appends error issues in append mode', () => {
  const context = setup();

  context.field.setIssues('name', { error: [issueA] });
  context.field.setIssues('name', { error: [issueB] }, { mode: 'append' });
  const errors = context.field.issues('name').error;

  expect(errors).toEqual([issueA, issueB]);
});

it('keeps existing error issues in keep mode when present', () => {
  const context = setup();

  context.field.setIssues('name', { error: [issueA] });
  context.field.setIssues('name', { error: [issueB] }, { mode: 'keep' });
  const errors = context.field.issues('name').error;

  expect(errors).toEqual([issueA]);
});

it('sets error issues in keep mode when no existing issues are present', () => {
  const context = setup();

  context.field.setIssues('name', { error: [issueB] }, { mode: 'keep' });
  const errors = context.field.issues('name').error;

  expect(errors).toEqual([issueB]);
});

it('updates form validity to invalid when error issues are set', () => {
  const context = setup();

  context.field.setIssues('name', { error: [issueA] });
  const valid = context.core.store.state.status.valid;

  expect(valid).toBe(false);
});

it('keeps non-error issues separate from error issues', () => {
  const context = setup();

  context.field.setIssues('name', {
    error: [issueA],
    warning: [{ level: 'warning', issue: { code: 'custom', message: 'Warning', path: ['name'] } as never }],
  });

  expect(context.field.issues('name').error).toEqual([issueA]);
});

it('updates form validity to valid when error issues are cleared', () => {
  const context = setup();

  context.field.setIssues('name', { error: [issueA] });
  context.field.setIssues('name', { error: [] });
  const valid = context.core.store.state.status.valid;

  expect(valid).toBe(true);
});
