/**
 * FIELD Commands — OS-level field editing.
 *
 * State: ZoneState.editingItemId
 *
 * Commands:
 *   FIELD_START_EDIT — Enter editing mode on the focused item
 *   FIELD_COMMIT    — Exit editing mode and commit the value
 *   FIELD_CANCEL    — Exit editing mode and discard changes
 *
 * DOM Policy: Commands read from FieldRegistry (synced by InputListener).
 *            DOM mutations are delegated to FIELD_CLEAR_EFFECT.
 */

import { produce } from "immer";
import { FieldRegistry } from "../../6-components/field/FieldRegistry";
import { kernel } from "../../kernel";
import { clearFieldDOM } from "../../4-effects/index";

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

    // Find the active field: by editingId, by focused item, or by scanning registry
    let fieldEntry = editingId ? FieldRegistry.getField(editingId) : null;
    if (!fieldEntry && zone.focusedItemId) {
      fieldEntry = FieldRegistry.getField(zone.focusedItemId) ?? null;
    }
    if (!fieldEntry) {
      const allFields = FieldRegistry.get().fields;
      const isDeferred = !!editingId;
      for (const [, entry] of allFields) {
        if (entry.config.onCommit || entry.config.onSubmit) {
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
    const commitFactory = fieldEntry?.config.onCommit ?? fieldEntry?.config.onSubmit;
    if (commitFactory) {
      // Read from FieldRegistry — InputListener keeps value in sync with DOM.
      const text = fieldEntry!.state.value;
      const appCommand = commitFactory({ text });
      queueMicrotask(() => kernel.dispatch(appCommand));

      // Clear field for immediate-mode (e.g., DRAFT) — delegate to effect
      if (!editingId) {
        const fieldName = fieldEntry.config.name;
        queueMicrotask(() => {
          clearFieldDOM(fieldName);
          FieldRegistry.updateValue(fieldName, "");
        });
      }
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

        // Restore DOM focus to the item (browser loses it when contentEditable→false)
        focus: editingId,
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

      // Restore DOM focus to the item
      focus: editingId,
    };
  },
);
