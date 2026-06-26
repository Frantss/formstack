import { createForm } from '#form/create-form';
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
  });
  return {
    form,
  };
};

it('accepts valid field paths for get and change', () => {
  const context = setup();
  const { form } = context;

  form.field.change('name', 'jane');
  form.field.change('age', 21);
  form.field.change('nested.enabled', true);

  const name = form.field.get('name');
  const age = form.field.get('age');
  const enabled = form.field.get('nested.enabled');

  expect(name).toBe('jane');
  expect(age).toBe(21);
  expect(enabled).toBe(true);
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

it('creates form id when id is not provided', () => {
  const context = setup();
  const { form } = context;

  expectTypeOf(form.id).toEqualTypeOf<string>();
  expect(form.id).toBeTypeOf('string');
  expect(form.id.length).toBeGreaterThan(0);
});

it('uses provided id', () => {
  const form = createForm({
    id: 'provided-form-id',
    schema,
    defaultValues,
  });

  expect(form.id).toBe('provided-form-id');
});

it('updates options via ~update', async () => {
  const context = setup();
  const { form } = context;
  const initialId = form.id;
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
  };

  form['~update'](next);
  const [valid] = await form.validate('name');

  expect(valid).toBe(false);
  expect(form.id).toBe(initialId);
});
