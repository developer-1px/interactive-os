/**
 * Headless Compute — state readers + item/element attribute computation.
 *
 * Single Source of Truth for ARIA/data-* attributes.
 * Used by Item.tsx (DOM adapter) and headless tests.
 */

import { computeContainerProps } from "@os/3-inject/zoneContext";
import { getChildRole } from "@os/core/engine/registries/roleRegistry";
import { ZoneRegistry } from "@os/core/engine/registries/zoneRegistry";
import { DEFAULT_CONFIG } from "@os/core/schema/types/focus/config/FocusGroupConfig";

import type {
  ElementAttrs,
  HeadlessKernel,
  ItemAttrs,
  ItemOverrides,
  ItemResult,
} from "./types";

// Re-export types that consumers need
export type { ItemState } from "./types";

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

export function readSelection(
  kernel: HeadlessKernel,
  zoneId?: string,
): string[] {
  return readZone(kernel, zoneId)?.selection ?? [];
}

// ═══════════════════════════════════════════════════════════════════
// computeFieldAttrs — Internal helper for Field-owned ARIA attributes.
//
// Extracts check axis (aria-checked) and value axis (aria-valuenow/min/max)
// from computeItem. External interface unchanged.
//
// Phase 2: May be promoted to external API when createField is implemented.
// ═══════════════════════════════════════════════════════════════════

interface FieldAttrsInput {
  checkMode: string;
  isSelectableGroup: boolean;
  isSelected: boolean;
  valueMode: string;
  valueNow: number | undefined;
  valueConfig?: { min: number; max: number };
}

interface FieldAttrsOutput {
  "aria-checked"?: boolean;
  "aria-selected"?: boolean;
  "aria-valuenow"?: number;
  "aria-valuemin"?: number;
  "aria-valuemax"?: number;
}

function computeFieldAttrs(input: FieldAttrsInput): FieldAttrsOutput {
  const result: FieldAttrsOutput = {};

  // ── Check axis (aria-checked vs aria-selected) ──
  const useChecked = input.checkMode === "check";
  if (useChecked) {
    result["aria-checked"] = input.isSelected;
  } else if (input.isSelectableGroup) {
    result["aria-selected"] = input.isSelected;
  }

  // ── Value axis (aria-valuenow/min/max) ──
  if (input.valueMode === "continuous" && input.valueConfig) {
    result["aria-valuenow"] = input.valueNow;
    result["aria-valuemin"] = input.valueConfig.min;
    result["aria-valuemax"] = input.valueConfig.max;
  }

  return result;
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

  // ── Expand axis (aria-expanded) — config-driven ──
  const expandMode = entry?.config?.expand?.mode ?? "none";
  const expandable =
    expandMode === "all"
      ? true
      : expandMode === "explicit"
        ? (entry?.getExpandableItems?.().has(itemId) ?? false)
        : false;

  // ── Check + Value axes — delegated to computeFieldAttrs ──
  const checkMode = entry?.config?.check?.mode ?? "none";
  const isSelectableGroup = entry?.config.select.mode !== "none";
  const valueMode = entry?.config?.value?.mode ?? "none";

  const isFocused = z?.focusedItemId === itemId;
  const isActiveZone = s.os.focus.activeZoneId === zoneId;
  const isStoreSelected = z?.selection.includes(itemId) ?? false;
  const isExpanded = z?.expandedItems.includes(itemId) ?? false;
  const isDisabled =
    overrides?.disabled || ZoneRegistry.isDisabled(zoneId, itemId);
  const isActiveFocused = isFocused && isActiveZone;
  const isAnchor = isFocused && !isActiveZone;
  const isSelected = overrides?.selected || isStoreSelected;

  const currentValue =
    valueMode === "continuous"
      ? (z?.valueNow?.[itemId] ?? entry!.config!.value!.min)
      : undefined;

  const fieldAttrs = computeFieldAttrs({
    checkMode,
    isSelectableGroup,
    isSelected,
    valueMode,
    valueNow: currentValue,
    valueConfig:
      valueMode === "continuous"
        ? { min: entry!.config!.value!.min, max: entry!.config!.value!.max }
        : undefined,
  });

  const attrs: ItemAttrs = {
    id: itemId,
    role: childRole,
    tabIndex: isFocused ? 0 : -1,
    "data-focus-item": true,
    "data-item-id": itemId,
    "data-focused": isActiveFocused || undefined,
    "data-anchor": isAnchor || undefined,
    "data-selected": isSelected || undefined,
    "data-expanded": isExpanded || undefined,
    ...fieldAttrs,
  };

  if (expandable) {
    attrs["aria-expanded"] = isExpanded;
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
      isSelected,
      isExpanded,
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
    return computeAttrs(
      kernel,
      elementId,
      ownerZoneId,
    ) as unknown as ElementAttrs;
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
