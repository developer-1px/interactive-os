/**
 * resolveMouse — Pure mouse event resolution
 *
 * Translates sensed mouse data into actions (focus, select, expand).
 * No DOM access. No side effects. Pure function.
 *
 * W3C UI Events Module: Mouse Events (§3.4)
 */

// ═══════════════════════════════════════════════════════════════════
// Input / Output Types
// ═══════════════════════════════════════════════════════════════════

export interface MouseInput {
    /** Resolved item under the pointer, if any */
    targetItemId: string | null;
    targetGroupId: string | null;

    /** Modifier keys held during click */
    shiftKey: boolean;
    metaKey: boolean;
    ctrlKey: boolean;
    altKey: boolean;

    /** Whether the item has a label (data-label + data-for) */
    isLabel: boolean;
    labelTargetItemId: string | null;
    labelTargetGroupId: string | null;

    /** Expansion data */
    hasAriaExpanded: boolean;
    /** Role of the item element (e.g. "treeitem", "button") */
    itemRole: string | null;
}

export type SelectMode = "replace" | "toggle" | "range";

export type MouseResult =
    | { action: "ignore" }
    | { action: "label-redirect"; itemId: string; groupId: string }
    | { action: "zone-activate"; groupId: string }
    | {
        action: "focus-and-select";
        itemId: string;
        groupId: string;
        selectMode: SelectMode;
        shouldExpand: boolean;
    };

// ═══════════════════════════════════════════════════════════════════
// Pure Resolution
// ═══════════════════════════════════════════════════════════════════

/** Roles where click should NOT toggle expansion (keyboard-only expand). */
const KEYBOARD_ONLY_EXPAND_ROLES = new Set(["treeitem", "menuitem"]);

export function resolveSelectMode(input: {
    shiftKey: boolean;
    metaKey: boolean;
    ctrlKey: boolean;
    altKey: boolean;
}): SelectMode {
    if (input.shiftKey) return "range";
    if (input.metaKey || input.ctrlKey) return "toggle";
    // APG: Alt+Click defaults to replace
    return "replace";
}

export function isClickExpandable(
    hasAriaExpanded: boolean,
    role: string | null,
): boolean {
    if (!hasAriaExpanded) return false;
    if (!role) return true; // no role → assume clickable
    return !KEYBOARD_ONLY_EXPAND_ROLES.has(role);
}

export function resolveMouse(input: MouseInput): MouseResult {
    // Label redirect takes priority
    if (input.isLabel && input.labelTargetItemId && input.labelTargetGroupId) {
        return {
            action: "label-redirect",
            itemId: input.labelTargetItemId,
            groupId: input.labelTargetGroupId,
        };
    }

    // No item but has zone → zone-activate (empty area click)
    if (!input.targetItemId && input.targetGroupId) {
        return { action: "zone-activate", groupId: input.targetGroupId };
    }

    // No target at all → ignore
    if (!input.targetItemId || !input.targetGroupId) {
        return { action: "ignore" };
    }

    return {
        action: "focus-and-select",
        itemId: input.targetItemId,
        groupId: input.targetGroupId,
        selectMode: resolveSelectMode(input),
        shouldExpand: isClickExpandable(input.hasAriaExpanded, input.itemRole),
    };
}
