/**
 * OS_FIELD_CANCEL — Exit editing mode and discard changes.
 *
 * Dispatches the app's onCancel command if registered in FieldRegistry.
 * Restores focusedItemId to the item that was being edited.
 */

import { produce } from "immer";
import { FieldRegistry } from "../../6-components/field/FieldRegistry";
import { os } from "../../kernel";

export const OS_FIELD_CANCEL = os.defineCommand(
  "OS_FIELD_CANCEL",
  (ctx) => () => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    const zone = ctx.state.os.focus.zones[activeZoneId];
    if (!zone?.editingItemId) return;

    const editingId = zone.editingItemId;

    // Bridge: dispatch app's onCancel command from FieldRegistry
    let fieldEntry = FieldRegistry.getField(editingId);
    if (!fieldEntry) {
      const allFields = FieldRegistry.get().fields;
      for (const [, entry] of allFields) {
        if (entry.config.onCancel) {
          fieldEntry = entry;
          break;
        }
      }
    }
    if (fieldEntry?.config.onCancel) {
      const command = fieldEntry.config.onCancel;
      queueMicrotask(() => os.dispatch(command));
    }

    // Read latest caret position from FieldRegistry
    const caretPos = FieldRegistry.getField(editingId)?.state.caretPosition;

    return {
      state: produce(ctx.state, (draft) => {
        const z = draft.os.focus.zones[activeZoneId];
        if (z) {
          // Restore focus to the item that was being edited
          z.focusedItemId = editingId;
          z.lastFocusedId = editingId;
          z.editingItemId = null;
          // Save caret position (visible in Inspector)
          if (caretPos != null) {
            z.caretPositions[editingId] = caretPos;
          }
        }
      }) as typeof ctx.state,
    };
  },
);
