# PRD: Eliminate syncDraft (Separating Data Stream from Command Stream)

## Philosophy

"Data Stream is not Command Stream."

Currently, every keystroke is treated as a Command (`syncDraft`).
This forces high-frequency data updates (input stream) through the Intent pipeline (command stream).
This is like managing every mouse movement with Redux actions — inefficient and conceptually wrong.

- **FieldRegistry**: Data Layer for input streams. Managed directly by `InputListener`.
- **App Command**: Intent Layer. Triggered only when a significant event occurs (Submit).

We are moving from a "Redux-style" input management (dispatch on change) to a "TanStack Query-style" (manage data locally, expose result on intent).

## Goal

Remove `syncDraft` and `ui.draft` to decouple input data stream from app command stream.
`FieldRegistry.localValue` becomes the sole owner of the data stream.

## Scope

### Remove Commands
- `syncDraft` (The bridge between data stream and command stream)
- `syncEditDraft`

### Remove State
- `state.ui.draft` (The duplicate data store in app state)
- `state.ui.editDraft`

### Update Commands
- `addTodo`: REMOVE fallback to `draft.ui.draft`. MUST use `payload.text`.
- `updateTodoText`: REMOVE fallback to `editDraft`. MUST use `payload.text`.

### Update UI Bindings
- `TodoDraftUI`: REMOVE `onChange` binding.
- `TodoEditUI`: REMOVE `onChange` binding.

### Update Components
- `ListView.tsx`:
  - REMOVE `value={draft}` binding.
  - Rely on `Field`'s internal state + `FieldRegistry` for persistence.
  - Use `key` if reset is needed (or explicit reset command in future).

## Constraints

- **Filter Inputs**: `QuickPick` needs real-time derived state (filtering). It keeps using `onChange` as a transformation stream, but we acknowledge this is a different use case (Transformation vs Accumulation).

## Success Criteria

1. Typing in "Add a new task..." does NOT trigger app state updates or commands.
2. `FieldRegistry` silently accumulates the input.
3. Pressing Enter dispatches ONE command (`addTodo`) with the full text.
4. App state is cleaner, devoid of transient input data.
