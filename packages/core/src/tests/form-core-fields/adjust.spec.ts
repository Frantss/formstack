import { expect, it } from 'vite-plus/test';

import { setup } from '#tests/form-core-fields/setup';

it('adds entries for new value paths', () => {
  const context = setup();

  context.core.set('nested.extra', 'extra');
  context.fields.adjust();
  const entry = context.fields.get('nested.extra');

  expect(entry).toEqual({
    id: entry.id,
    status: { dirty: false, touched: false, blurred: false },
    errors: [],
    ref: null,
  });
});

it('preserves existing entry state when path already exists', () => {
  const context = setup();

  context.fields.set('name', {
    status: { dirty: true, touched: true, blurred: true },
  });
  const expected = context.fields.get('name');
  context.fields.adjust();
  const entry = context.fields.get('name');

  expect(entry).toEqual(expected);
});

it('keeps unrelated entries unchanged', () => {
  const context = setup();

  const expected = context.fields.get('name');
  context.core.set('nested.extra', 'extra');
  context.fields.adjust();
  const entry = context.fields.get('name');

  expect(entry).toEqual(expected);
});

it('adds new entries using wildcard defaults', () => {
  const context = setup({
    defaultFieldStatus: {
      '*': { touched: true },
    },
  });

  context.core.set('nested.extra', 'extra');
  context.fields.adjust();
  const entry = context.fields.get('nested.extra');

  expect(entry).toEqual({
    id: entry.id,
    status: { dirty: false, touched: true, blurred: false },
    errors: [],
    ref: null,
  });
});
