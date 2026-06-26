import { expect, it, vi } from 'vite-plus/test';
import z from 'zod';

import { setup } from '#tests/form-core-field/setup';

it('blurs a registered element reference', () => {
  const context = setup();
  const element = document.createElement('input');
  document.body.append(element);
  element.focus();

  context.field.register('name')(element);
  context.field.blur('name');

  expect(document.activeElement).not.toBe(element);
  element.remove();
});

it('marks the field as blurred', () => {
  const context = setup();

  context.field.blur('name');
  const status = context.field.status('name');

  expect(status.blurred).toBe(true);
});

it('marks an ascendant field as blurred when blurring a nested field', () => {
  const context = setup();

  context.field.blur('nested.value');
  const status = context.field.status('nested');

  expect(status.blurred).toBe(true);
});

it('does not mark a descendant field as blurred when blurring a parent field', () => {
  const context = setup();

  context.field.blur('nested');
  const status = context.field.status('nested.value');

  expect(status.blurred).toBe(false);
});

it('does not validate by default when blurring a field', () => {
  const context = setup();
  const validate = vi.spyOn(context.core, 'validate').mockResolvedValue([true, []]);

  context.field.blur('name');

  expect(validate).not.toHaveBeenCalled();
});

it('validates by default when blurring a field and a blur validator is configured', () => {
  const context = setup({
    validate: {
      blur: z.object({
        name: z.string(),
      }),
    },
  });
  const validate = vi.spyOn(context.core, 'validate').mockResolvedValue([true, []]);

  context.field.blur('name');

  expect(validate).toHaveBeenCalledOnce();
  expect(validate).toHaveBeenCalledWith('name', { type: 'blur' });
});

it('skips validation when should.validate is false', () => {
  const context = setup({
    validate: {
      blur: z.object({
        name: z.string(),
      }),
    },
  });
  const validate = vi.spyOn(context.core, 'validate').mockResolvedValue([true, []]);

  context.field.blur('name', { should: { validate: false } });

  expect(validate).not.toHaveBeenCalled();
});

it('does not update state when the field is already blurred', () => {
  const context = setup();

  context.field.blur('name');
  const set = vi.spyOn(context.fields, 'set');

  context.field.blur('name');

  expect(set).not.toHaveBeenCalled();
});
