# Move Manual Issue Reads And Writes Into Engine

Status: ready-for-agent
Blocked by: 02

## Parent

`.scratch/checks-issues-engine-deepening/SPEC.md`

## What to build

Move manual issue operations behind the checks/issues engine. Field issue reads and writes should delegate nested aggregation, configured-level normalization, replace/append/keep semantics, and blocking checks to the engine.

## Acceptance criteria

- [ ] `field.issues(name)` returns the same configured issue buckets as before.
- [ ] `field.issues(name, { nested: true })` aggregates only the target field and descendants.
- [ ] Sibling paths with the same string prefix are not included in nested reads.
- [ ] `field.setIssues` replace mode keeps existing behavior.
- [ ] `field.setIssues` append mode keeps existing behavior.
- [ ] `field.setIssues` keep mode keeps existing behavior.
- [ ] Manual error and manual blocking issues still affect field and form validity.
- [ ] Existing field issues and set-errors compatibility tests pass.

## Blocked by

- 02 - Move Validation Issue Replacement Into Engine.
