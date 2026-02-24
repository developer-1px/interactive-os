/**
 * OS_FIELD_COMMIT — Exit editing mode and commit the value.
 *
 * Reads the current field value from FieldRegistry (synced by InputListener).
 * Dispatches the app's onCommit command via queueMicrotask.
 * For immediate-mode fields (no editingItemId), clears the field DOM.
 */

import { produce } from "immer";
import { clearFieldDOM } from "../../4-effects/index";
import { FieldRegistry } from "../../6-components/field/FieldRegistry";
import { os } from "../../kernel";

export const OS_FIELD_COMMIT = os.defineCommand(
  "OS_FIELD_COMMIT",
  (ctx) => () => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    const zone = ctx.state.os.focus.zones[activeZoneId];
    if (!zone) return;

    const editingId = zone.editingItemId;

    // Find the active field: by editingId, by focused item, or by scanning registry
    let fieldEntry = editingId ? FieldRegistry.getField(editingId) : null;
    if (!fieldEntry && zone.focusedItemId) {
      fieldEntry = FieldRegistry.getField(zone.focusedItemId) ?? null;
    }
    if (!fieldEntry) {
      const allFields = FieldRegistry.get().fields;
      const isDeferred = !!editingId;
      for (const [, entry] of allFields) {
        if (entry.config.onCommit) {
          if (isDeferred && entry.config.mode === "deferred") {
            fieldEntry = entry;
            break;
          }
          if (!isDeferred && entry.config.mode !== "deferred") {
            fieldEntry = entry;
            break;
          }
          if (!fieldEntry) fieldEntry = entry;
        }
      }
    }

    // Bridge: dispatch app's onCommit command
    const commitFactory = fieldEntry?.config.onCommit;
    if (commitFactory) {
      // Read from FieldRegistry — InputListener keeps value in sync with DOM.
      const text = fieldEntry!.state.value;
      const appCommand = commitFactory({ text });
      queueMicrotask(() => os.dispatch(appCommand));

      // Clear field for immediate-mode (e.g., DRAFT) — delegate to effect
      if (!editingId) {
        const fieldName = fieldEntry!.config.name;
        queueMicrotask(() => {
          clearFieldDOM(fieldName);
          FieldRegistry.updateValue(fieldName, "");
        });
      }
    }

    // Only clear editingItemId if we were in deferred editing mode
    if (editingId) {
      // Read latest caret position from FieldRegistry (updated by selectionchange)
      const caretPos = FieldRegistry.getField(editingId)?.state.caretPosition;

      return {
        state: produce(ctx.state, (draft) => {
          const z = draft.os.focus.zones[activeZoneId];
          if (z) {
            z.editingItemId = null;
            // Only restore focusedItemId if it hasn't already moved
            // (e.g., Escape commits while focus stays on the editing item).
            // If focusedItemId already changed (click on different item → blur-commit),
            // don't overwrite — the new focus is intentional.
            if (z.focusedItemId === editingId || z.focusedItemId === null) {
              z.focusedItemId = editingId;
              z.lastFocusedId = editingId;
            }
            // Save caret position (visible in Inspector)
            if (caretPos != null) {
              z.caretPositions[editingId] = caretPos;
            }
          }
        }) as typeof ctx.state,
      };
    }
  },
);
