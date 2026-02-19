/**
 * Hierarchical Navigation — Builder keyboard navigation module.
 *
 * Enables keyboard navigation across Section/Group/Item hierarchy:
 *   - Arrow keys: traverse siblings at the SAME level (via itemFilter)
 *   - Enter: drill down (section→group→item→edit)
 *   - \: drill up (item→group→section)
 *
 * Architecture:
 *   - itemFilter: derived from focused item's level (via BuilderRegistry)
 *   - drillDown/drillUp: ZoneCallbacks (registry read → command return)
 *   - Zero DOM access — all hierarchy data from BuilderRegistry
 *
 * Rule: DOM은 OS에서만 읽는다. 앱은 Registry/State만 사용한다.
 *
 * @see discussions/2026-0219-1954-builder-focus-policy.md
 */

import { FOCUS } from "@/os/3-commands/focus/focus";
import { FIELD_START_EDIT } from "@/os/3-commands/field/field";
import { kernel } from "@/os/kernel";
import type { ZoneCursor } from "@/os/2-contexts/zoneRegistry";
import type { BaseCommand } from "@kernel";
import type { BuilderLevel } from "../primitives/Builder";
import { BuilderRegistry } from "../BuilderRegistry";

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
// Item Filter — Dynamic (derived from focused item's level)
// ═══════════════════════════════════════════════════════════════════

/**
 * Creates the itemFilter function for a canvas zone.
 *
 * Filters items to only those at the same level as the currently focused item.
 * If no focused item or no level, defaults to "section" level.
 *
 * Reads level from BuilderRegistry — no DOM access.
 */
export function createCanvasItemFilter(
    zoneId: string,
): (items: string[]) => string[] {
    return (items: string[]) => {
        const focusedId =
            kernel.getState().os.focus.zones[zoneId]?.focusedItemId ?? null;
        const currentLevel: BuilderLevel = focusedId
            ? (BuilderRegistry.getLevel(focusedId) ?? "section")
            : "section";

        return items.filter(
            (id) => BuilderRegistry.getLevel(id) === currentLevel,
        );
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
 * Reads hierarchy from BuilderRegistry — no DOM access.
 */
export function drillDown(cursor: ZoneCursor): BaseCommand | BaseCommand[] {
    const level = BuilderRegistry.getLevel(cursor.focusId);
    if (!level) return [];

    // At item level: start editing
    if (level === "item") {
        return FIELD_START_EDIT();
    }

    // At section/group: find first descendant at next level
    const childLevel = getChildLevel(level);
    if (!childLevel) return [];

    const childId = BuilderRegistry.getFirstDescendantAtLevel(
        cursor.focusId,
        childLevel,
    );
    if (!childId) return [];

    return FOCUS({ zoneId: CANVAS_ZONE_ID, itemId: childId });
}

/**
 * drillUp — ZoneCallback for backslash key.
 *
 * At group: focuses the parent section.
 * At item: focuses the parent group (or section if no group).
 * At section: no-op.
 *
 * Reads hierarchy from BuilderRegistry — no DOM access.
 */
export function drillUp(cursor: ZoneCursor): BaseCommand | BaseCommand[] {
    const level = BuilderRegistry.getLevel(cursor.focusId);
    if (!level || level === "section") return []; // Already at top

    const parentLevel = getParentLevel(level);
    if (!parentLevel) return [];

    let parentId = BuilderRegistry.getAncestorAtLevel(
        cursor.focusId,
        parentLevel,
    );

    // If no group parent found for item, try section directly
    if (!parentId && level === "item") {
        parentId = BuilderRegistry.getAncestorAtLevel(cursor.focusId, "section");
    }

    if (!parentId) return [];

    return FOCUS({ zoneId: CANVAS_ZONE_ID, itemId: parentId });
}
