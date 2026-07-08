# Form Core Classes: Expected Behaviors

## FormCoreField

### `change(name, updater, options?)`

- Updates field values for flat and nested paths.
- Supports direct values and updater functions.
- Marks target and ascendant fields as:
  - `status.dirty = true` by default
  - `status.touched = true` by default
- Honors options:
  - `should.dirty = false` keeps `dirty` unchanged
  - `should.touch = false` keeps `touched` unchanged
  - `should.validate = false` skips validation
- Does not propagate `dirty`/`touched` down to descendants when changing a parent path.
- Triggers `FormCore.validate(name, { type: 'change' })` by default only when a change validator is configured.

### `focus(name)`

- Calls `.focus()` on registered element refs.
- Sets `status.touched = true` for target and ascendants.
- Does not update descendant `touched`.
- Triggers `FormCore.validate(name, { type: 'focus' })` when a focus validator is configured.
- Accepts `options.should.validate = false` to skip validation.

### `blur(name)`

- Calls `.blur()` on registered element refs.
- Sets `status.blurred = true` for target and ascendants.
- Does not update descendant `blurred`.
- Triggers `FormCore.validate(name, { type: 'blur' })` when a blur validator is configured.
- Accepts `options.should.validate = false` to skip validation.

### `get(name)`

- Returns current value for flat and nested fields.
- Reflects updates after `change`.

### `status(name)`

- Returns field status state.
- Default status includes `dirty/touched/blurred = false`.
- Reflects updates from `focus`, `blur`, `change`.

### `register(name)`

- Stores provided DOM element as field ref.
- No-op for `null` input.

### `unregister(name)`

- Clears stored ref for target field.
- Does not affect sibling refs.

### `issues(name, options?)`

- Returns issues for target field, grouped by issue level.
- `nested: true` aggregates issues for descendant paths.
- Without `nested`, returns only target field issues.
- Includes configured issue levels with empty arrays when no issues exist for that level.
- Includes the reserved `error` level for normal validation errors.

### `setIssues(name, issues, options?)`

- Accepts issues grouped by level.
- Supports modes:
  - `replace` (default): replace existing issues
  - `append`: append to existing issues
  - `keep`: keep existing if non-empty, otherwise set new issues
- Manual issues may omit `type`.
- Updates form validity (`status.valid`) when error or blocking issues are set/cleared.

### `reset(name, options?)`

- Resets target value to default by default.
- Supports custom reset value via `options.value`.
- Resets target field state:
  - `dirty = false`
  - `touched = false`
  - `blurred = false`
  - `issues = []`
- Does not affect sibling values.

## FormCore

### `validate(fields?, options?)`

- Validates current form values with the unified issues pipeline.
- Uses `issues.error.validate[options.type]` for event-specific error validation. Submit falls back to the root `schema`; change/blur/focus run error validation only when configured.
- Uses all configured issue events plus the root `schema` when `options.type` is omitted.
- `fields` behavior:
  - Omitted: validates issues for the entire form and updates all field issues for the selected event scope.
  - Single field: validates that field path and descendants.
  - Field list: validates each provided path and descendants.
- When validating a subset of fields, non-target field issues remain unchanged.
- Rewrites event-produced issues for targeted fields and selected event scope.
- Preserves manual issues, which have no `type`.
- Preserves issues from other events when validating a single event.
- Clears stale issues for targeted fields when the selected event no longer emits issues.
- Sets `status.validating = true` during async validation and `false` after field states are updated.
- Ignores stale async issue results when the validated target changes before the result resolves.
- Returns `[valid, issues]`:
  - `valid = true` when the run emitted no `error` or blocking issues
  - `valid = false` when the run emitted at least one `error` or blocking issue
- The returned `valid` value describes that validation run, not complete form validity.

## FormApi

### `status`

- Returns `store.state.status`.

### `values`

- Returns `store.state.values`.

### `validate`

- Exposes `FormCore.validate`.

### `~mount()`

- Mounts the underlying store and returns its unsubscribe function.

### `~update(options)`

- Replaces current form options (schema/default values/validation config).

### `submit(onSuccess, onError?)`

- Returns an async submit handler.
- On run:
  - sets `status.submitting = true` and `status.dirty = true`
  - runs `validate(undefined, { type: 'submit' })`
  - when submit validation passes and no current blocking issues exist: calls `onSuccess(values, formApi)`
  - otherwise: calls `onError?.(issues, formApi)`
  - increments `status.submits`
  - sets `status.submitting = false`
  - sets `status.successful` to the submit result

## FieldApi

### `createFieldApi({ form, name })`

- Creates a field-scoped API bound to a single field path.

### `change(valueOrUpdater, options?)`

- Proxies to `form.field.change(name, valueOrUpdater, options)`.

### `focus(options?)`

- Proxies to `form.field.focus(name, options)`.

### `blur(options?)`

- Proxies to `form.field.blur(name, options)`.

### `get()`

- Returns current field value.

### `status()`

- Returns field status for the bound field path.

### `register(element)` / `unregister()`

- Proxies register/unregister for the bound field.

### `issues(options?)` / `setIssues(issues, options?)`

- Reads/updates issues for the bound field.

### `reset(options?)`

- Resets the bound field.

### `store()` / `state()`

- `store()` returns a derived store with `{ value, defaultValue, issues, status }`.
- `state()` returns the current value of that derived store.

### `~mount()` / `~update(options)`

- `~mount()` mounts the derived field store.
- `~update(options)` replaces `{ form, name }` used by the API.

## ArrayFieldApi

### `createArrayField({ form, name })` / `createArrayFieldApi({ form, name })`

- Creates an array-field API bound to one array field path.

### `append(value, options?)` / `prepend(value, options?)` / `insert(index, value, options?)`

- Proxy to the corresponding `form.array` methods for the bound array path.

### `swap(from, to, options?)` / `move(from, to, options?)` / `update(index, value, options?)`

- Proxy to `form.array` methods for reordering/updating array items.

### `remove(index, options?)` / `replace(valueOrUpdater, options?)`

- Proxy to `form.array` methods for removing/replacing array values.

### `get()`

- Returns current array value for the bound path.

### `store` / `state`

- `store` is a derived store with `{ value, defaultValue, errors, issues, status }`.
- `state` returns the current value of that derived store.

### `~mount()` / `~update(options)`

- `~mount()` mounts the derived array store.
- `~update(options)` replaces `{ form, name }` used by the API.

## FormCoreFields

### `get(path)`

- Supports both `~root.*` paths and non-prefixed paths.
- Returns `undefined` for missing paths.

### `set(path, options)`

- Updates target entry.
- Propagates only `status` to ascendant entries.
- `errors` and `ref` are applied only to the target entry.
- Does not update descendants or siblings.

### `reset(path)`

- Resets target entry status/errors/ref to defaults.
- Resets descendant entries when resetting a parent path.
- Does not affect sibling or ascendant entries.

### `shift(path, position, direction)`

- Shifts array field entries left/right from a given position.
- Preserves entry identity (`id`) for moved entries.
- Handles single and multi-index shifts.

### `adjust()`

- Rebuilds missing entries from current values.
- Preserves existing entries when path already exists.
- Keeps stale entries not present in values (non-destructive merge behavior).

## FormCoreArray

### `append(name, value, options?)`

- Appends value to array end.
- Works when array is `undefined`.
- Marks array field `dirty/touched` by default.
- Honors `should.dirty` and `should.touch` options.
- Creates field entry for appended index.
- Keeps sibling values unchanged.

### `insert(name, index, value, options?)`

- Inserts at index.
- Negative index is normalized to `0`.
- Out-of-range index pads with `undefined` values.
- Marks array field `dirty/touched` by default.
- Honors `should.dirty` and `should.touch` options.
- Creates entry for inserted index and shifts existing entries right.

### `swap(name, from, to, options?)`

- Swaps two array positions.
- Negative indices are normalized to `0`.
- Same-index swap is no-op.
- Marks array field `dirty/touched` by default.
- Honors `should.dirty` and `should.touch` options.
- Swaps field entries accordingly (entry `id`s move with their items).
- Keeps sibling values unchanged.

### `move(name, from, to, options?)`

- Moves an item from one index to another.
- Negative indices are normalized to `0`.
- Same-index move is no-op.
- Marks array field `dirty/touched` by default.
- Honors `should.dirty` and `should.touch` options.
- Moves field entries accordingly (`id` follows moved item).

### `replace(name, valueOrUpdater, options?)`

- Replaces full array value.
- Supports updater function.
- Marks array field `dirty/touched` by default.
- Honors `should.dirty` and `should.touch` options.
- Rebuilds field entries to match replaced array shape.
- Removes stale trailing entries when new array is shorter.
- Keeps sibling values unchanged.

### `remove(name, index, options?)`

- Removes item at index.
- Negative index is normalized to `0`.
- Out-of-range index is normalized to last valid index.
- Marks array field `dirty/touched` by default.
- Honors `should.dirty` and `should.touch` options.
- Shifts following field entries left (`id` movement preserved).
- Removes trailing field entry.
- Keeps sibling values unchanged.
