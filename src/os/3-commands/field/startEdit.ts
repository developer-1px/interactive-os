/**
 * OS_FIELD_START_EDIT — Enter editing mode on the focused item.
 *
 * Handles three scenarios:
 *   1. No previous edit → simply set editingItemId
 *   2. Same item → no-op
 *   3. Different item → commit previous value + save caret + set new editingItemId
 *
 * The previous field's app commit (onCommit factory) is dispatched here
 * so the transition is atomic: editingItemId goes A → B, never through null.
 */

import { produce } from "immer";
import { FieldRegistry } from "../../6-components/field/FieldRegistry";
import { os } from "../../kernel";

export const OS_FIELD_START_EDIT = os.defineCommand(
  "OS_FIELD_START_EDIT",
  (ctx) => () => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    const zone = ctx.state.os.focus.zones[activeZoneId];
    if (!zone?.focusedItemId) return;

    // Already editing this item — no-op
    if (zone.editingItemId === zone.focusedItemId) return;

    const newItemId = zone.focusedItemId;
    const prevEditingId = zone.editingItemId;

    // Commit previous field's value via app's onCommit factory
    if (prevEditingId) {
      const prevField = FieldRegistry.getField(prevEditingId);
      if (prevField?.config.onCommit) {
        const text = prevField.state.value;
        const appCommand = prevField.config.onCommit({ text });
        queueMicrotask(() => os.dispatch(appCommand));
      }
    }

    // Seed FieldRegistry with saved caret position for the new item
    const savedCaret = zone.caretPositions[newItemId];
    if (savedCaret != null) {
      FieldRegistry.updateCaretPosition(newItemId, savedCaret);
    }

    return {
      state: produce(ctx.state, (draft) => {
        const z = draft.os.focus.zones[activeZoneId];
        if (z) {
          // Save previous item's caret position
          if (prevEditingId) {
            const prevCaret =
              FieldRegistry.getField(prevEditingId)?.state.caretPosition;
            if (prevCaret != null) {
              z.caretPositions[prevEditingId] = prevCaret;
            }
          }
          // Atomic transition: A → B (never null)
          z.editingItemId = newItemId;
        }
      }) as typeof ctx.state,
    };
  },
);
