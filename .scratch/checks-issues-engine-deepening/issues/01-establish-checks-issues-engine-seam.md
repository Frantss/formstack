# Establish Checks/Issues Engine Seam

Status: resolved
Blocked by: None

## Parent

`.scratch/checks-issues-engine-deepening/SPEC.md`

## What to build

Create the internal checks/issues engine seam and move validator discovery/planning into it, without changing public behavior. Field operations and form validation should ask the engine which check events exist and which validation entries apply, instead of reading checks config directly.

## Acceptance criteria

- [x] The new internal engine owns configured issue level discovery.
- [x] The new internal engine owns event-validator detection for change, blur, focus, and submit.
- [x] Form validation uses the engine to plan the Standard Schema validators for event-specific and all-events validation runs.
- [x] Root schema fallback for submit error validation remains unchanged.
- [x] Existing public behavior for automatic field validation remains unchanged.
- [x] Targeted core tests for field change/blur/focus validation and form validation pass.

## Answer

Implemented the first internal checks/issues engine seam. Form core now delegates configured level discovery and validation planning to the engine, field operations delegate event-validator detection to the engine, and field construction/set normalization uses the engine for configured level discovery. Public behavior is unchanged.

Verification:

- `bun vitest run src/tests/form-core/validate.spec.ts src/tests/form-core/validate-issues.spec.ts`
- `bun vitest run src/tests/form-core-field/change.spec.ts src/tests/form-core-field/blur.spec.ts src/tests/form-core-field/focus.spec.ts`
- `bun run check:types`
- root `bun run check:types`

## Blocked by

- None - can start immediately.
