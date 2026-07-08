import { expect, it } from 'vite-plus/test';

import { setup } from '#tests/form-core-field/setup';

const nameIssue = {
  level: 'error' as const,
  issue: {
    code: 'custom',
    message: 'Name issue',
    path: ['name'],
  } as never,
};

const nestedIssue = {
  level: 'error' as const,
  issue: {
    code: 'custom',
    message: 'Nested issue',
    path: ['nested', 'value'],
  } as never,
};

it('returns an empty array by default', () => {
  const context = setup();

  const errors = context.field.issues('name').error;

  expect(errors).toEqual([]);
});

it('returns error issues for a specific field', () => {
  const context = setup();

  context.field.setIssues('name', { error: [nameIssue] });
  const errors = context.field.issues('name').error;

  expect(errors).toEqual([nameIssue]);
});

it('returns the ascendant field error issues updated by descendant setIssues', () => {
  const context = setup();

  context.field.setIssues('nested', { error: [nameIssue] });
  context.field.setIssues('nested.value', { error: [nestedIssue] });
  const errors = context.field.issues('nested').error;

  expect(errors).toEqual([nameIssue]);
});

it('returns aggregated nested error issues when nested option is enabled', () => {
  const context = setup();

  context.field.setIssues('nested.value', { error: [nestedIssue] });
  const errors = context.field.issues('nested', { nested: true }).error;

  expect(errors).toEqual([nestedIssue]);
});
