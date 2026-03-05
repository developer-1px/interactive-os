/**
 * Headless Compute — state readers + item/element attribute computation.
 *
 * Single Source of Truth for ARIA/data-* attributes.
 * Used by Item.tsx (DOM adapter) and headless tests.
 */

import { readActiveZoneId } from "@os-core/3-inject/readState";
import { computeContainerProps } from "@os-core/3-inject/zoneContext";
import { getChildRole } from "@os-core/engine/registries/roleRegistry";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import { DEFAULT_CONFIG } from "@os-core/schema/types/focus/config/FocusGroupConfig";

import type {
  ElementAttrs,
  HeadlessKernel,
  ItemAttrs,
  ItemOverrides,
  ItemResult,
  TriggerAttrs,
} from "./headless.types";

// Re-export types that consumers need
export type { ItemState, TriggerAttrs } from "./headless.types";

// State readers — extracted to readState.ts, re-exported for backward compat
export {
  readActiveZoneId,
  readFocusedItemId,
  readSelected,
  readZone,
} from "./readState";

// ═══════════════════════════════════════════════════════════════════
// computeItem — Single Source of Truth for item attrs + state.
//
// headless tests and Item.tsx (DOM adapter) both call this.
// Same function. Zero drift.
// ═══════════════════════════════════════════════════════════════════

export function computeItem(
  kernel: HeadlessKernel,
  itemId: string,
  zoneId: string,
  overrides?: ItemOverrides,
): ItemResult {
  const s = kernel.getState();
  const z = s.os.focus.zones[zoneId];
  const entry = ZoneRegistry.get(zoneId);

  const childRole =
    overrides?.role || (entry?.role ? getChildRole(entry.role) : undefined);

  // ── ARIA item state — read from items map, existence from config ──
  // Config determines WHICH aria-* keys to project (existence).
  // Items map stores VALUES (true/false). Commands mutate values.
  // No seed needed — config is always available via ZoneRegistry.
  const config = entry?.config;
  const ariaItemState = z?.items?.[itemId] ?? {};
  const isAriaSelected =
    overrides?.selected ?? ariaItemState["aria-selected"] ?? false;
  const isAriaExpanded = ariaItemState["aria-expanded"] ?? false;

  // ── Value axis ──
  const valueConfig = entry?.config?.value;
  const valueMode = valueConfig?.mode ?? "none";
  const currentValue =
    valueMode === "continuous" && valueConfig
      ? (z?.valueNow?.[itemId] ?? valueConfig.min)
      : undefined;

  const isFocused = z?.focusedItemId === itemId;
  const isActiveZone = s.os.focus.activeZoneId === zoneId;
  const isDisabled =
    overrides?.disabled || ZoneRegistry.isDisabled(zoneId, itemId);
  const isActiveFocused = isFocused && isActiveZone;
  const isAnchor = isFocused && !isActiveZone;

  const attrs: ItemAttrs = {
    id: itemId,
    role: childRole,
    tabIndex: isFocused ? 0 : -1,
    "data-focus-item": true,
    "data-item-id": itemId,
    "data-focused": isActiveFocused || undefined,
    "data-anchor": isAnchor || undefined,
    "data-selected": isAriaSelected || undefined,
    "data-expanded": isAriaExpanded || undefined,
  };

  // ── ARIA: config-driven projection ──
  // Config determines which aria-* keys to project.
  // Values come from items map (mutated by commands), default false.
  const selectMode = config?.select?.mode ?? "none";
  if (selectMode !== "none") attrs["aria-selected"] = isAriaSelected;

  // Check/Press: derived from inputmap commands
  const inputmapValues = config?.inputmap
    ? Object.values(config.inputmap)
    : [];
  const hasCheckCmd = inputmapValues.some((cmds) =>
    cmds.some((c) => c.type === "OS_CHECK"),
  );
  const hasPressCmd = inputmapValues.some((cmds) =>
    cmds.some((c) => c.type === "OS_PRESS"),
  );
  if (hasCheckCmd)
    attrs["aria-checked"] = ariaItemState["aria-checked"] ?? false;
  if (hasPressCmd)
    attrs["aria-pressed"] = ariaItemState["aria-pressed"] ?? false;

  // Expand: config-driven
  const expandMode = config?.expand?.mode ?? "none";
  if (expandMode !== "none") {
    attrs["aria-expanded"] = isAriaExpanded;
    attrs["aria-controls"] = `panel-${itemId}`;
  }

  // ── Value attrs ──
  if (valueMode === "continuous" && valueConfig) {
    attrs["aria-valuenow"] = currentValue!;
    attrs["aria-valuemin"] = valueConfig.min;
    attrs["aria-valuemax"] = valueConfig.max;
  }

  if (isDisabled) {
    attrs["aria-disabled"] = true;
  }

  if (isActiveFocused) {
    attrs["aria-current"] = "true" as const;
  }

  return {
    attrs,
    state: {
      isFocused,
      isActiveFocused,
      isAnchor,
      isSelected: isAriaSelected,
      isExpanded: isAriaExpanded,
      valueNow: currentValue,
    },
  };
}

/** Backward-compatible wrapper — returns attrs only. */
export function computeAttrs(
  kernel: HeadlessKernel,
  itemId: string,
  zoneId?: string,
): ItemAttrs {
  const id = zoneId ?? readActiveZoneId(kernel);
  if (!id) {
    return { id: itemId, role: undefined, tabIndex: -1 };
  }
  return computeItem(kernel, itemId, id).attrs;
}

// ═══════════════════════════════════════════════════════════════════
// computeTrigger — Pure projection for overlay trigger ARIA.
//
// Parallel to computeItem: state + metadata → ARIA attributes.
// No React, no DOM. Same function in headless tests and Trigger.tsx.
// ═══════════════════════════════════════════════════════════════════

/**
 * Map overlay type to aria-haspopup value.
 * See WAI-ARIA 1.2 § aria-haspopup.
 */
function toAriaHaspopup(overlayType: string): TriggerAttrs["aria-haspopup"] {
  switch (overlayType) {
    case "menu":
      return "menu";
    case "dialog":
    case "alertdialog":
      return "dialog";
    case "listbox":
      return "listbox";
    case "tree":
      return "tree";
    case "grid":
      return "grid";
    default:
      return "true";
  }
}

/**
 * Compute ARIA attributes for a trigger that controls an overlay.
 *
 * Pure function: (kernel state + trigger metadata) → ARIA attrs.
 * Returns null if triggerId has no overlay metadata registered.
 */
export function computeTrigger(
  kernel: HeadlessKernel,
  triggerId: string,
): TriggerAttrs | null {
  const meta = ZoneRegistry.getTriggerOverlay(triggerId);
  if (!meta) return null;

  const s = kernel.getState();
  const isOpen = s.os.overlays.stack.some(
    (entry) => entry.id === meta.overlayId,
  );

  return {
    "aria-haspopup": toAriaHaspopup(meta.overlayType),
    "aria-expanded": isOpen,
    "aria-controls": meta.overlayId,
  };
}

// ═══════════════════════════════════════════════════════════════════
// resolveElement — Playwright locator equivalent.
//
// Given an element ID, returns ALL DOM attributes regardless of
// whether it's a Zone container or an Item.
// ═══════════════════════════════════════════════════════════════════

/**
 * Resolve all DOM attributes for any element by ID.
 *
 * - If ID matches a registered Zone → container props (role, aria-orientation, ...)
 * - If ID matches an Item within a Zone → item attrs (tabIndex, aria-selected, ...)
 * - If ID not found → empty object
 *
 * This is the headless equivalent of Playwright's `page.locator("#id")`.
 */
export function resolveElement(
  kernel: HeadlessKernel,
  elementId: string,
): ElementAttrs {
  // Check if it's a Zone container
  const entry = ZoneRegistry.get(elementId);
  if (entry) {
    const s = kernel.getState();
    const isActive = s.os.focus.activeZoneId === elementId;
    const config = entry.config ?? DEFAULT_CONFIG;
    return computeContainerProps(elementId, config, isActive, entry.role);
  }

  // Check if it's an Item within any Zone
  const ownerZoneId = ZoneRegistry.findZoneByItemId(elementId);
  if (ownerZoneId) {
    const itemAttrs = computeAttrs(kernel, elementId, ownerZoneId);

    // Merge trigger overlay ARIA if this item is also a trigger
    const triggerAttrs = computeTrigger(kernel, elementId);
    if (triggerAttrs) {
      return { ...itemAttrs, ...triggerAttrs };
    }

    return itemAttrs;
  }

  return {};
}
