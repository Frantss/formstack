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
    checks: {
      warning: {},
    },
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

const setupDefaultStatus = () =>
  setup({
    defaultStatus: {
      dirty: true,
      submitting: true,
      submits: 4,
      successful: true,
    },
  });

const setChangedFormStatus = (core: FormCore<Values>) => {
  core.persisted.setState(state => {
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
};

const setupChangedField = () => {
  const context = setup();
  const element = document.createElement('input');

  context.field.change('name', 'changed');
  context.field.setIssues('name', {
    error: [{ level: 'error', issue: { code: 'custom', message: 'issue', path: ['name'] } as never }],
    warning: [{ level: 'warning', issue: { code: 'custom', message: 'issue', path: ['name'] } as never }],
  });
  context.field.register('name')(element);
  setChangedFormStatus(context.core);

  return {
    context,
    element,
  };
};

it('initializes status with configured defaults', () => {
  const context = setupDefaultStatus();

  expect(context.core.store.state.status).toMatchObject({
    dirty: true,
    submits: 4,
    submitting: true,
    successful: true,
  });
});

it('resets status with configured defaults', () => {
  const context = setupDefaultStatus();

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

  expect(context.core.store.state.status).toMatchObject({
    dirty: true,
    submits: 4,
    submitting: true,
    successful: true,
  });
});

it('resets field status using wildcard defaults', () => {
  const context = setup({
    defaultFieldStatus: {
      '*': { touched: true },
      name: { dirty: true },
      'nested.value': { blurred: true },
    },
  });

  context.field.change('name', 'changed');
  context.core.reset();

  expect(context.core.store.state.fields['~root.name'].status).toMatchObject({
    dirty: true,
    touched: true,
  });
});

it('resets field status using field-specific defaults', () => {
  const context = setup({
    defaultFieldStatus: {
      '*': { touched: true },
      name: { dirty: true },
      'nested.value': { blurred: true },
    },
  });

  context.field.focus('nested.value');
  context.field.blur('nested.value');
  context.core.reset();

  expect(context.core.store.state.fields['~root.nested.value'].status).toMatchObject({
    blurred: true,
    touched: true,
  });
});

it('resets values by default', () => {
  const { context } = setupChangedField();

  context.core.reset();

  expect(context.core.store.state.values).toEqual(defaultValues);
});

it('resets error issues by default', () => {
  const { context } = setupChangedField();

  context.core.reset();

  expect(context.core.store.state.fields['~root.name'].issues.error).toEqual([]);
});

it('resets warning issues by default', () => {
  const { context } = setupChangedField();

  context.core.reset();

  expect(context.core.store.state.fields['~root.name'].issues.warning).toEqual([]);
});

it('resets refs by default', () => {
  const { context } = setupChangedField();

  context.core.reset();

  expect(context.core.store.state.fields['~root.name'].ref).toBeNull();
});

it('resets field status by default', () => {
  const { context } = setupChangedField();

  context.core.reset();

  expect(context.core.store.state.fields['~root.name'].status).toMatchObject({
    dirty: false,
  });
});

it('resets form status by default', () => {
  const { context } = setupChangedField();

  context.core.reset();

  expect(context.core.store.state.status).toMatchObject({
    dirty: false,
    submits: 0,
    submitting: false,
    successful: false,
  });
});

it('resets to custom values', () => {
  const context = setup();

  context.core.reset({
    values: {
      name: 'custom',
      nested: {
        value: 'custom nested',
      },
    },
  });

  expect(context.core.store.state.values).toEqual({
    name: 'custom',
    nested: {
      value: 'custom nested',
    },
  });
});

it('resets to custom status', () => {
  const context = setup();

  context.core.reset({
    status: {
      dirty: true,
      successful: true,
    },
  });

  expect(context.core.store.state.status).toMatchObject({
    dirty: true,
    submits: 0,
    successful: true,
  });
});

it('resets values while keeping fields', () => {
  const { context } = setupChangedField();

  context.core.reset({ keep: { fields: true } });

  expect(context.core.store.state.values).toEqual(defaultValues);
});

it('keeps field issues when keep.fields is true', () => {
  const { context } = setupChangedField();

  context.core.reset({ keep: { fields: true } });

  expect(context.core.store.state.fields['~root.name'].issues.error).toHaveLength(1);
});

it('keeps field refs when keep.fields is true', () => {
  const { context, element } = setupChangedField();

  context.core.reset({ keep: { fields: true } });

  expect(context.core.store.state.fields['~root.name'].ref).toBe(element);
});

it('keeps field status when keep.fields is true', () => {
  const { context } = setupChangedField();

  context.core.reset({ keep: { fields: true } });

  expect(context.core.store.state.fields['~root.name'].status.dirty).toBe(true);
});

it('keeps requested error issues without keep.fields', () => {
  const { context } = setupChangedField();

  context.core.reset({ keep: { refs: true, issues: ['error'] } });

  expect(context.core.store.state.fields['~root.name'].issues.error).toHaveLength(1);
});

it('clears unrequested issues without keep.fields', () => {
  const { context } = setupChangedField();

  context.core.reset({ keep: { refs: true, issues: ['error'] } });

  expect(context.core.store.state.fields['~root.name'].issues.warning).toEqual([]);
});

it('keeps requested refs without keep.fields', () => {
  const { context, element } = setupChangedField();

  context.core.reset({ keep: { refs: true, issues: ['error'] } });

  expect(context.core.store.state.fields['~root.name'].ref).toBe(element);
});

it('resets status without keep.fields', () => {
  const { context } = setupChangedField();

  context.core.reset({ keep: { refs: true, issues: ['error'] } });

  expect(context.core.store.state.fields['~root.name'].status).toMatchObject({
    dirty: false,
    touched: false,
  });
});

it('keeps error issues when issues keep option is true', () => {
  const { context } = setupChangedField();

  context.core.reset({ keep: { issues: true } });

  expect(context.core.store.state.fields['~root.name'].issues.error).toHaveLength(1);
});

it('keeps warning issues when issues keep option is true', () => {
  const { context } = setupChangedField();

  context.core.reset({ keep: { issues: true } });

  expect(context.core.store.state.fields['~root.name'].issues.warning).toHaveLength(1);
});

it('skips missing existing field entries while keeping refs', () => {
  const context = setup();

  context.core.reset({
    values: {
      name: 'name',
      nested: {
        value: 'value',
        extra: 'extra',
      },
    } as never,
    keep: {
      refs: true,
    },
  });

  expect(context.core.store.state.fields['~root.nested.extra']).toBeDefined();
});
