/**
 * Hierarchical Navigation — Builder keyboard navigation module.
 *
 * Enables keyboard navigation across Section/Group/Item hierarchy:
 *   - Arrow keys: traverse siblings at the SAME level (via itemFilter)
 *   - Enter: drill down (section→group→item→edit)
 *   - \: drill up (item→group→section)
 *
 * Architecture:
 *   - All hierarchy queries go through OS item queries (DOM은 OS에서만 읽는다)
 *   - drillDown/drillUp: ZoneCallback factories (curried with zoneId)
 *   - No DOM access, no app-level registry
 *
 * @see discussions/2026-0219-1954-builder-focus-policy.md
 */

import type { BaseCommand } from "@kernel";
import {
  getAncestorWithAttribute,
  getFirstDescendantWithAttribute,
  getItemAttribute,
} from "@/os/2-contexts/itemQueries";
import type { ZoneCursor } from "@/os/2-contexts/zoneRegistry";
import { OS_FIELD_START_EDIT } from "@/os/3-commands/field/field";
import { OS_FOCUS } from "@/os/3-commands/focus/focus";
import { getFocusedItem } from "@/os/5-hooks/useFocusedItem";
import type { BuilderLevel } from "../primitives/Builder";

// ═══════════════════════════════════════════════════════════════════
// Level Hierarchy
// ═══════════════════════════════════════════════════════════════════

const LEVEL_ORDER: BuilderLevel[] = ["section", "group", "item"];

function getChildLevel(level: BuilderLevel): BuilderLevel | null {
  const idx = LEVEL_ORDER.indexOf(level);
  return idx < LEVEL_ORDER.length - 1 ? (LEVEL_ORDER[idx + 1] ?? null) : null;
}

function getParentLevel(level: BuilderLevel): BuilderLevel | null {
  const idx = LEVEL_ORDER.indexOf(level);
  return idx > 0 ? (LEVEL_ORDER[idx - 1] ?? null) : null;
}

// ═══════════════════════════════════════════════════════════════════
// Item Filter — Dynamic (derived from focused item's level)
// ═══════════════════════════════════════════════════════════════════

/**
 * Creates the itemFilter function for a canvas zone.
 *
 * Filters items to only those at the same level as the currently focused item.
 * If no focused item or no level, defaults to "section" level.
 *
 * Uses OS getItemAttribute — no DOM access in app code.
 */
export function createCanvasItemFilter(
  zoneId: string,
): (items: string[]) => string[] {
  return (items: string[]) => {
    const focusedId = getFocusedItem(zoneId);
    const currentLevel: BuilderLevel = focusedId
      ? ((getItemAttribute(zoneId, focusedId, "data-level") as BuilderLevel) ??
        "section")
      : "section";

    return items.filter(
      (id) => getItemAttribute(zoneId, id, "data-level") === currentLevel,
    );
  };
}

// ═══════════════════════════════════════════════════════════════════
// Zone Callback Factories — curried with zoneId
// ═══════════════════════════════════════════════════════════════════

/**
 * Create a drillDown ZoneCallback for a specific zone.
 *
 * At section/group: focuses the first child at the next level down.
 * At item level: starts field editing.
 *
 * Uses OS item queries — no DOM access in app code.
 */
export function createDrillDown(zoneId: string) {
  return (cursor: ZoneCursor): BaseCommand | BaseCommand[] => {
    const level = getItemAttribute(
      zoneId,
      cursor.focusId,
      "data-level",
    ) as BuilderLevel | null;
    if (!level) return [];

    // At item level: start editing
    if (level === "item") {
      return OS_FIELD_START_EDIT();
    }

    // At section/group: find first descendant at next level
    // If no child at next level, try deeper levels (section → item when no group)
    const childLevel = getChildLevel(level);
    if (!childLevel) return [];

    const childId = getFirstDescendantWithAttribute(
      zoneId,
      cursor.focusId,
      "data-level",
      childLevel,
    );

    if (childId) {
      return OS_FOCUS({ zoneId, itemId: childId });
    }

    // Fallback: skip intermediate levels (e.g., section → item when no group)
    const grandchildLevel = getChildLevel(childLevel);
    if (grandchildLevel) {
      const grandchildId = getFirstDescendantWithAttribute(
        zoneId,
        cursor.focusId,
        "data-level",
        grandchildLevel,
      );
      if (grandchildId) {
        return OS_FOCUS({ zoneId, itemId: grandchildId });
      }
    }

    return [];
  };
}

/**
 * Create a drillUp ZoneCallback for a specific zone.
 *
 * At group: focuses the parent section.
 * At item: focuses the parent group (or section if no group).
 * At section: no-op.
 *
 * Uses OS item queries — no DOM access in app code.
 */
export function createDrillUp(zoneId: string) {
  return (cursor: ZoneCursor): BaseCommand | BaseCommand[] => {
    const level = getItemAttribute(
      zoneId,
      cursor.focusId,
      "data-level",
    ) as BuilderLevel | null;
    if (!level || level === "section") return []; // Already at top

    const parentLevel = getParentLevel(level);
    if (!parentLevel) return [];

    let parentId = getAncestorWithAttribute(
      zoneId,
      cursor.focusId,
      "data-level",
      parentLevel,
    );

    // If no group parent found for item, try section directly
    if (!parentId && level === "item") {
      parentId = getAncestorWithAttribute(
        zoneId,
        cursor.focusId,
        "data-level",
        "section",
      );
    }

    if (!parentId) return [];

    return OS_FOCUS({ zoneId, itemId: parentId });
  };
}

// ═══════════════════════════════════════════════════════════════════
// Typing Entry — printable chars trigger drill-down (edit mode)
// ═══════════════════════════════════════════════════════════════════

/**
 * Create keybindings that let printable characters trigger drillDown.
 *
 * When the user is in "selected" state (navigating, not editing) and types
 * a printable character, this triggers the same drillDown callback that
 * Enter uses — at item level it dispatches FIELD_START_EDIT.
 *
 * This matches the Figma/Google Slides pattern where typing on a selected
 * text element starts editing and appends the typed character.
 *
 * Only registers a-z, A-Z, 0-9 to avoid conflicts with OS default keybindings
 * (Space, Enter, Escape, Arrow keys, etc.)
 */
export function createTypingEntryKeybindings(
  zoneId: string,
): { key: string; command: (cursor: ZoneCursor) => BaseCommand | BaseCommand[] }[] {
  const drillDown = createDrillDown(zoneId);
  const keys: string[] = [];

  // a-z
  for (let i = 65; i <= 90; i++) {
    keys.push(String.fromCharCode(i).toLowerCase());
  }
  // 0-9
  for (let i = 0; i <= 9; i++) {
    keys.push(String(i));
  }

  return keys.map((key) => ({
    key,
    command: drillDown,
  }));
}
