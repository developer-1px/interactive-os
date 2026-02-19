/**
 * Hierarchical Navigation — Builder keyboard navigation module.
 *
 * Enables keyboard navigation across Section/Group/Item hierarchy:
 *   - Arrow keys: traverse siblings at the SAME level (via itemFilter)
 *   - Enter: drill down (section→group→item→edit)
 *   - \: drill up (item→group→section)
 *
 * Architecture:
 *   - itemFilter: derived from focused item's data-level (no separate state)
 *   - drillDown/drillUp: ZoneCallbacks (DOM read → command return)
 *   - No kernel.defineCommand — callbacks are app-layer, not command-layer
 *
 * Rule #8: Commands don't read DOM. Callbacks do.
 *
 * @see discussions/2026-0219-1954-builder-focus-policy.md
 */

import { FOCUS } from "@/os/3-commands/focus/focus";
import { FIELD_START_EDIT } from "@/os/3-commands/field/field";
import { kernel } from "@/os/kernel";
import type { ZoneCursor } from "@/os/2-contexts/zoneRegistry";
import type { BaseCommand } from "@kernel";
import type { BuilderLevel } from "../primitives/Builder";

// ═══════════════════════════════════════════════════════════════════
// Level Hierarchy
// ═══════════════════════════════════════════════════════════════════

const LEVEL_ORDER: BuilderLevel[] = ["section", "group", "item"];

function getChildLevel(level: BuilderLevel): BuilderLevel | null {
    const idx = LEVEL_ORDER.indexOf(level);
    return idx < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[idx + 1] : null;
}

function getParentLevel(level: BuilderLevel): BuilderLevel | null {
    const idx = LEVEL_ORDER.indexOf(level);
    return idx > 0 ? LEVEL_ORDER[idx - 1] : null;
}

// ═══════════════════════════════════════════════════════════════════
// DOM Helpers (app-layer — callbacks can read DOM)
// ═══════════════════════════════════════════════════════════════════

function getLevel(id: string): BuilderLevel | null {
    const el = document.getElementById(id);
    return (el?.dataset["level"] as BuilderLevel) ?? null;
}

function findFirstChildAtLevel(
    parentEl: HTMLElement,
    level: BuilderLevel,
): string | null {
    const child = parentEl.querySelector<HTMLElement>(
        `[data-level="${level}"][data-item-id]`,
    );
    return child?.getAttribute("data-item-id") ?? null;
}

function findParentAtLevel(
    el: HTMLElement,
    level: BuilderLevel,
): string | null {
    const parent = el.parentElement?.closest<HTMLElement>(
        `[data-level="${level}"][data-item-id]`,
    );
    return parent?.getAttribute("data-item-id") ?? null;
}

// ═══════════════════════════════════════════════════════════════════
// Item Filter — Dynamic (derived from focused item's level)
// ═══════════════════════════════════════════════════════════════════

/**
 * Creates the itemFilter function for a canvas zone.
 *
 * Filters items to only those at the same level as the currently focused item.
 * If no focused item or no level attribute, defaults to "section" level
 * (top-level entry point).
 */
export function createCanvasItemFilter(
    zoneId: string,
): (items: string[]) => string[] {
    return (items: string[]) => {
        const focusedId =
            kernel.getState().os.focus.zones[zoneId]?.focusedItemId ?? null;
        const currentLevel: BuilderLevel = focusedId
            ? (getLevel(focusedId) ?? "section")
            : "section";

        return items.filter((id) => getLevel(id) === currentLevel);
    };
}

// ═══════════════════════════════════════════════════════════════════
// Zone Callbacks — drillDown / drillUp
// ═══════════════════════════════════════════════════════════════════

const CANVAS_ZONE_ID = "builder-canvas";

/**
 * drillDown — ZoneCallback for Enter key.
 *
 * At section/group: focuses the first child at the next level down.
 * At item level: starts field editing.
 *
 * This is a ZoneCallback (app-layer), NOT a kernel command.
 * It reads DOM to determine the target, then returns commands
 * for the OS to dispatch.
 */
export function drillDown(cursor: ZoneCursor): BaseCommand | BaseCommand[] {
    const el = document.getElementById(cursor.focusId);
    if (!el) return [];

    const level = el.dataset["level"] as BuilderLevel | undefined;
    if (!level) return [];

    // At item level: start editing
    if (level === "item") {
        return FIELD_START_EDIT();
    }

    // At section/group: find first child at next level
    const childLevel = getChildLevel(level);
    if (!childLevel) return [];

    const childId = findFirstChildAtLevel(el, childLevel);
    if (!childId) return [];

    return FOCUS({ zoneId: CANVAS_ZONE_ID, itemId: childId });
}

/**
 * drillUp — ZoneCallback for backslash key.
 *
 * At group: focuses the parent section.
 * At item: focuses the parent group (or section if no group).
 * At section: no-op.
 */
export function drillUp(cursor: ZoneCursor): BaseCommand | BaseCommand[] {
    const el = document.getElementById(cursor.focusId);
    if (!el) return [];

    const level = el.dataset["level"] as BuilderLevel | undefined;
    if (!level || level === "section") return []; // Already at top

    const parentLevel = getParentLevel(level);
    if (!parentLevel) return [];

    let parentId = findParentAtLevel(el, parentLevel);

    // If no group parent found for item, try section directly
    if (!parentId && level === "item") {
        parentId = findParentAtLevel(el, "section");
    }

    if (!parentId) return [];

    return FOCUS({ zoneId: CANVAS_ZONE_ID, itemId: parentId });
}
