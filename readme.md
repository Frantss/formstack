# Oxform

Oxform is a lean and flexible framework-agnostic form library. It provides an
intuitive API inspired by [react-hook-form](https://react-hook-form.com/),
allowing you to build forms with ease.

## Key benefits

- ✅ Framework-agnostic core
- ✅ First-class TypeScript support
- ✅ First-class [Standard Schema](https://standardschema.dev/) support
- ⚛️ React integration

## Features

- Synchronous and asynchronous validation
- Per-event validators (`change`, `blur`, `focus`, `submit`)
- Event-scoped issues for warnings, notices, and blocking risk checks
- Array fields with insert / append / prepend / move / swap / remove / replace
- Nested fields with type-safe deep paths
- Reactive subscriptions via `@tanstack/store`
- Programmatic issues setting with `replace` / `append` / `keep` modes
- Granular field reset and form reset with selective `keep` options

## Packages

| Package                          | Description                                        | Docs                               |
| -------------------------------- | -------------------------------------------------- | ---------------------------------- |
| [`oxform-react`](packages/react) | React bindings — hooks and components. Start here. | [readme](packages/react/readme.md) |
| [`oxform-core`](packages/core)   | Framework-agnostic form engine                     | [readme](packages/core/readme.md)  |

## Quick start (React)

```bash
npm install oxform-react
```

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
      onSubmit={e => {
        e.preventDefault();
        form.submit(console.log, console.error)();
      }}
    >
      <Field form={form} name='name'>
        {field => <input type='text' {...field.props} />}
      </Field>
      <Field form={form} name='email'>
        {field => <input type='email' {...field.props} />}
      </Field>
      <button type='submit'>Submit</button>
    </form>
  );
}
```

See the [React package readme](packages/react/readme.md) for the full API and
the [examples directory](examples/react/src/examples) for runnable demos
(basic, array, async, effect, transform).

## Examples

The [`examples/react`](examples/react) workspace contains runnable demos:

```bash
bun install
cd examples/react
bun run dev
```

## Contributing

Development setup, conventions, and architecture are documented in the
[contributor guide](AGENTS.md) and the [`docs/`](docs) folder:

- [Structure](docs/structure.md) — monorepo layout and package organization
- [Commands](docs/commands.md) — build, test, lint, release commands
- [Checks and issues](docs/checks-and-issues.md) — warnings, notices, blocking risk checks,
  and issue validation behavior
- [Form core behaviors](docs/form-core-behaviors.md) — canonical specification
  of every method's expected behavior
- [Testing](docs/testing.md) — Vitest + Playwright browser testing patterns
- [TypeScript conventions](docs/typescript.md) — type patterns and API design
- [Code style](docs/code-style.md) — imports, formatting, naming

Common commands:

```bash
bun install              # install workspace dependencies
bun run build            # build all packages
bun run test             # run all package test suites
bun run check:all        # lint + format + types + package check
bun run fix:all          # auto-fix lint and format
```

## License

[MIT](license.md) © Francisco Bongiovanni
