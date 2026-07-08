# Verify Compatibility And Clean Up Helpers

Status: ready-for-agent
Blocked by: 04

## Parent

`.scratch/checks-issues-engine-deepening/SPEC.md`

## What to build

Complete the refactor by tightening tests around the public seams, removing obsolete helper-level coupling, and verifying that public checks/issues types and React bindings remain compatible.

## Acceptance criteria

- [ ] Public exports for checks/issues types remain compatible.
- [ ] Inferred issue levels still propagate through `createForm`, `field.state.issues`, `field.issues`, `validate`, and submit error handlers.
- [ ] React bindings continue exposing the same `state.issues` shape.
- [ ] Tests assert behavior through public seams rather than duplicating internal helper composition.
- [ ] Obsolete helper tests are removed or rewritten only when equivalent public behavior coverage exists.
- [ ] Core package build passes if public core type declarations changed.
- [ ] Root type-check passes after any necessary core rebuild.
- [ ] Documentation remains accurate without describing internal engine details.

## Blocked by

- 04 - Centralize Lifecycle Normalization.
