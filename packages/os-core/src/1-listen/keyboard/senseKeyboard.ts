/**
 * senseKeyboard — DOM → KeyboardInput data extraction.
 *
 * Pure sense function: reads DOM + OS state, produces a typed data object.
 * No side effects, no dispatch.
 */

import {
  isEditingElement,
  resolveIsEditingForKey,
} from "@os-core/2-resolve/fieldKeyOwnership";
import { getCanonicalKey } from "@os-core/2-resolve/getCanonicalKey";
import { ROLE_FIELD_TYPE_MAP } from "@os-core/2-resolve/resolveFieldKey";
import { os } from "@os-core/engine/kernel";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import type { ActionConfig } from "@os-core/schema/types";
import type { KeyboardInput } from "./resolveKeyboard";

export function senseKeyboard(e: KeyboardEvent): KeyboardInput | null {
  const target = e.target as HTMLElement;
  if (!target) return null;

  const canonicalKey = getCanonicalKey(e);

  // DOM queries for focus context
  const focusedEl = document.activeElement as HTMLElement | null;
  const itemEl = focusedEl?.closest?.("[data-item-id]") as HTMLElement | null;

  // Trigger layer: detect if focused element is a trigger
  const triggerIdAttr = focusedEl?.closest?.("[data-trigger-id]")?.getAttribute("data-trigger-id") ?? null;
  const triggerMeta = triggerIdAttr ? ZoneRegistry.getTriggerOverlay(triggerIdAttr) : null;

  // Zone state for CHECK resolution
  const focusState = os.getState().os?.focus;
  const activeZoneId = focusState?.activeZoneId;
  const entry = activeZoneId ? ZoneRegistry.get(activeZoneId) : null;
  const zone = activeZoneId ? focusState?.zones?.[activeZoneId] : null;

  const isEditing = isEditingElement(target);

  // Field layer: editing field id (from OS state, not DOM)
  const editingFieldId = zone?.editingItemId ?? null;

  // Item layer: expanded state
  const focusedItemId = itemEl?.id ?? null;
  const isFocusedExpandable = focusedItemId && activeZoneId
    ? ZoneRegistry.isExpandable(activeZoneId, focusedItemId)
    : false;
  const focusedItemExpanded = isFocusedExpandable && focusedItemId
    ? (zone?.items?.[focusedItemId]?.["aria-expanded"] ?? false)
    : null;

  // Role → FieldType mapping for always-active Fields
  const itemRole = itemEl?.getAttribute("role") ?? null;
  const activeFieldType = itemRole
    ? (ROLE_FIELD_TYPE_MAP[itemRole] ?? null)
    : null;

  // Overlay stack for trigger open/close detection
  const overlayStack = os.getState().os?.overlays?.stack ?? [];
  const isTriggerOverlayOpen = triggerMeta
    ? overlayStack.some((o: { id: string }) => o.id === triggerMeta.overlayId)
    : false;

  return {
    canonicalKey,
    key: e.key,
    isEditing,
    isFieldActive: isEditing
      ? resolveIsEditingForKey(target, canonicalKey)
      : false,
    isComposing: e.isComposing || e.keyCode === 229,
    isDefaultPrevented: e.defaultPrevented,
    isInspector: !!target.closest("[data-inspector]"),
    isCombobox:
      target instanceof HTMLInputElement &&
      target.getAttribute("role") === "combobox",
    editingFieldId,
    activeFieldType,
    focusedItemRole: itemRole,
    focusedItemId,
    focusedItemExpanded,
    activeZoneFocusedItemId: zone?.focusedItemId ?? null,
    /** action config — single route for all command-driven keys */
    activeZoneAction: (entry?.config?.action?.commands?.length
      ? entry.config.action
      : null) as ActionConfig | null,
    // ─── Trigger layer ───
    focusedTriggerId: triggerIdAttr,
    focusedTriggerRole: triggerMeta?.overlayType ?? null,
    focusedTriggerOverlayId: triggerMeta?.overlayId ?? null,
    isTriggerOverlayOpen,
    elementId:
      target.getAttribute("data-id") ??
      target.getAttribute("data-zone-id") ??
      target.id ??
      undefined,
    cursor: zone?.focusedItemId
      ? {
        focusId: zone.focusedItemId,
        selection: Object.entries(zone.items ?? {}).filter(([, s]) => s?.["aria-selected"]).map(([id]) => id),
        anchor: zone.selectionAnchor ?? null,
        isExpandable: isFocusedExpandable,
        isDisabled: focusedItemId && activeZoneId ? ZoneRegistry.isDisabled(activeZoneId, focusedItemId) : false,
        treeLevel: undefined,
      }
      : null,
  };
}
