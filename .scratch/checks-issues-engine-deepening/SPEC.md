# Checks/Issues Engine Deepening Spec

Status: ready-for-agent

## Problem Statement

The checks/issues feature has a coherent public model, but its implementation is spread across form core orchestration, field operations, and low-level issue helpers. The form core currently understands too many checks-specific rules: how validators are selected, how event-produced issues replace prior issues, how manual issues are preserved, how blocking levels affect validity, how configured levels are normalized, and how stale async results are ignored.

This makes the checks/issues behavior harder to change safely. A future maintainer who wants to adjust check execution, issue provenance, blocking semantics, or manual issue behavior must reason across several modules instead of one deep internal module. The public interface is already valuable and should remain stable; the problem is the internal seam.

## Solution

Deepen the checks/issues implementation behind an internal engine module. The public user-facing behavior stays the same: users still configure `checks`, run `validate`, read `field.issues`, write manual issues with `setIssues`, receive issues in submit failure callbacks, and rely on the same inferred issue-level types.

Internally, form and field modules should delegate checks/issues decisions to one module that owns the rules. Form core should keep responsibility for form state orchestration, while the checks/issues engine owns check planning, issue bucket normalization, issue replacement, manual issue writes, blocking checks, and event-validator detection.

The desired result is higher locality: checks/issues behavior can be modified and tested in one place without changing the public API.

## User Stories

1. As a form library user, I want the existing `checks` configuration shape to keep working, so that this refactor does not force app code changes.
2. As a form library user, I want `error` issues to remain reserved and blocking, so that normal validation keeps its current behavior.
3. As a form library user, I want non-error issue levels to remain non-blocking by default, so that warnings and notices do not unexpectedly invalidate forms.
4. As a form library user, I want levels configured with `blocking: true` to invalidate affected fields and forms, so that risk or policy checks can prevent submit.
5. As a form library user, I want `validate(fields, { type })` to keep refreshing only the requested event and target subtree, so that unrelated issues remain visible.
6. As a form library user, I want `validate(fields)` without an event type to keep refreshing all configured issue events for the target subtree, so that explicit validation remains comprehensive.
7. As a form library user, I want submit validation to continue using the root schema fallback for `error.submit` when no submit-specific error validator is configured, so that submit keeps matching current behavior.
8. As a form library user, I want change, blur, and focus validation to run automatically only when matching validators are configured, so that field interactions do not gain new validation work.
9. As a form library user, I want `should.validate: false` to skip validation from field operations, so that callers can keep controlling validation timing.
10. As a form library user, I want manual issues without an event type to survive event validation, so that server-side or programmatic messages are not accidentally cleared.
11. As a form library user, I want event-produced issues to be cleared when the same event and target is revalidated successfully, so that stale feedback disappears.
12. As a form library user, I want validation for one event to preserve issues from other events, so that blur, change, focus, and submit feedback can coexist.
13. As a form library user, I want validation for one field subtree to preserve unrelated field issues, so that targeted validation does not erase other form state.
14. As a form library user, I want root-level Standard Schema issues to continue attaching to the root field, so that form-level problems remain observable.
15. As a form library user, I want async check results to be ignored when their target value changes before they resolve, so that stale results do not overwrite newer state.
16. As a form library user, I want async check results to remain valid when unrelated target paths change, so that unrelated edits do not discard useful feedback.
17. As a form library user, I want `status.validating` to continue reflecting pending async validation, so that loading UI stays accurate.
18. As a form library user, I want configured issue levels to appear as empty arrays in issue buckets, so that rendering code can rely on stable keys.
19. As a form library user, I want manually introduced levels to remain present when they contain issues, so that manual feedback is not dropped just because the level is no longer configured.
20. As a form library user, I want option updates to normalize existing issue buckets against current configured levels, so that level changes migrate persisted field state consistently.
21. As a form library user, I want `field.issues(name, { nested: true })` to keep aggregating target and descendant issues only, so that nested summaries remain correct.
22. As a form library user, I want `field.setIssues` replace, append, and keep modes to keep their current semantics, so that manual issue writes remain predictable.
23. As a form library user, I want reset keep options for issues to keep their current behavior, so that reset flows remain compatible.
24. As a TypeScript user, I want issue levels inferred from `checks` keys to keep flowing into `field.state.issues`, `field.issues`, `validate`, and submit error handlers, so that level-specific rendering stays type-safe.
25. As a React user, I want React bindings to keep exposing the same issue shape, so that this internal refactor does not require React API changes.
26. As a maintainer, I want form core to delegate checks/issues policy, so that form state orchestration is easier to read.
27. As a maintainer, I want field operations to delegate event-validator detection, so that field mutation code does not need to understand checks configuration internals.
28. As a maintainer, I want low-level issue bucket helpers to stay implementation details, so that behavior is tested through meaningful checks/issues operations rather than helper composition.
29. As a maintainer, I want the checks/issues engine to be pure where possible, so that behavior can be tested without unnecessary store setup.
30. As a maintainer, I want existing behavior tests to continue passing, so that the refactor proves compatibility rather than changing semantics.

## Implementation Decisions

- Preserve the public checks/issues interface. This is an internal deepening, not a breaking API redesign.
- Introduce one internal checks/issues engine module that owns checks-specific rules.
- Keep form core as the owner of persisted form state, derived store status, value updates, reset orchestration, submit orchestration, and async validation lane lifecycle.
- Move validator planning behind the checks/issues engine. The engine should decide which validation entries apply for a requested event or for an all-events validation run.
- Move event replacement policy behind the checks/issues engine. The engine should decide which existing issues are kept and which are refreshed.
- Move manual issue write policy behind the checks/issues engine. Replace, append, and keep modes should be implemented in one checks/issues-oriented operation.
- Move configured-level normalization behind the checks/issues engine. Callers should not need to compose normalization helpers manually.
- Move blocking detection behind the checks/issues engine. Callers should ask whether a bucket contains blocking issues without duplicating level rules.
- Move event-validator detection behind the checks/issues engine. Field operations should ask whether a matching validator exists rather than reading checks config directly.
- Keep low-level issue bucket helpers if useful, but treat them as private implementation support for the engine.
- Do not introduce ports or adapters. This is all in-process logic, so a direct internal module is the right seam.
- Do not add public status summaries such as highest issue level or issue counts as part of this work.
- Do not change the Standard Schema contract. Checks continue to accept Standard Schema objects or store-aware schema builder functions.
- Do not rename checks or issues. The current vocabulary is already documented and exported.
- Keep `error` as the reserved public level for blocking validation errors.
- Keep submit behavior compatible: submit succeeds only when submit validation passes and current aggregate form state has no blocking issues.
- Keep React behavior compatible by preserving the core issue shape consumed by React bindings.
- Prefer extracting behavior in small steps, with the current tests green after each step.

## Testing Decisions

- Test behavior through the highest existing public seams: form creation, `validate`, field operations, `field.issues`, `field.setIssues`, reset, submit, and React field state where applicable.
- Keep or strengthen the existing validation behavior specs that cover full-form validation, targeted subtree validation, event-specific replacement, root-level issues, async stale result handling, and `status.validating`.
- Keep or strengthen existing issues behavior specs that cover nested issue reads, sibling path exclusion, manual write modes, configured level normalization, and blocking validity.
- Keep or strengthen submit specs that cover non-blocking issues, blocking issues, manual blocking issues, existing blocking issues from other events, and submit callback issue payloads.
- Keep compile-time assertions that inferred issue levels propagate through public APIs.
- Add focused tests for the new internal engine only where the behavior would otherwise require excessive form setup. These tests should describe engine behavior, not helper mechanics.
- Avoid tests that assert private helper composition. Bucket helper tests can remain for small algebraic utilities, but the primary coverage should be through checks/issues behavior.
- Use the existing core package test style and naming conventions.
- Run targeted core tests for checks/issues and submit behavior after each extraction step.
- Run the root type-check as the integration floor after broad type or public-surface changes.
- If generated package declarations affect downstream workspace type checking, rebuild the core package before running the root type-check.

## Out of Scope

- No public API rename from checks/issues to another concept.
- No changes to the documented `checks` configuration shape.
- No removal of `field.issues`, `field.setIssues`, `validate`, submit failure issues, or React `state.issues`.
- No new issue severity ranking, highest-level status, issue counts, or issue summaries.
- No changes to the Standard Schema dependency or issue shape.
- No React-specific feature work beyond preserving compatibility.
- No changes to array field issue movement semantics unless required to preserve existing behavior.
- No new external adapter, plugin, or validation provider abstraction.
- No package release work.

## Further Notes

The intended test seam for the implementation is the current public form API, with one new internal seam for checks/issues policy only if extraction makes the behavior clearer. The ideal final shape has form and field modules calling a small number of checks/issues engine operations, while all rules about issue levels, event replacement, manual preservation, blocking, and configured-level normalization live in one place.

This spec is ready to break into implementation tickets. A sensible ticket order is:

1. Extract validator planning and event-validator detection.
2. Extract issue replacement and emitted issue grouping.
3. Extract manual issue writes and nested issue aggregation.
4. Extract option-update/reset normalization helpers.
5. Run compatibility and type verification, then clean up any obsolete helper tests.
