# Checks and Issues Reference

Checks are schema-driven validators grouped by level. They emit issues. The
reserved `error` level is used for normal validation errors and is always
blocking. Other levels can be used for warnings, notices, review prompts, or
risk checks.

Issues are part of `oxform-core` and are exposed through the React package
without changing their shape.

## Mental Model

Normal validation writes `issues.error` and always blocks validity when
issues exist. Other issue levels block validity only when configured with
`blocking: true`.

```ts
const form = createForm({
  schema,
  defaultValues,
  checks: {
    error: {
      validate: {
        change: schema,
        submit: schema,
      },
    },
    warning: {
      blocking: false,
      validate: {
        change: warningSchema,
      },
    },
    risk: {
      blocking: true,
      validate: {
        submit: riskSchema,
      },
    },
  },
});
```

Issues are grouped by issue level first, then by validation event:

```ts
checks: {
  warning: {
    blocking: false,
    validate: {
      change: changeWarningSchema,
    },
  },
  notice: {
    validate: {
      change: changeNoticeSchema,
    },
  },
  risk: {
    blocking: true,
    validate: {
      submit: submitRiskSchema,
    },
  },
}
```

Each configured value is a Standard Schema object or a function that receives
the current form store and returns a Standard Schema object.

## Types

```ts
type FormIssueEntry<Level extends string = string> = {
  type?: ValidationType;
  level: Level;
  issue: FormIssue;
};

type FormIssuesByLevel<Level extends string = string> = {
  [Key in 'error' | Level]: FormIssueEntry<Key>[];
};

type FormChecksMap<Values, Level extends string = string> = {
  [Key in Level]?: {
    blocking?: boolean;
    validate?: Partial<Record<ValidationType, FormCheckValidator<Values, Level>>>;
  };
};
```

`FormIssue` is the Standard Schema issue type. The `error` level is reserved
for validation errors and is included in inferred issue levels.

`type` is set when a issue was produced by event validation. Manual
issues written with `setIssues` may omit it.

## Configuring Checks

Use `checks` for event-specific issue validators:

```ts
const emailSchema = z.object({
  email: z.email(),
});

const form = createForm({
  schema: emailSchema,
  defaultValues: {
    email: '',
  },
  checks: {
    warning: {
      blocking: false,
      validate: {
        change: z.object({
          email: z.email().refine(value => value.endsWith('@company.com'), 'Use a company email'),
        }),
      },
    },
    risk: {
      blocking: true,
      validate: {
        submit: z.object({
          email: z.email().refine(value => !value.endsWith('@blocked.example'), 'Blocked provider'),
        }),
      },
    },
  },
});
```

Supported events match validation events:

| Event    | Common use                                                          |
| -------- | ------------------------------------------------------------------- |
| `change` | Live warnings, hints, or best-practice feedback.                    |
| `blur`   | Feedback that should wait until the user leaves the field.          |
| `focus`  | State-dependent notices when the field becomes active.              |
| `submit` | Final review, risk, policy, or business-rule checks before success. |

If `blocking` is omitted for a level, it is non-blocking by default.

## Running Issues

Call `validate` directly when you need explicit control:

```ts
const [valid, issues] = await form.validate('email', {
  type: 'change',
});
```

Signature:

```ts
validate(
  fields?: DeepKeys<Values> | DeepKeys<Values>[],
  options?: ValidateOptions,
): Promise<[boolean, FormIssuesByLevel]>
```

The returned boolean describes the issues emitted by that validation run.
It is `false` when that run emitted an `error` issue or any blocking
issue.

It is not a complete form-validity snapshot. The form can still be invalid
because of existing `error` issues or existing blocking issues from another event.
Use `form.status.valid` or `form.store.state.status.valid` for current aggregate
validity.

When `fields` is provided, only the field path and its descendants are updated.
Other fields keep their current issues.

When `options.type` is provided, only issues for that event are refreshed.
Issues from other events stay visible. When `options.type` is omitted, all
configured issue events are refreshed for the target subtree.

## Automatic Event Validation

Field operations trigger issues the same way they trigger normal
validation:

```ts
form.field.change('email', 'ada@gmail.com');
form.field.blur('email');
form.field.focus('email');
```

For each operation, checks run by default only when a matching check event is
configured:

| Operation            | Check event     |
| -------------------- | --------------- |
| `field.change(...)`  | `checks.change` |
| `field.blur(...)`    | `checks.blur`   |
| `field.focus(...)`   | `checks.focus`  |
| `form.submit(...)()` | `checks.submit` |

Pass `should.validate: false` to `change`, `blur`, or `focus` to skip both
normal validation and checks for that field operation.

## Submit Behavior

`submit` runs normal submit validation first, then submit issues:

```ts
await form.submit(onSuccess, onError)();
```

The submit succeeds only when normal submit validation passes and the current
form has no blocking issues after submit issues finish.

This includes blocking issues from:

- The submit issues run.
- Earlier issues from other events.
- Manual issues written with `setIssues`.

When submit fails, `onError` receives current issues:

```ts
form.submit(
  async values => {
    console.log('submitted', values);
  },
  async (issues, form) => {
    console.log(issues.risk);
  },
);
```

Non-blocking issues do not fail submit.

## Reading Issues

Read field issues through `form.field.issues`:

```ts
const issues = form.field.issues('email');

issues.warning; // FormIssueEntry<'warning'>[]
issues.risk; // FormIssueEntry<'risk'>[]
```

Pass `{ nested: true }` to aggregate issues from the target path and all
descendants:

```ts
const profileIssues = form.field.issues('profile', {
  nested: true,
});
```

Issues are returned as an object keyed by level. For rendering all current
issues, flatten the values:

```ts
const allIssues = Object.values(field.state.issues).flat();
```

Configured levels are always present in grouped results, even when the array is
empty. Levels that are only introduced manually appear when issues exist
for that level.

## Manual Issues

Use `setIssues` to write issues without running a schema:

```ts
form.field.setIssues('email', {
  warning: [
    {
      level: 'warning',
      issue: {
        code: 'custom',
        message: 'This address may not receive transactional email.',
        path: ['email'],
      },
    },
  ],
});
```

Manual issues support replace, append, and keep write modes:

```ts
form.field.setIssues('email', issues, { mode: 'replace' }); // default
form.field.setIssues('email', issues, { mode: 'append' });
form.field.setIssues('email', issues, { mode: 'keep' });
```

Manual issues are preserved when event validation refreshes issues
because they do not have a `type`.

If a manual issue uses a blocking level, it affects field and form
validity and can fail submit.

## Clearing Issues

Event-produced issues are cleared by running issues for the same event
and target when the schema no longer emits issues:

```ts
await form.validate('email', { type: 'change' });
```

Running an event with no configured validators clears existing issues for
that event on the target subtree, while preserving issues from other
events and manual issues.

To clear manual issues, replace them manually:

```ts
form.field.setIssues('email', {
  warning: [],
});
```

To clear all issues during reset, use the default reset behavior:

```ts
form.reset();
```

To keep issues across reset:

```ts
form.reset({
  keep: {
    issues: true,
  },
});
```

## Blocking Levels

Only levels configured with `blocking: true` affect validity:

```ts
checks: {
  warning: {
    blocking: false,
    validate: { change: warningSchema },
  },
  risk: {
    blocking: true,
    validate: { submit: riskSchema },
  },
}
```

Blocking issues make the affected field invalid and make the form invalid.
They do not move into `errors`; consumers should still read them from
`issues`.

Non-blocking issues remain visible but do not affect `status.valid` or
submit success.

## React Usage

React bindings expose the same grouped issue shape through field state:

```tsx
import { Field, useForm } from 'oxform-react';

function EmailForm() {
  const form = useForm({
    schema,
    defaultValues,
    checks,
  });

  return (
    <Field form={form} name='email'>
      {field => {
        const issues = Object.values(field.state.issues).flat();

        return (
          <>
            <input {...field.props} />
            {issues.map((issue, index) => (
              <p key={`${issue.level}-${index}`}>{issue.issue.message}</p>
            ))}
          </>
        );
      }}
    </Field>
  );
}
```

`useField` and `useArrayField` expose `state.issues`. `useFormStatus`
exposes aggregate validity through `valid`, but does not expose issue
counts, highest level, or issue summaries.

## Type Inference

`createForm` and `useForm` infer issue levels from `checks` keys:

```ts
const form = createForm({
  schema,
  defaultValues,
  checks: {
    warning: {
      validate: {
        change: warningSchema,
      },
    },
    risk: {
      blocking: true,
      validate: {
        submit: riskSchema,
      },
    },
  },
});

const issues = form.field.issues('email');
issues.warning; // FormIssueEntry<'warning'>[]
issues.risk; // FormIssueEntry<'risk'>[]
```

If no levels can be inferred, issues fall back to `string`.

## Async Checks

Check schemas may be asynchronous. While an async check is pending,
`status.validating` is `true`.

If form values change before an async check resolves, the stale result is
ignored and does not overwrite newer field state. Updates to unrelated target
paths do not invalidate the pending check.

## API Summary

| API                                 | Purpose                                                            |
| ----------------------------------- | ------------------------------------------------------------------ |
| `options.checks`                    | Level-keyed issue config with event validators and blocking flags. |
| `form.validate(fields?, opts)`      | Runs validation and returns `[valid, issues]`.                     |
| `form.field.issues(name, opts?)`    | Reads grouped issues for one field, optionally including children. |
| `form.field.setIssues(name, value)` | Writes manual issues with replace, append, or keep semantics.      |
| `field.state.issues`                | React/core field state issues grouped by level.                    |
| `onError(issues, form)`             | Submit failure callback with current form issues.                  |
