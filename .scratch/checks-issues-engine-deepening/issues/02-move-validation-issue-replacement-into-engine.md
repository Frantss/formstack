# Move Validation Issue Replacement Into Engine

Status: ready-for-agent
Blocked by: 01

## Parent

`.scratch/checks-issues-engine-deepening/SPEC.md`

## What to build

Move validation result grouping and event replacement policy behind the checks/issues engine. The public `validate` behavior should remain the same while form core stops owning the details of preserving manual issues, preserving other event issues, clearing stale event issues, and grouping emitted issues by field path.

## Acceptance criteria

- [ ] Event-produced issues are replaced only for the requested event and target subtree.
- [ ] Manual issues are preserved during event validation.
- [ ] Issues from other events are preserved during single-event validation.
- [ ] Targeted validation preserves unrelated field issues.
- [ ] Root-level Standard Schema issues still attach to the root field.
- [ ] Returned validation issues still include only issues emitted by the current run.
- [ ] Async stale-result protection remains owned by form core or an equivalent lane mechanism and behavior remains unchanged.
- [ ] Existing validation issue tests pass.

## Blocked by

- 01 - Establish Checks/Issues Engine Seam.
