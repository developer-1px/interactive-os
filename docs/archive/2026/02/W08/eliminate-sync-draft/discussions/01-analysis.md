# Discussion: Eliminate syncDraft

## Context

`syncDraft` is a command that facilitates 2-way binding between the `Field` component (via `InputListener`) and the app's state (`ui.draft`).
This creates a duplicate source of truth:
1. `FieldRegistry.localValue` (managed by `InputListener` on every keystroke)
2. `app.state.ui.draft` (managed by `syncDraft` on every keystroke)

Rule #11 states that duplicate synchronization points indicate a structural flaw.
Rule #9 (Occam's Razor) suggests reducing concepts.

## Objective

Remove `syncDraft`, `syncEditDraft`, and the corresponding `ui.draft`/`ui.editDraft` state fields.
Rely solely on `FieldRegistry.localValue` as the source of truth for pending input.

## Analysis

### 1. Data Flow Analysis

**Current Flow (with syncDraft):**
1. User types "A"
2. `InputListener` writes "A" to `FieldRegistry`
3. `InputListener` dispatches `onChange` (`syncDraft`)
4. `syncDraft` writes "A" to `state.ui.draft`
5. `ListView` re-renders with `value="A"`
6. `Field` receives `value="A"`, checks if DOM needs update (no, because it matches)

**Proposed Flow (without syncDraft):**
1. User types "A"
2. `InputListener` writes "A" to `FieldRegistry`
3. `InputListener` sees no `onChange` handler — does nothing
4. `state.ui.draft` does not exist
5. `ListView` does not re-render
6. `Field` DOM retains "A" naturally

### 2. Submission Flow

**Current:**
1. Enter key → `FIELD_COMMIT`
2. `FIELD_COMMIT` reads `FieldRegistry.localValue` ("A")
3. Dispatches `onSubmit({ text: "A" })` (`addTodo`)
4. `addTodo` uses payload `text` OR `state.ui.draft` (duplicate)

**Proposed:**
1. Enter key → `FIELD_COMMIT`
2. `FIELD_COMMIT` reads `FieldRegistry.localValue` ("A")
3. Dispatches `onSubmit({ text: "A" })`
4. `addTodo` relies ONLY on payload `text`

### 3. Edge Cases & Risks

#### A. Controlled Component Behavior
`Field.tsx` is designed to sync `value` prop to DOM.
If `ListView` passes `value={draft}` (where `draft` is undefined or removed), what happens?
- We must remove the `value` prop usage in `ListView` or pass a static initial value.
- If we pass `value=""`, `Field` might try to clear the inputs on re-renders triggered by other state changes.
- **Mitigation**: `Field` uses `useLayoutEffect` to sync DOM only when `value` changes. If we pass a static `""` or `undefined`, `value` never changes, so DOM is left alone. Correct.

#### B. Clearing after Submit
Currently `addTodo` clears `state.ui.draft`.
`FIELD_COMMIT` handles DOM clearing:
```typescript
queueMicrotask(() => {
  clearFieldDOM(fieldName);
  FieldRegistry.updateValue(fieldName, "");
});
```
This logic exists in `FIELD_COMMIT`. So even without `state.ui.draft`, the field will be cleared visually and in the registry.

#### C. Reactivity (Search/Filter)
If the draft value is used for **real-time filtering** (e.g. `visibleTodos` depends on `draft`), removing `syncDraft` breaks this feature.
- **Check**: Todo app does not seem to filter by draft text. It only adds on submit.
- **Check**: `QuickPick` uses `onChange` to update `query` state for filtering.
  - **Verdict**: `QuickPick` SHOULD keep its `onChange` handler because it NEEDS real-time reactivity.
  - **Distinction**: `TodoDraft` is for **submission**, `QuickPick` is for **filtering**.
  - **Rule**: If app needs real-time value (filter, validation), use `onChange`. If app only needs value on submit, DO NOT use `onChange`.

## Conclusion

For `TodoDraft` (submission-only), `syncDraft` is pure overhead and redundancy.
For `QuickPick` (filtering), `onChange` is valid.

We will proceed with removing `syncDraft` from Todo app.
