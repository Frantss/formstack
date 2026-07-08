# Oxform Development Guide

TypeScript monorepo for Oxform, a framework-agnostic form library using Bun workspaces.

**Package Manager**: Bun (not npm/yarn)

## Quick Reference

```bash
# Build
bun run build
bun run build:dev        # watch mode

# Type check
bun run check:types

# Run a single test
cd packages/<name> && bun vitest run src/tests/file.spec.ts

# Lint/Format (Oxlint/Oxfmt, not ESLint/Prettier)
bun run check:all        # lint + format + types + package
bun run fix:all          # auto-fix all
```

## Detailed Guides

- [Structure](./docs/structure.md) - Monorepo layout and package organization
- [Commands Reference](./docs/commands.md) - All available commands and usage
- [Checks and Issues Reference](./docs/checks-and-issues.md) - Check and issue validation behavior
- [Testing Patterns](./docs/testing.md) - Vitest + Playwright browser testing
- [TypeScript Conventions](./docs/typescript.md) - Type patterns and API design
- [Code Style](./docs/code-style.md) - Imports, formatting, namings
