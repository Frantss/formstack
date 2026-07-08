import { createField } from '#form/create-field';
import { createForm } from '#form/create-form';
import type { FormIssueEntry, FormIssuesByLevel } from '#types/api/form-issue-entry';
import { expect, expectTypeOf, it } from 'vite-plus/test';
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

const setup = () => {
  const form = createForm({
    schema,
    defaultValues,
    checks: {
      warning: {
        blocking: false,
      },
    },
  });
  const field = createField({
    form,
    name: 'name',
  });

  return {
    form,
    field,
  };
};

it('generates a field id', () => {
  const context = setup();

  expect(context.field.id).toBeTypeOf('string');
});

it('changes the field value', () => {
  const context = setup();

  context.field.change('updated');

  expect(context.field.value).toBe('updated');
});

it('gets the changed field value', () => {
  const context = setup();

  context.field.change('updated');

  expect(context.field.get()).toBe('updated');
});

it('forwards changed values to the form field api', () => {
  const context = setup();

  context.field.change('updated');

  expect(context.form.field.get('name')).toBe('updated');
});

it('forwards focus behavior to the underlying field', () => {
  const context = setup();

  context.field.focus();

  expect(context.form.field.status('name').touched).toBe(true);
});

it('forwards blur behavior to the underlying field', () => {
  const context = setup();

  context.field.blur();

  expect(context.form.field.status('name').blurred).toBe(true);
});

it('forwards registration behavior', () => {
  const context = setup();
  const element = document.createElement('input');

  context.field.register(element);

  expect(context.form.store.state.fields['~root.name'].ref).toBe(element);
});

it('forwards unregistration behavior', () => {
  const context = setup();
  const element = document.createElement('input');

  context.field.register(element);
  context.field.unregister();

  expect(context.form.store.state.fields['~root.name'].ref).toBeNull();
});

it('updates field options', () => {
  const context = setup();
  const unmount = context.field['~mount']();

  context.field['~update']({
    form: context.form,
    name: 'nested.value',
  });

  expect(context.field.options.name).toBe('nested.value');
  unmount();
});

it('updates field value after options update', () => {
  const context = setup();

  context.field['~update']({
    form: context.form,
    name: 'nested.value',
  });

  expect(context.field.get()).toBe('value');
});

it('updates field state after options update', () => {
  const context = setup();

  context.field['~update']({
    form: context.form,
    name: 'nested.value',
  });

  expect(context.field.state.value).toBe('value');
});

it('mounts field with an unmount function', () => {
  const context = setup();
  const unmount = context.field['~mount']();

  expect(unmount).toBeTypeOf('function');
  unmount();
});

it('forwards error issues', () => {
  const context = setup();

  context.field.setIssues({
    error: [{ level: 'error', issue: { code: 'custom', message: 'issue', path: ['name'] } as never }],
  });

  expect(context.field.issues().error).toHaveLength(1);
});

it('resets error issues', () => {
  const context = setup();

  context.field.setIssues({
    error: [{ level: 'error', issue: { code: 'custom', message: 'issue', path: ['name'] } as never }],
  });

  context.field.reset({ value: 'reset value' });

  expect(context.field.issues().error).toEqual([]);
});

it('resets field value', () => {
  const context = setup();

  context.field.change('changed');
  context.field.reset({ value: 'reset value' });

  expect(context.field.get()).toBe('reset value');
});

it('forwards issues operations', () => {
  const context = setup();
  const issue: FormIssueEntry<'warning'> = {
    level: 'warning',
    issue: { code: 'custom', message: 'issue', path: ['name'] } as never,
  };
  const issues = { error: [], warning: [issue] };

  context.field.setIssues(issues);

  expect(context.field.issues()).toEqual(issues);
});

it('forwards issues state', () => {
  const context = setup();
  const issue: FormIssueEntry<'warning'> = {
    level: 'warning',
    issue: { code: 'custom', message: 'issue', path: ['name'] } as never,
  };
  const issues = { error: [], warning: [issue] };

  context.field.setIssues(issues);

  expect(context.field.state.issues).toEqual(issues);
});

it('types issues operations and state', () => {
  const context = setup();

  expectTypeOf(context.field.issues()).toEqualTypeOf<FormIssuesByLevel<'error' | 'warning'>>();
  expectTypeOf(context.field.state.issues).toEqualTypeOf<FormIssuesByLevel<'error' | 'warning'>>();
  expectTypeOf<(typeof context.field.state.issues.error)[number]['level']>().toEqualTypeOf<'error'>();
});
