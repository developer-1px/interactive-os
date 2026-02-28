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

    // Bridge: dispatch app's onCommit command via kernel dispatch key (synchronous)
    const commitFactory = fieldEntry?.config.onCommit;
    const appCommand = commitFactory
      ? commitFactory({ text: fieldEntry!.state.value })
      : null;

    // Only clear editingItemId if we were in deferred editing mode
    if (editingId) {
      // Read latest caret position from FieldRegistry (updated by selectionchange)
      const caretPos = FieldRegistry.getField(editingId)?.state.caretPosition;

      return {
        state: produce(ctx.state, (draft) => {
          const z = draft.os.focus.zones[activeZoneId];
          if (z) {
            z.editingItemId = null;
            // Always restore focus to the item being edited.
            // Field editing replaces focusedItemId with the field's DOM
            // element ID (e.g., "EDIT") — commit must restore it to the
            // original item that was being edited.
            z.focusedItemId = editingId;
            z.lastFocusedId = editingId;
            // Save caret position (visible in Inspector)
            if (caretPos != null) {
              z.caretPositions[editingId] = caretPos;
            }
          }
        }) as typeof ctx.state,
        ...(appCommand ? { dispatch: appCommand } : {}),
      };
    }

    // Immediate mode: dispatch app command + reset field
    if (appCommand) {
      const fieldName = fieldEntry!.config.name;
      // Synchronous field reset (works in both browser and headless)
      FieldRegistry.updateValue(fieldName, "");
      // DOM cleanup only in browser
      if (typeof document !== "undefined") {
        queueMicrotask(() => clearFieldDOM(fieldName));
      }
      return { dispatch: appCommand };
    }
  },
);
