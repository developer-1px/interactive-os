/**
 * Trigger Registry — Trigger Role Presets
 *
 * Defines behavior presets for overlay trigger patterns.
 * Each preset maps to a W3C APG pattern with correct
 * open, focus, and ARIA behavior.
 *
 * Follows the same pattern as roleRegistry.ts (Zone role presets).
 *
 * Reference: https://www.w3.org/WAI/ARIA/apg/patterns/
 */

import {
    type TriggerConfig,
    DEFAULT_TRIGGER_CONFIG,
} from "../../schema/types/focus/config/TriggerConfig";

// ═══════════════════════════════════════════════════════════════════
// Trigger Role Type
// ═══════════════════════════════════════════════════════════════════

export type TriggerRole =
    | "menu"
    | "dialog"
    | "alertdialog"
    | "listbox"
    | "popover"
    | "tooltip";

// ═══════════════════════════════════════════════════════════════════
// Built-in Trigger Presets
// ═══════════════════════════════════════════════════════════════════

type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

const triggerPresets: Record<TriggerRole, DeepPartial<TriggerConfig>> = {
    // ─── Menu Button (APG: Menu Button Pattern) ───
    // Enter/Space/Click open, ArrowDown/Up also open
    menu: {
        open: {
            onActivate: true,
            onClick: true,
            onArrowDown: true,
            onArrowUp: true,
        },
        focus: { onOpen: "first", onClose: "restore" },
        aria: { haspopup: "true" },
    },

    // ─── Dialog Trigger (APG: Dialog Pattern) ───
    // Enter/Space/Click open, arrows do NOT open
    dialog: {
        open: {
            onActivate: true,
            onClick: true,
        },
        focus: { onOpen: "first", onClose: "restore" },
        aria: { haspopup: "dialog" },
    },

    // ─── Alert Dialog Trigger ───
    alertdialog: {
        open: {
            onActivate: true,
            onClick: true,
        },
        focus: { onOpen: "first", onClose: "restore" },
        aria: { haspopup: "dialog" },
    },

    // ─── Listbox Trigger (APG: Combobox / Select) ───
    // Enter/Space/Click/ArrowDown open
    listbox: {
        open: {
            onActivate: true,
            onClick: true,
            onArrowDown: true,
            onArrowUp: true,
        },
        focus: { onOpen: "first", onClose: "restore" },
        aria: { haspopup: "listbox" },
    },

    // ─── Popover Trigger ───
    popover: {
        open: {
            onActivate: true,
            onClick: true,
        },
        focus: { onOpen: "first", onClose: "restore" },
        aria: { haspopup: "true" },
    },

    // ─── Tooltip Trigger (APG: Tooltip Pattern) ───
    // Hover opens, no keyboard open, no focus change
    tooltip: {
        open: {
            onActivate: false,
            onClick: false,
            onHover: true,
        },
        focus: { onOpen: "none", onClose: "none" },
        aria: { haspopup: false },
    },
};

// ═══════════════════════════════════════════════════════════════════
// Resolver
// ═══════════════════════════════════════════════════════════════════

/**
 * Resolve a TriggerConfig from a trigger role, with optional overrides.
 * Follows the same deep-merge pattern as resolveRole().
 */
export function resolveTriggerRole(
    role: TriggerRole | string | undefined,
): TriggerConfig {
    const preset = role
        ? triggerPresets[role as TriggerRole] ?? {}
        : {};

    return {
        open: {
            ...DEFAULT_TRIGGER_CONFIG.open,
            ...preset.open,
        },
        focus: {
            ...DEFAULT_TRIGGER_CONFIG.focus,
            ...preset.focus,
        },
        aria: {
            ...DEFAULT_TRIGGER_CONFIG.aria,
            ...preset.aria,
        },
    };
}
