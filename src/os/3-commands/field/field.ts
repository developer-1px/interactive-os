/**
 * FIELD Commands — OS-level field editing.
 *
 * State: ZoneState.editingItemId
 *
 * Commands:
 *   FIELD_START_EDIT — Enter editing mode on the focused item
 *   FIELD_COMMIT    — Exit editing mode and commit the value
 *   FIELD_CANCEL    — Exit editing mode and discard changes
 */

import { produce } from "immer";
import { FieldRegistry } from "../../6-components/primitives/FieldRegistry";
import { kernel } from "../../kernel";

// ═══════════════════════════════════════════════════════════════════
// FIELD_START_EDIT
// ═══════════════════════════════════════════════════════════════════

export const FIELD_START_EDIT = kernel.defineCommand(
  "FIELD_START_EDIT",
  (ctx) => () => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    const zone = ctx.state.os.focus.zones[activeZoneId];
    if (!zone?.focusedItemId) return;

    // Already editing this item — no-op
    if (zone.editingItemId === zone.focusedItemId) return;

    return {
      state: produce(ctx.state, (draft) => {
        const z = draft.os.focus.zones[activeZoneId];
        if (z) {
          z.editingItemId = z.focusedItemId;
        }
      }) as typeof ctx.state,
    };
  },
);

// ═══════════════════════════════════════════════════════════════════
// FIELD_COMMIT
// ═══════════════════════════════════════════════════════════════════

export const FIELD_COMMIT = kernel.defineCommand(
  "FIELD_COMMIT",
  (ctx) => () => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    const zone = ctx.state.os.focus.zones[activeZoneId];
    if (!zone) return;

    const editingId = zone.editingItemId;

    // Find the active field: by editingId, by focused element, or by scanning registry
    let fieldEntry = editingId ? FieldRegistry.getField(editingId) : null;
    if (!fieldEntry) {
      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl?.id) {
        fieldEntry = FieldRegistry.getField(activeEl.id) ?? null;
      }
    }
    if (!fieldEntry) {
      const allFields = FieldRegistry.get().fields;
      const isDeferred = !!editingId;
      for (const [, entry] of allFields) {
        if (entry.config.onSubmit) {
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

    // Bridge: dispatch app's onSubmit command
    if (fieldEntry?.config.onSubmit) {
      const fieldName = fieldEntry.config.name;
      const el = document.getElementById(fieldName);
      const text = el?.innerText?.trim() ?? fieldEntry.state.localValue;
      // Clear DOM immediately for immediate-mode fields (e.g., DRAFT)
      if (el && !editingId) {
        el.innerText = "";
      }
      const appCommand = fieldEntry.config.onSubmit({ text });
      queueMicrotask(() => kernel.dispatch(appCommand));
    }

    // Only clear editingItemId if we were in deferred editing mode
    if (editingId) {
      return {
        state: produce(ctx.state, (draft) => {
          const z = draft.os.focus.zones[activeZoneId];
          if (z) {
            z.editingItemId = null;
          }
        }) as typeof ctx.state,
      };
    }
  },
);

// ═══════════════════════════════════════════════════════════════════
// FIELD_CANCEL
// ═══════════════════════════════════════════════════════════════════

export const FIELD_CANCEL = kernel.defineCommand(
  "FIELD_CANCEL",
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
      queueMicrotask(() => kernel.dispatch(fieldEntry?.config.onCancel!));
    }

    return {
      state: produce(ctx.state, (draft) => {
        const z = draft.os.focus.zones[activeZoneId];
        if (z) {
          z.editingItemId = null;
        }
      }) as typeof ctx.state,
    };
  },
);
