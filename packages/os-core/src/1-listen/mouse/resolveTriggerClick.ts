/**
 * resolveTriggerClick — Trigger-layer click resolution
 *
 * Given a trigger's role and overlay state,
 * returns the OS command that the trigger layer should handle,
 * or null if the trigger doesn't own this click.
 *
 * Trigger tier of the ZIFT click responder chain:
 *   **Trigger** → Item → Zone
 *
 * Symmetrical to buildTriggerKeymap (keyboard counterpart).
 *
 * Pure function. No DOM access. No side effects.
 */

import type { BaseCommand } from "@kernel";
import { OS_OVERLAY_CLOSE, OS_OVERLAY_OPEN } from "@os-core/4-command";
import { resolveTriggerRole } from "@os-core/engine/registries/triggerRegistry";

// ═══════════════════════════════════════════════════════════════════
// Trigger Click Context
// ═══════════════════════════════════════════════════════════════════

export interface TriggerClickInput {
    /** data-trigger-id of the trigger element */
    triggerId: string;
    /** Trigger's overlay role (menu, dialog, etc.) */
    triggerRole: string;
    /** Overlay ID controlled by this trigger */
    overlayId: string;
    /** Whether the overlay is currently open */
    isTriggerOverlayOpen: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════

/**
 * Resolve a click to a Trigger-layer command.
 *
 * @param input - Trigger click context (role, overlayId, overlay open state)
 * @returns BaseCommand if the trigger layer handles this click, null otherwise
 */
export function resolveTriggerClick(
    input: TriggerClickInput,
): BaseCommand | null {
    const config = resolveTriggerRole(input.triggerRole);

    // ── onClick not configured → not a clickable trigger ──
    if (!config.open.onClick) {
        return null;
    }

    // ── Toggle: already open → close ──
    if (input.isTriggerOverlayOpen) {
        return OS_OVERLAY_CLOSE({ id: input.overlayId });
    }

    // ── Closed → open ──
    return OS_OVERLAY_OPEN({
        id: input.overlayId,
        type: input.triggerRole as "menu" | "dialog" | "alertdialog" | "popover" | "tooltip",
        triggerId: input.triggerId,
    });
}
