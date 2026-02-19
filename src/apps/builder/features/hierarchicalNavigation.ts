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
 *   - DRILL_DOWN/DRILL_UP: kernel commands using OS FOCUS
 *   - Assembled as plain functions (W14: no new protocol needed)
 *
 * @see discussions/2026-0219-1954-builder-focus-policy.md
 */

import { FOCUS } from "@/os/3-commands/focus/focus";
import { FIELD_START_EDIT } from "@/os/3-commands/field/field";
import { kernel } from "@/os/kernel";
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
// DOM Helpers
// ═══════════════════════════════════════════════════════════════════

/**
 * Get the data-level of an element by its ID.
 */
function getLevel(id: string): BuilderLevel | null {
    const el = document.getElementById(id);
    return (el?.dataset.level as BuilderLevel) ?? null;
}

/**
 * Find the first descendant item at a specific level within the given element.
 */
function findFirstChildAtLevel(
    parentEl: HTMLElement,
    level: BuilderLevel,
): string | null {
    const child = parentEl.querySelector<HTMLElement>(
        `[data-level="${level}"][data-item-id]`,
    );
    return child?.getAttribute("data-item-id") ?? null;
}

/**
 * Find the closest ancestor item at a specific level.
 */
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
        // Derive current level from focused item
        const focusedId =
            kernel.getState().os.focus.zones[zoneId]?.focusedItemId ?? null;
        const currentLevel: BuilderLevel = focusedId
            ? (getLevel(focusedId) ?? "section")
            : "section";

        return items.filter((id) => getLevel(id) === currentLevel);
    };
}

// ═══════════════════════════════════════════════════════════════════
// Kernel Commands — DRILL_DOWN / DRILL_UP
// ═══════════════════════════════════════════════════════════════════

/**
 * BUILDER_DRILL_DOWN — Enter key action for hierarchical navigation.
 *
 * At section/group: focuses the first child at the next level down.
 * At item level: starts field editing (FIELD_START_EDIT).
 */
export const BUILDER_DRILL_DOWN = kernel.defineCommand(
    "BUILDER_DRILL_DOWN",
    (ctx) =>
        (payload: { zoneId: string }) => {
            const { zoneId } = payload;
            const focusedId =
                ctx.state.os.focus.zones[zoneId]?.focusedItemId ?? null;
            if (!focusedId) return;

            const level = getLevel(focusedId);
            if (!level) return;

            // At item level: start editing
            if (level === "item") {
                return { dispatch: [FIELD_START_EDIT()] };
            }

            // At section/group: find first child at next level
            const childLevel = getChildLevel(level);
            if (!childLevel) return;

            const el = document.getElementById(focusedId);
            if (!el) return;

            const childId = findFirstChildAtLevel(el, childLevel);
            if (childId) {
                return { dispatch: [FOCUS({ zoneId, itemId: childId })] };
            }
        },
);

/**
 * BUILDER_DRILL_UP — Backslash key action for hierarchical navigation.
 *
 * At group: focuses the parent section.
 * At item: focuses the parent group (or section if no group).
 * At section: no-op (already at top level).
 */
export const BUILDER_DRILL_UP = kernel.defineCommand(
    "BUILDER_DRILL_UP",
    (ctx) =>
        (payload: { zoneId: string }) => {
            const { zoneId } = payload;
            const focusedId =
                ctx.state.os.focus.zones[zoneId]?.focusedItemId ?? null;
            if (!focusedId) return;

            const level = getLevel(focusedId);
            if (!level || level === "section") return; // Already at top

            const el = document.getElementById(focusedId);
            if (!el) return;

            // Try parent level first
            const parentLevel = getParentLevel(level);
            if (!parentLevel) return;

            let parentId = findParentAtLevel(el, parentLevel);

            // If no group parent found for item, try section directly
            if (!parentId && level === "item") {
                parentId = findParentAtLevel(el, "section");
            }

            if (parentId) {
                return { dispatch: [FOCUS({ zoneId, itemId: parentId })] };
            }
        },
);
