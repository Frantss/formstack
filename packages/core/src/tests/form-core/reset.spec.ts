import { FormCore } from '#form/form-core';
import { FormCoreField } from '#form/form-core-field';
import { FormCoreFields } from '#form/form-core-fields';
import type { FormOptions } from '#types/api/form-options';
import { expect, it } from 'vite-plus/test';
import z from 'zod';

const schema = z.object({
  name: z.string(),
  nested: z.object({
    value: z.string(),
  }),
});

const defaultValues = {
  name: 'name',
  nested: {
    value: 'value',
  },
};

type Values = z.infer<typeof schema>;

const setup = (options?: {
  defaultStatus?: FormOptions<Values>['defaultStatus'];
  defaultFieldStatus?: FormOptions<Values>['defaultFieldStatus'];
}) => {
  const core = new FormCore<Values>({
    schema,
    defaultValues,
    defaultStatus: options?.defaultStatus,
    defaultFieldStatus: options?.defaultFieldStatus,
  });
  const fields = new FormCoreFields<Values>({ core });
  const field = new FormCoreField<Values>({ core, fields });

  return {
    core,
    field,
  };
};

it('initializes and resets status with configured defaults', () => {
  const context = setup({
    defaultStatus: {
      dirty: true,
      submitting: true,
      submits: 4,
      successful: true,
    },
  });

  expect(context.core.store.state.status.dirty).toBe(true);
  expect(context.core.store.state.status.submitting).toBe(true);
  expect(context.core.store.state.status.submits).toBe(4);
  expect(context.core.store.state.status.successful).toBe(true);

  context.core.persisted.setState(state => {
    return {
      ...state,
      status: {
        ...state.status,
        dirty: false,
        submits: 1,
        submitting: false,
        successful: false,
      },
    };
  });

  context.core.reset();

  expect(context.core.store.state.status.dirty).toBe(true);
  expect(context.core.store.state.status.submitting).toBe(true);
  expect(context.core.store.state.status.submits).toBe(4);
  expect(context.core.store.state.status.successful).toBe(true);
});

it('resets field status using wildcard and field-specific defaults', () => {
  const context = setup({
    defaultFieldStatus: {
      '*': { touched: true },
      name: { dirty: true },
      'nested.value': { blurred: true },
    },
  });

  context.field.change('name', 'changed');
  context.field.focus('nested.value');
  context.field.blur('nested.value');

  context.core.reset();

  expect(context.core.store.state.fields['~root.name'].status).toMatchObject({
    dirty: true,
    touched: true,
    blurred: false,
  });
  expect(context.core.store.state.fields['~root.nested.value'].status).toMatchObject({
    dirty: false,
    touched: true,
    blurred: true,
  });
});

it('resets values, fields, and status by default', () => {
  const context = setup();
  const element = document.createElement('input');

  context.field.change('name', 'changed');
  context.field.setErrors('name', [{ code: 'custom', message: 'issue', path: ['name'] } as never]);
  context.field.register('name')(element);
  context.core.persisted.setState(state => {
    return {
      ...state,
      status: {
        ...state.status,
        dirty: true,
        submits: 3,
        submitting: true,
        successful: true,
      },
    };
  });

  context.core.reset();

  expect(context.core.store.state.values).toEqual(defaultValues);
  expect(context.core.store.state.fields['~root.name'].errors).toEqual([]);
  expect(context.core.store.state.fields['~root.name'].ref).toBeNull();
  expect(context.core.store.state.fields['~root.name'].status.dirty).toBe(false);
  expect(context.core.store.state.status.submits).toBe(0);
  expect(context.core.store.state.status.submitting).toBe(false);
  expect(context.core.store.state.status.successful).toBe(false);
  expect(context.core.store.state.status.dirty).toBe(false);
});

it('resets to custom values and status', () => {
  const context = setup();

  context.core.reset({
    values: {
      name: 'custom',
      nested: {
        value: 'custom nested',
      },
    },
    status: {
      dirty: true,
      successful: true,
    },
  });

  expect(context.core.store.state.values).toEqual({
    name: 'custom',
    nested: {
      value: 'custom nested',
    },
  });
  expect(context.core.store.state.status.dirty).toBe(true);
  expect(context.core.store.state.status.successful).toBe(true);
  expect(context.core.store.state.status.submits).toBe(0);
});

it('keeps fields when keep.fields is true', () => {
  const context = setup();
  const element = document.createElement('input');

  context.field.change('name', 'changed');
  context.field.setErrors('name', [{ code: 'custom', message: 'issue', path: ['name'] } as never]);
  context.field.register('name')(element);

  context.core.reset({ keep: { fields: true } });

  expect(context.core.store.state.values).toEqual(defaultValues);
  expect(context.core.store.state.fields['~root.name'].errors).toHaveLength(1);
  expect(context.core.store.state.fields['~root.name'].ref).toBe(element);
  expect(context.core.store.state.fields['~root.name'].status.dirty).toBe(true);
});

it('keeps refs and errors when requested without keep.fields', () => {
  const context = setup();
  const element = document.createElement('input');

  context.field.change('name', 'changed');
  context.field.setErrors('name', [{ code: 'custom', message: 'issue', path: ['name'] } as never]);
  context.field.register('name')(element);

  context.core.reset({ keep: { refs: true, errors: true } });

  expect(context.core.store.state.fields['~root.name'].errors).toHaveLength(1);
  expect(context.core.store.state.fields['~root.name'].ref).toBe(element);
  expect(context.core.store.state.fields['~root.name'].status.dirty).toBe(false);
  expect(context.core.store.state.fields['~root.name'].status.touched).toBe(false);
});
