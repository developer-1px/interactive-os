/**
 * resolveKeyboard — Pure keyboard event resolution
 *
 * Translates sensed keyboard data into an action.
 * No DOM access. No side effects. Pure function.
 *
 * W3C UI Events Module: Keyboard Events (§3.5)
 */

import type { BaseCommand } from "@kernel/core/tokens";
import type { ZoneCallback } from "@os/2-contexts/zoneRegistry";
import { Keybindings } from "@os/keymaps/keybindings";

// ═══════════════════════════════════════════════════════════════════
// Input / Output Types
// ═══════════════════════════════════════════════════════════════════

export interface KeyboardInput {
    canonicalKey: string;
    key: string;
    isEditing: boolean;
    isFieldActive: boolean;
    isComposing: boolean;
    isDefaultPrevented: boolean;
    isInspector: boolean;
    isCombobox: boolean;

    /** Role of the closest [data-item-id] element, e.g. "checkbox", "switch" */
    focusedItemRole: string | null;
    focusedItemId: string | null;

    /** Whether the active zone has onCheck registered */
    activeZoneHasCheck: boolean;
    activeZoneFocusedItemId: string | null;

    /** For building input meta */
    elementId: string | undefined;
}

export type KeyboardResult =
    | { action: "ignore" }
    | { action: "check"; targetId: string; meta: InputMeta }
    | { action: "dispatch"; command: BaseCommand; meta: InputMeta }
    | { action: "dispatch-callback"; callback: ZoneCallback; meta: InputMeta }
    | { action: "fallback" };

interface InputMeta {
    type: "KEYBOARD";
    key: string;
    code: string;
    elementId: string | undefined;
}

// ═══════════════════════════════════════════════════════════════════
// Pure Resolution
// ═══════════════════════════════════════════════════════════════════

export function resolveKeyboard(input: KeyboardInput): KeyboardResult {
    // Guard: IME, defaultPrevented, inspector, combobox
    if (input.isDefaultPrevented || input.isComposing) {
        return { action: "ignore" };
    }
    if (input.isInspector || input.isCombobox) {
        return { action: "ignore" };
    }

    const meta: InputMeta = {
        type: "KEYBOARD",
        key: input.key,
        code: input.canonicalKey,
        elementId: input.elementId,
    };

    // Space on checkbox/switch → CHECK override (W3C APG)
    if (input.canonicalKey === "Space" && !input.isEditing) {
        const checkResult = resolveCheck(input, meta);
        if (checkResult) return checkResult;
    }

    // Resolve keybinding with dual context
    const binding = Keybindings.resolve(input.canonicalKey, {
        isEditing: input.isEditing,
        isFieldActive: input.isFieldActive,
    });

    if (!binding) {
        return { action: "fallback" };
    }

    if (typeof binding.command === "function") {
        return { action: "dispatch-callback", callback: binding.command, meta };
    }

    return { action: "dispatch", command: binding.command, meta };
}

// ═══════════════════════════════════════════════════════════════════
// CHECK Resolution (Space on checkbox/switch)
// ═══════════════════════════════════════════════════════════════════

function resolveCheck(
    input: KeyboardInput,
    meta: InputMeta,
): KeyboardResult | null {
    // Case 1: Explicit checkbox/switch role → always CHECK
    if (
        (input.focusedItemRole === "checkbox" ||
            input.focusedItemRole === "switch") &&
        input.focusedItemId
    ) {
        return {
            action: "check",
            targetId: input.focusedItemId,
            meta: { ...meta, elementId: input.focusedItemId },
        };
    }

    // Case 2: Active zone has onCheck registered → CHECK (app semantics)
    if (input.activeZoneHasCheck && input.activeZoneFocusedItemId) {
        return {
            action: "check",
            targetId: input.activeZoneFocusedItemId,
            meta: { ...meta, elementId: input.activeZoneFocusedItemId },
        };
    }

    return null;
}
