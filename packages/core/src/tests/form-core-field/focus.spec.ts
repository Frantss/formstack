import { expect, it, vi } from 'vite-plus/test';
import z from 'zod';

import { setup } from '#tests/form-core-field/setup';

it('focuses a registered element reference', () => {
  const context = setup();
  const element = document.createElement('input');
  document.body.append(element);

  context.field.register('name')(element);
  context.field.focus('name');

  expect(document.activeElement).toBe(element);
  element.remove();
});

it('marks the field as touched', () => {
  const context = setup();

  context.field.focus('name');
  const status = context.field.status('name');

  expect(status.touched).toBe(true);
});

it('marks an ascendant field as touched when focusing a nested field', () => {
  const context = setup();

  context.field.focus('nested.value');
  const status = context.field.status('nested');

  expect(status.touched).toBe(true);
});

it('does not mark a descendant field as touched when focusing a parent field', () => {
  const context = setup();

  context.field.focus('nested');
  const status = context.field.status('nested.value');

  expect(status.touched).toBe(false);
});

it('does not validate by default when focusing a field', () => {
  const context = setup();
  const validate = vi.spyOn(context.core, 'validate').mockResolvedValue([true, []]);

  context.field.focus('name');

  expect(validate).not.toHaveBeenCalled();
});

it('validates by default when focusing a field and a focus validator is configured', () => {
  const context = setup({
    validate: {
      focus: z.object({
        name: z.string(),
      }),
    },
  });
  const validate = vi.spyOn(context.core, 'validate').mockResolvedValue([true, []]);

  context.field.focus('name');

  expect(validate).toHaveBeenCalledOnce();
  expect(validate).toHaveBeenCalledWith('name', { type: 'focus' });
});

it('skips validation when should.validate is false', () => {
  const context = setup({
    validate: {
      focus: z.object({
        name: z.string(),
      }),
    },
  });
  const validate = vi.spyOn(context.core, 'validate').mockResolvedValue([true, []]);

  context.field.focus('name', { should: { validate: false } });

  expect(validate).not.toHaveBeenCalled();
});

it('does not update state when the field is already touched', () => {
  const context = setup();

  context.field.focus('name');
  const set = vi.spyOn(context.fields, 'set');

  context.field.focus('name');

  expect(set).not.toHaveBeenCalled();
});
