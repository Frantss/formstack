import { createField } from '#form/create-field';
import { createForm } from '#form/create-form';
import type { FormIssueEntry, FormIssuesByLevel } from '#types/api/form-issue-entry';
import { expect, expectTypeOf, it } from 'vite-plus/test';
import z from 'zod';

const schema = z.object({
  name: z.string(),
  age: z.number(),
  object: z.object({
    array: z
      .object({
        value: z.string(),
      })
      .array(),
  }),
  nested: z.object({
    enabled: z.boolean(),
  }),
  tags: z.string().array(),
});

const defaultValues = {
  name: 'john',
  age: 20,
  object: {
    array: [{ value: 'first' }],
  },
  nested: {
    enabled: false,
  },
  tags: ['a'],
};

const setup = () => {
  const form = createForm({
    schema,
    defaultValues,
    checks: {
      warning: {
        validate: {
          change: z.object({
            name: z.string().min(6),
          }),
        },
      },
    },
  });
  return {
    form,
  };
};

it('changes a string field path', () => {
  const context = setup();
  const { form } = context;

  form.field.change('name', 'jane');

  expect(form.field.get('name')).toBe('jane');
});

it('changes a number field path', () => {
  const context = setup();
  const { form } = context;

  form.field.change('age', 21);

  expect(form.field.get('age')).toBe(21);
});

it('changes a nested boolean field path', () => {
  const context = setup();
  const { form } = context;

  form.field.change('nested.enabled', true);

  expect(form.field.get('nested.enabled')).toBe(true);
});

it('accepts valid array field paths for array methods', () => {
  const context = setup();
  const { form } = context;

  form.array.append('tags', 'b');
  const tags = form.field.get('tags');

  expect(tags).toEqual(['a', 'b']);
});

it('infers correct value types from field paths', () => {
  const context = setup();
  const { form } = context;

  expectTypeOf(form.field.get('name')).toEqualTypeOf<string>();
  expectTypeOf(form.field.get('age')).toEqualTypeOf<number>();
  expectTypeOf(form.field.get('nested.enabled')).toEqualTypeOf<boolean>();
  expectTypeOf(form.field.get('tags')).toEqualTypeOf<string[]>();
  expectTypeOf(form.field.get('tags.0')).toEqualTypeOf<string | undefined>();
  expectTypeOf(form.field.get('object.array.0.value')).toEqualTypeOf<string | undefined>();
});

it('infers updater types for change correctly', () => {
  const context = setup();
  const { form } = context;

  form.field.change('name', current => {
    expectTypeOf(current).toEqualTypeOf<string>();
    return current.toUpperCase();
  });

  form.field.change('age', current => {
    expectTypeOf(current).toEqualTypeOf<number>();
    return current + 1;
  });

  form.field.change('nested.enabled', current => {
    expectTypeOf(current).toEqualTypeOf<boolean>();
    return !current;
  });

  const age = form.field.get('age');
  expect(age).toBe(21);
});

it('exposes status via form.status getter', () => {
  const context = setup();
  const { form } = context;

  expect(form.status).toEqual(form.store.state.status);
  expectTypeOf(form.status).toEqualTypeOf(form.store.state.status);
});

it('types generated form id as string', () => {
  const context = setup();
  const { form } = context;

  expectTypeOf(form.id).toEqualTypeOf<string>();
});

it('creates form id when id is not provided', () => {
  const context = setup();
  const { form } = context;

  expect(form.id).toBeTypeOf('string');
});

it('creates a non-empty form id when id is not provided', () => {
  const context = setup();
  const { form } = context;

  expect(form.id.length).toBeGreaterThan(0);
});

it('uses provided id when creating a form', () => {
  const form = createForm({
    id: 'provided-form-id',
    schema,
    defaultValues,
  });

  expect(form.id).toBe('provided-form-id');
});

it('uses updated validation options via ~update', async () => {
  const context = setup();
  const { form } = context;
  const next = {
    id: 'updated-form-id',
    schema: z.object({
      name: z.string().min(6, 'Name too short after update'),
      age: z.number(),
      object: z.object({
        array: z
          .object({
            value: z.string(),
          })
          .array(),
      }),
      nested: z.object({
        enabled: z.boolean(),
      }),
      tags: z.string().array(),
    }),
    defaultValues,
    checks: {
      warning: {
        validate: {
          change: z.object({
            name: z.string().min(7, 'Notice after update'),
          }),
        },
      },
    },
  };

  form['~update'](next);
  const [valid] = await form.validate('name');

  expect(valid).toBe(false);
});

it('keeps the existing id when options are updated', () => {
  const context = setup();
  const { form } = context;
  const initialId = form.id;

  form['~update']({
    id: 'updated-form-id',
    schema,
    defaultValues,
  });

  expect(form.id).toBe(initialId);
});

it('starts existing issues with configured levels', () => {
  const context = setup();
  const { form } = context;

  expect(form.store.state.fields['~root.name'].issues).toEqual({ error: [], warning: [] });
});

it('normalizes existing issues when update adds a configured level', () => {
  const context = setup();
  const { form } = context;

  form['~update']({
    schema,
    defaultValues,
    checks: {
      warning: {},
      notice: {},
    },
  } as never);

  expect(form.store.state.fields['~root.name'].issues).toEqual({
    error: [],
    warning: [],
    notice: [],
  });
});

it('normalizes existing issues when update removes an empty configured level', () => {
  const context = setup();
  const { form } = context;

  form['~update']({
    schema,
    defaultValues,
  });

  expect(form.store.state.fields['~root.name'].issues).toEqual({ error: [] });
});

it('preserves non-empty manual issues when update removes their configured level', () => {
  const context = setup();
  const { form } = context;
  const warning: FormIssueEntry<'warning'> = {
    level: 'warning',
    issue: { code: 'custom', message: 'Manual warning', path: ['name'] } as never,
  };

  form.field.setIssues('name', { warning: [warning] });
  form['~update']({
    schema,
    defaultValues,
  });

  expect(form.store.state.fields['~root.name'].issues).toEqual({
    error: [],
    warning: [warning],
  });
});

it('preserves values inference when issues are configured', async () => {
  const context = setup();
  const { form } = context;
  const field = createField({ form, name: 'name' });
  const issues = form.field.issues('name');
  const [, validationIssues] = await form.validate('name');

  field.setIssues({ warning: [] });
  // @ts-expect-error issues writes are grouped by level
  field.setIssues([]);

  expectTypeOf(form.options.checks?.warning?.validate?.change).toEqualTypeOf<
    NonNullable<NonNullable<NonNullable<typeof form.options.checks>['warning']>['validate']>['change'] | undefined
  >();
  expectTypeOf(issues).toEqualTypeOf<FormIssuesByLevel<'error' | 'warning'>>();
  expectTypeOf(await form.validate('name')).toEqualTypeOf<[boolean, FormIssuesByLevel<'error' | 'warning'>]>();
  expectTypeOf<(typeof issues)['error'][number]>().toEqualTypeOf<FormIssueEntry<'error'>>();
  expectTypeOf<(typeof issues)['warning'][number]>().toEqualTypeOf<FormIssueEntry<'warning'>>();
  expectTypeOf<(typeof validationIssues)['warning'][number]>().toEqualTypeOf<FormIssueEntry<'warning'>>();
  expectTypeOf<(typeof field.state.issues)['error'][number]['level']>().toEqualTypeOf<'error'>();
  expectTypeOf<(typeof field.state.issues)['warning'][number]['level']>().toEqualTypeOf<'warning'>();
  // @ts-expect-error issues no longer expose priority
  void issues.warning[0]?.priority;
  // @ts-expect-error status no longer exposes ranked issue levels
  void form.status.highestIssueLevel;
  // @ts-expect-error field status no longer exposes ranked issue levels
  void field.state.status.highestIssueLevel;
  // @ts-expect-error form status no longer exposes hasIssues
  void form.status.hasIssues;
  // @ts-expect-error field status no longer exposes hasIssues
  void field.state.status.hasIssues;
});
