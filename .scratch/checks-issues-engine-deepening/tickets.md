# Tickets: Checks/Issues Engine Deepening

These tickets implement the internal checks/issues engine described in `SPEC.md` while preserving the public checks/issues API.

Work the frontier: any ticket whose blockers are all done. This set is mostly linear because each extraction should land on a green base before the next one moves more behavior behind the engine.

## 01 - Establish Checks/Issues Engine Seam

**What to build:** Create the internal checks/issues engine seam and move validator discovery/planning into it, without changing public behavior. Field operations and form validation should ask the engine which check events exist and which validation entries apply, instead of reading checks config directly.

**Blocked by:** None - can start immediately.

- [x] The new internal engine owns configured issue level discovery.
- [x] The new internal engine owns event-validator detection for change, blur, focus, and submit.
- [x] Form validation uses the engine to plan the Standard Schema validators for event-specific and all-events validation runs.
- [x] Root schema fallback for submit error validation remains unchanged.
- [x] Existing public behavior for automatic field validation remains unchanged.
- [x] Targeted core tests for field change/blur/focus validation and form validation pass.

## 02 - Move Validation Issue Replacement Into Engine

**What to build:** Move validation result grouping and event replacement policy behind the checks/issues engine. The public `validate` behavior should remain the same while form core stops owning the details of preserving manual issues, preserving other event issues, clearing stale event issues, and grouping emitted issues by field path.

**Blocked by:** 01 - Establish Checks/Issues Engine Seam.

- [ ] Event-produced issues are replaced only for the requested event and target subtree.
- [ ] Manual issues are preserved during event validation.
- [ ] Issues from other events are preserved during single-event validation.
- [ ] Targeted validation preserves unrelated field issues.
- [ ] Root-level Standard Schema issues still attach to the root field.
- [ ] Returned validation issues still include only issues emitted by the current run.
- [ ] Async stale-result protection remains owned by form core or an equivalent lane mechanism and behavior remains unchanged.
- [ ] Existing validation issue tests pass.

## 03 - Move Manual Issue Reads And Writes Into Engine

**What to build:** Move manual issue operations behind the checks/issues engine. Field issue reads and writes should delegate nested aggregation, configured-level normalization, replace/append/keep semantics, and blocking checks to the engine.

**Blocked by:** 02 - Move Validation Issue Replacement Into Engine.

- [ ] `field.issues(name)` returns the same configured issue buckets as before.
- [ ] `field.issues(name, { nested: true })` aggregates only the target field and descendants.
- [ ] Sibling paths with the same string prefix are not included in nested reads.
- [ ] `field.setIssues` replace mode keeps existing behavior.
- [ ] `field.setIssues` append mode keeps existing behavior.
- [ ] `field.setIssues` keep mode keeps existing behavior.
- [ ] Manual error and manual blocking issues still affect field and form validity.
- [ ] Existing field issues and set-errors compatibility tests pass.

## 04 - Centralize Lifecycle Normalization

**What to build:** Route lifecycle issue normalization through the checks/issues engine. Field construction, options updates, reset keep options, and field-entry writes should use the engine for configured-level normalization rather than composing low-level issue helpers directly.

**Blocked by:** 03 - Move Manual Issue Reads And Writes Into Engine.

- [ ] New fields start with configured issue levels, including `error`.
- [ ] Updating options to add a configured level adds empty buckets to existing fields.
- [ ] Updating options to remove an empty configured level drops that empty bucket.
- [ ] Updating options preserves non-empty manually introduced levels.
- [ ] Reset clears issues by default.
- [ ] Reset keep options preserve all issues or selected levels as before.
- [ ] Array field operations continue carrying issues with moved, shifted, inserted, removed, and replaced field entries as before.
- [ ] Existing reset, update, field-building, and array field tests pass.

## 05 - Verify Compatibility And Clean Up Helpers

**What to build:** Complete the refactor by tightening tests around the public seams, removing obsolete helper-level coupling, and verifying that public checks/issues types and React bindings remain compatible.

**Blocked by:** 04 - Centralize Lifecycle Normalization.

- [ ] Public exports for checks/issues types remain compatible.
- [ ] Inferred issue levels still propagate through `createForm`, `field.state.issues`, `field.issues`, `validate`, and submit error handlers.
- [ ] React bindings continue exposing the same `state.issues` shape.
- [ ] Tests assert behavior through public seams rather than duplicating internal helper composition.
- [ ] Obsolete helper tests are removed or rewritten only when equivalent public behavior coverage exists.
- [ ] Core package build passes if public core type declarations changed.
- [ ] Root type-check passes after any necessary core rebuild.
- [ ] Documentation remains accurate without describing internal engine details.
