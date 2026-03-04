/**
 * Headless Compute — state readers + item/element attribute computation.
 *
 * Single Source of Truth for ARIA/data-* attributes.
 * Used by Item.tsx (DOM adapter) and headless tests.
 */

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

// ═══════════════════════════════════════════════════════════════════
// State Readers
// ═══════════════════════════════════════════════════════════════════

export function readActiveZoneId(kernel: HeadlessKernel): string | null {
  return kernel.getState().os.focus.activeZoneId;
}

function readZone(kernel: HeadlessKernel, zoneId?: string) {
  const id = zoneId ?? readActiveZoneId(kernel);
  return id ? kernel.getState().os.focus.zones[id] : undefined;
}

export function readFocusedItemId(
  kernel: HeadlessKernel,
  zoneId?: string,
): string | null {
  return readZone(kernel, zoneId)?.focusedItemId ?? null;
}

export function readSelected(
  kernel: HeadlessKernel,
  itemId: string,
  zoneId?: string,
): boolean {
  return readZone(kernel, zoneId)?.items[itemId]?.["aria-selected"] ?? false;
}

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

  // ── ARIA item state — read directly from items map ──
  // Commands wrote aria-* directly. No derivation. DOM is source of truth.
  const ariaItemState = z?.items?.[itemId] ?? {};
  const isAriaSelected = overrides?.selected ?? ariaItemState["aria-selected"] ?? false;
  const isAriaChecked = ariaItemState["aria-checked"] ?? false;
  const isAriaPressed = ariaItemState["aria-pressed"] ?? false;
  const isAriaExpanded = ariaItemState["aria-expanded"] ?? false;

  // ── Expand axis — expandable attribute (config-driven) ──
  const expandMode = entry?.config?.expand?.mode ?? "none";
  const expandable =
    expandMode === "all"
      ? true
      : expandMode === "explicit"
        ? (entry?.getExpandableItems?.().has(itemId) ?? false)
        : false;

  // ── Value axis ──
  const valueMode = entry?.config?.value?.mode ?? "none";
  const currentValue =
    valueMode === "continuous"
      ? (z?.valueNow?.[itemId] ?? entry!.config!.value!.min)
      : undefined;

  const isFocused = z?.focusedItemId === itemId;
  const isActiveZone = s.os.focus.activeZoneId === zoneId;
  const isDisabled = overrides?.disabled || ZoneRegistry.isDisabled(zoneId, itemId);
  const isActiveFocused = isFocused && isActiveZone;
  const isAnchor = isFocused && !isActiveZone;

  const hasCheckRole = (entry?.config?.check?.mode ?? "none") === "check";
  const hasSelectRole = (entry?.config?.select?.mode ?? "none") !== "none";

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
    // ── ARIA: direct reads — false must also be present when role is declared ──
    ...(hasSelectRole ? { "aria-selected": isAriaSelected } : {}),
    ...(hasCheckRole ? { "aria-checked": isAriaChecked } : {}),
    // aria-pressed: present when action.commands contains OS_PRESS OR items[id] has explicit state
    ...((entry?.config?.action?.commands?.some((c: any) => c.type === "OS_PRESS") || ariaItemState["aria-pressed"] !== undefined)
      ? { "aria-pressed": isAriaPressed }
      : {}),
  };

  // ── Value attrs ──
  if (valueMode === "continuous" && entry?.config?.value) {
    attrs["aria-valuenow"] = currentValue;
    attrs["aria-valuemin"] = entry.config.value.min;
    attrs["aria-valuemax"] = entry.config.value.max;
  }

  // ── Expand attrs ──
  if (expandable) {
    attrs["aria-expanded"] = isAriaExpanded;
    attrs["aria-controls"] = `panel-${itemId}`;
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
function toAriaHaspopup(
  overlayType: string,
): TriggerAttrs["aria-haspopup"] {
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
    return computeContainerProps(
      elementId,
      config,
      isActive,
      entry.role,
    ) as unknown as ElementAttrs;
  }

  // Check if it's an Item within any Zone
  const ownerZoneId = ZoneRegistry.findZoneByItemId(elementId);
  if (ownerZoneId) {
    const itemAttrs = computeAttrs(
      kernel,
      elementId,
      ownerZoneId,
    ) as unknown as ElementAttrs;

    // Merge trigger overlay ARIA if this item is also a trigger
    const triggerAttrs = computeTrigger(kernel, elementId);
    if (triggerAttrs) {
      return { ...itemAttrs, ...triggerAttrs };
    }

    return itemAttrs;
  }

  // Fallback: try active zone
  const activeZoneId = readActiveZoneId(kernel);
  if (activeZoneId) {
    return computeAttrs(
      kernel,
      elementId,
      activeZoneId,
    ) as unknown as ElementAttrs;
  }

  return {};
}
