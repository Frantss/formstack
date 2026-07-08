# oxform-react

React bindings for [Oxform](https://github.com/frantss/oxform). Provides a
small set of hooks and render-prop components that wrap `oxform-core`.

## Installation

```bash
npm install oxform-react
yarn add oxform-react
pnpm add oxform-react
bun add oxform-react
```

Peer dependencies: React `^16.8.0 || ^17 || ^18 || ^19`.

## Quick start

```tsx
import { Field, useForm } from 'oxform-react';
import z from 'zod';

const schema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
});

export function SignupForm() {
  const form = useForm({
    schema,
    defaultValues: { name: '', email: '' },
    checks: {
      error: {
        validate: { change: schema },
      },
    },
  });

  return (
    <form
      onSubmit={event => {
        event.preventDefault();
        return form.submit(console.log, console.error)();
      }}
    >
      <Field form={form} name='name'>
        {field => <input type='text' {...field.props} />}
      </Field>
      <Field form={form} name='email'>
        {field => <input type='email' {...field.props} />}
      </Field>
      <button type='submit'>Submit</button>
      <button type='button' onClick={() => form.reset()}>
        Reset
      </button>
    </form>
  );
}
```

`field.props` spreads `value`, `ref`, `onChange`, `onBlur`, `onFocus` onto
any standard input element. Reach for `field.change(value)` directly when
you need to coerce the value (e.g. `valueAsNumber` for numeric inputs).

---

## Common patterns

### Array fields

```tsx
import { ArrayField, Field, useForm } from 'oxform-react';
import z from 'zod';

const schema = z.object({ directions: z.string().array() });

const form = useForm({
  schema,
  defaultValues: { directions: [] },
  checks: {
    error: {
      validate: { change: schema },
    },
  },
});

<ArrayField form={form} name='directions'>
  {array => (
    <>
      {array.ids?.map((id, index) => (
        <Field key={id} form={form} name={`directions.${index}`}>
          {field => (
            <div>
              <input type='text' {...field.props} />
              <button type='button' onClick={() => array.move(index, index - 1)}>
                Up
              </button>
              <button type='button' onClick={() => array.remove(index)}>
                Remove
              </button>
            </div>
          )}
        </Field>
      ))}
      <button type='button' onClick={() => array.append('')}>
        Add
      </button>
    </>
  )}
</ArrayField>;
```

`array.ids` returns one stable id per current item — use it as the React
`key`. The full list of array operations (`append`, `prepend`, `insert`,
`swap`, `move`, `update`, `remove`, `replace`) is documented in
[`oxform-core`](../core/readme.md#arrayfieldapivalue-extends-arraylike).

### Reactive submit button via `Subscribe`

```tsx
import { Subscribe } from 'oxform-react';

<Subscribe api={form} selector={state => state.status}>
  {status => (
    <button type='submit' disabled={status.validating || status.submitting}>
      {status.validating ? 'Validating…' : status.submitting ? 'Submitting…' : 'Submit'}
    </button>
  )}
</Subscribe>;
```

`Subscribe` re-renders only when the selected slice changes. Pair it with a
narrow `selector` to avoid re-rendering on unrelated form state changes.

### Side effects with `useFormEffect`

```tsx
import { useFieldApi, useForm, useFormEffect } from 'oxform-react';

const form = useForm({
  schema,
  defaultValues: { name: '' },
  checks: {
    error: {
      validate: { change: schema },
    },
  },
});
const name = useFieldApi({ form, name: 'name' });

useFormEffect(
  form,
  state => state.status.submits,
  submits => {
    console.log('submits ->', submits);
  },
);

useFormEffect(
  name,
  state => state.value,
  value => {
    console.log('name value ->', value);
  },
);
```

The selector and callback refs are updated on every render; the underlying
effect is recreated only when `api` changes. The first run is skipped — only
subsequent changes invoke the callback.

### Reading error issues

`field.state.issues.error` is a `FormIssueEntry<'error'>[]`. A typical
inline error component:

```tsx
function FieldError({
  field,
}: {
  field: { state: { status: { valid: boolean }; issues: { error: { issue: { message: string } }[] } } };
}) {
  if (field.state.status.valid) return null;
  return <span>{field.state.issues.error.map(e => e.issue.message).join(', ')}</span>;
}
```

---

## Hooks

### `useForm`

```ts
useForm<Values>(options: FormOptions<Values>): UseFormReturn<Values>
```

Creates a form on first render and keeps it stable for the component's
lifetime. The returned object is the `FormApi` with a reactive `status`
property that re-renders the component when any form-status flag changes.

Options come from [`FormOptions`](../core/readme.md#formoptionsvalues).

```tsx
const form = useForm({
  schema,
  defaultValues: { email: '' },
  checks: {
    error: {
      validate: { change: schema, submit: schema },
    },
  },
});

form.field.change('email', 'ada@example.com');
form.submit(
  values => save(values),
  issues => toast(issues.error),
)();
form.reset();
```

> Note: passing a different `id` after the first render does not currently
> recreate the form (`useForm` snapshots options on mount). Keep options
> stable per form instance.

### `useField`

```ts
useField<Form, Name>(options: FieldOptions<Form, Name>): UseFieldReturn<Value>
```

Subscribes to a single field's value, issues, status, and ref. Returns a
`FieldApi` extended with two extras:

- `state` — `{ id, value, defaultValue, issues, ref, status }`
- `props` — `{ value, ref, onChange, onBlur, onFocus }` ready to spread.

```tsx
const field = useField({ form, name: 'email' });

<input {...field.props} />;
field.change('new value');
field.issues().error; // FormIssueEntry<'error'>[]
```

The `onChange` handler reads `event.target?.value` (matches both DOM events
and synthetic-style payloads). For values that need coercion (numbers,
checkboxes, files), call `field.change(coerced)` from your own handler.

### `useFieldApi`

```ts
useFieldApi<Form, Name>(options: FieldOptions<Form, Name>): UseFieldApiReturn<Form, Name>
```

Same input as `useField`, but does not subscribe to field state — useful
when you only need the methods (e.g. inside a `useFormEffect` selector or
when a parent already subscribes via `useField`).

```tsx
const api = useFieldApi({ form, name: 'email' });
useFormEffect(
  api,
  state => state.value,
  value => console.log(value),
);
```

### `useArrayField`

```ts
useArrayField<Form, Name>(options: ArrayFieldOptions<Form, Name>): UseArrayFieldReturn<Value>
```

Subscribes to an array field and returns the `ArrayFieldApi` with a `state`
extension matching `useField`. Use `array.ids` for stable React keys.

```tsx
const array = useArrayField({ form, name: 'items' });
array.append({ id: crypto.randomUUID(), text: '' });
array.move(0, 2);
```

### `useFormStatus`

```ts
useFormStatus<Values>({ form }: UseFormStatusProps<Values>): UseFormStatusReturn
```

Subscribes to the form's [`FormStatus`](../core/readme.md#formstatus) only —
no `values` subscription. Useful for status badges and submit buttons when
you don't want a `<Subscribe>` wrapper.

```tsx
const status = useFormStatus({ form });
return <span>{status.dirty ? 'Unsaved changes' : 'Up to date'}</span>;
```

(`useForm` already exposes a reactive `form.status` built on top of this.)

### `useFormEffect`

```ts
useFormEffect<Api, Selected>(
  api: Api,
  selector: ApiSelector<Api, Selected>,
  fn: (state: Selected) => void | Promise<void>,
): void
```

Runs `fn` whenever the selected slice changes (deep-equal comparison). The
first render is skipped. Selector and callback refs are refreshed each
render; the underlying TanStack effect is recreated only when `api` changes.

`Api` can be any object exposing a `.store` — a `FormApi`, `FieldApi`, or
`ArrayFieldApi` returned by `useForm` / `useFieldApi` / `useArrayField`.

### `useSubscribe`

```ts
useSubscribe<Api, Selected>(api: Api, selector: ApiSelector<Api, Selected>): Selected
```

The hook form of `<Subscribe>`. Returns the selected slice and re-renders
when it changes.

```tsx
const dirty = useSubscribe(form, state => state.status.dirty);
```

---

## Components

### `<Field>`

```ts
<Field form={form} name={name}>{field => …}</Field>
```

Render-prop wrapper around `useField`. Props:

| Prop       | Type                                                                   |
| ---------- | ---------------------------------------------------------------------- |
| `form`     | `AnyFormApi`                                                           |
| `name`     | `FormFields<Form>`                                                     |
| `children` | `React.ReactNode \| (field: UseFieldReturn<Value>) => React.ReactNode` |

The render function receives the same object `useField` returns.

### `<ArrayField>`

```ts
<ArrayField form={form} name={name}>{array => …}</ArrayField>
```

Render-prop wrapper around `useArrayField`. Props:

| Prop       | Type                                                                        |
| ---------- | --------------------------------------------------------------------------- |
| `form`     | `AnyFormApi`                                                                |
| `name`     | `FormArrayFields<Form>`                                                     |
| `children` | `React.ReactNode \| (array: UseArrayFieldReturn<Value>) => React.ReactNode` |

### `<Subscribe>`

```ts
<Subscribe api={api} selector={selector}>{selected => …}</Subscribe>
```

Render-prop wrapper around `useSubscribe`. Props:

| Prop       | Type                                                         |
| ---------- | ------------------------------------------------------------ |
| `api`      | `AnyFormLikeApi` (form, field, or array-field API)           |
| `selector` | `ApiSelector<Api, Selected>`                                 |
| `children` | `React.ReactNode \| (selected: Selected) => React.ReactNode` |

---

## TypeScript types

| Type                            | Definition                                                                                           |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `UseFormReturn<Values>`         | `FormApi<Values>`                                                                                    |
| `UseFieldReturn<Value>`         | `FieldApi<Value> & { props: { value, ref, onChange, onBlur, onFocus } }`                             |
| `UseFieldApiReturn<Form, Name>` | `FieldApi<FormFieldValue<Form, Name>>`                                                               |
| `UseArrayFieldReturn<Value>`    | `ArrayFieldApi<Value>`                                                                               |
| `UseFormStatusReturn`           | `FormStatus`                                                                                         |
| `UseFormStatusProps<Values>`    | `{ form: FormApi<Values> }`                                                                          |
| `FieldProps<Form, Name>`        | `FieldOptions<Form, Name> & { children: ReactNode \| (field) => ReactNode }`                         |
| `ArrayFieldProps<Form, Name>`   | `FieldOptions<Form, Name> & { children: ReactNode \| (array) => ReactNode }`                         |
| `SubscribeProps<Api, Selected>` | `{ api: Api; selector: ApiSelector<Api, Selected>; children: ReactNode \| (selected) => ReactNode }` |

---

## Re-exports from `oxform-core`

For convenience, the following are re-exported from `oxform-core` so you
don't need a separate import. See the
[core readme](../core/readme.md) for full definitions.

- `formOptions`
- Types: `AnyFormApi`, `AnyFormLikeApi`, `ApiSelector`, `ArrayFieldApi`,
  `ArrayFieldOptions`, `ArrayFieldStore`, `ArrayLike`, `EventLike`,
  `FieldApi`, `FieldBlurOptions`, `FieldChangeOptions`, `FieldExtra`,
  `FieldFocusOptions`, `FieldOptions`, `FieldPlugin`, `FieldPluginsInput`,
  `FieldResetKeepOptions`, `FieldResetStatus`, `FieldSetIssuesMode`,
  `FieldState`, `FieldStatus`, `FieldStore`, `FormApi`, `FormArrayFields`,
  `FormIssue`, `FormIssueLevel`, `FormIssuesByLevel`,
  `FormIssuesByLevelInput`, `FormChecksMap`, `FormIssuesOptions`,
  `FormErrorIssueLevel`, `FormFields`, `FormFieldValue`, `FormIssue`,
  `FormLikeStore`, `FormOptions`, `FormResetFieldOptions`,
  `FormResetKeepOptions`, `FormResetOptions`, `FormSetIssuesOptions`,
  `FormStatus`, `FormStore`, `FormSubmitErrorHandler`,
  `FormSubmitSuccessHandler`, `FormValues`, `FormWithOptions`,
  `StandardSchema`, `ValidateOptions`, `ValidationType`.

## Examples

The [examples workspace](../../examples/react/src/examples) has runnable
demos for each pattern: `basic.tsx`, `array.tsx`, `async.tsx`, `effect.tsx`,
`transform.tsx`.
