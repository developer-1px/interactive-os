# Investigation: "Jumpy" Focus on Toggle/Delete

> [!IMPORTANT]
> **Diagnosis**: The awkwardness comes from **Implicit vs. Explicit Resolution**.
> Currently, `DELETE_TODO` removes the data, but says **nothing** about focus.
> The Middleware sees a state where `focusId` points to a dead item. It triggers `ensureFocusIntegrity` (Data Integrity Check) to "heal" the state, likely jumping to the top or a fallback ID.
> **This is "Crash Recovery", not "Interaction Design".**

## 1. Why `DELETE_TODO` feels awkward
**Current Flow:**
1.  **Command**: `data.todos[id]` is deleted.
2.  **Result**: `ui.focusRequest` is undefined.
3.  **Middleware**:
    -   Checks `ui.focusRequest` -> None.
    -   Checks Data Integrity -> "Oh no, `focusId` is missing from `todos`!"
    -   **Fallback**: Resets focus to Safe Default (often Top of List).
    -   **User Experience**: Cursor jumps to the top after deleting item #5.

**Desired Flow (Explicit Intent):**
1.  **Command**: "I am deleting Item #5. The next logical item is #6 (or #4)."
2.  **Result**: Command calculates `nextFocusId` alongside the deletion.
3.  **Return**: `{ ...state, ui: { focusRequest: nextFocusId } }`
4.  **Middleware**: Honors the request immediately. No "Crash Recovery" needed.

## 2. Why `TOGGLE_TODO` feels awkward
If you are in a "Active Only" view:
1.  **Command**: Set `completed = true`.
2.  **Result**: Item disappears from view (filter).
3.  **Focus**: Same as Delete (points to hidden item) -> Jumps to top.

## 3. Missing Principle: "Interaction Intent"
We lack a standard for commands to declare their **UI Consequence**.

### Proposed Standard: The `Effect` Tuple
We should standardize that `run` returns not just State, but potentially an Intent.
Since we are using strict Reducer `(S) => S`, we piggyback on `ui.focusRequest`.

**Rule**:
> "Any Command that destructively modifies the currently focused item **MUST** calculate and set a `focusRequest` to a valid neighbor."

### Implementation Pattern
```typescript
export const DeleteTodo = defineCommand({
  id: "DELETE_TODO",
  run: (state, payload, env) => produce(state, draft => {
       const targetId = payload.id ?? env.focusId;
       
       // 1. Calculate Next Focus BEFORE deletion
       const nextId = findNearestNeighbor(state, targetId);
       
       // 2. Mutate Data
       delete draft.data.todos[targetId];
       
       // 3. Declare Intent
       draft.ui.focusRequest = nextId; 
  })
})
```
This moves the "Physics" of "What is nearest?" into the Command (or a helper utility used by the command), ensuring the *Intent* is preserved.
