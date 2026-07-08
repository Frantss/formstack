# Centralize Lifecycle Normalization

Status: ready-for-agent
Blocked by: 03

## Parent

`.scratch/checks-issues-engine-deepening/SPEC.md`

## What to build

Route lifecycle issue normalization through the checks/issues engine. Field construction, options updates, reset keep options, and field-entry writes should use the engine for configured-level normalization rather than composing low-level issue helpers directly.

## Acceptance criteria

- [ ] New fields start with configured issue levels, including `error`.
- [ ] Updating options to add a configured level adds empty buckets to existing fields.
- [ ] Updating options to remove an empty configured level drops that empty bucket.
- [ ] Updating options preserves non-empty manually introduced levels.
- [ ] Reset clears issues by default.
- [ ] Reset keep options preserve all issues or selected levels as before.
- [ ] Array field operations continue carrying issues with moved, shifted, inserted, removed, and replaced field entries as before.
- [ ] Existing reset, update, field-building, and array field tests pass.

## Blocked by

- 03 - Move Manual Issue Reads And Writes Into Engine.
