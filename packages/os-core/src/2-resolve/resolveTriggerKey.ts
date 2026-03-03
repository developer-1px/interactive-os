/**
 * resolveTriggerKey — Trigger-layer key resolution
 *
 * Given a trigger's role and overlay state, a canonical key,
 * returns the OS command that the trigger layer should handle,
 * or null if the trigger doesn't own this key.
 *
 * Trigger tier of the ZIFT keyboard responder chain:
 *   Field → **Trigger** → Item → Zone → OS Global
 *
 * Pure function. No DOM access. No side effects.
 */

import { OS_OVERLAY_OPEN } from "@os-core/4-command";
import { resolveTriggerRole } from "@os-core/engine/registries/triggerRegistry";

// ═══════════════════════════════════════════════════════════════════
// Trigger Context
// ═══════════════════════════════════════════════════════════════════

export interface TriggerKeyContext {
    /** Trigger's overlay role (menu, dialog, etc.) */
    triggerRole: string;
    /** Overlay ID controlled by this trigger */
    overlayId: string;
    /** Whether the overlay is currently open */
    isOverlayOpen: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════

/**
 * Resolve a key press to a Trigger-layer command.
 *
 * @param canonicalKey - Canonical key string (e.g., "Enter", "ArrowDown")
 * @param ctx - Trigger context (role, overlayId, overlay open state)
 * @returns BaseCommand if the trigger layer handles this key, null otherwise
 */
export function resolveTriggerKey(
    canonicalKey: string,
    ctx: TriggerKeyContext,
): BaseCommand | null {
    const config = resolveTriggerRole(ctx.triggerRole);

    // ── Already open: only Escape to close ──
    if (ctx.isOverlayOpen) {
        // When overlay is open, keyboard goes to the overlay Zone.
        // Trigger layer should not intercept.
        return null;
    }

    // ── Closed: check open config ──

    // Enter → OS_ACTIVATE is handled naturally by Item.onActivate
    // But we need to claim Enter here so Item layer doesn't double-handle
    if (canonicalKey === "Enter" && config.open.onActivate) {
        return OS_OVERLAY_OPEN({ id: ctx.overlayId, type: ctx.triggerRole });
    }

    if (canonicalKey === "Space" && config.open.onActivate) {
        return OS_OVERLAY_OPEN({ id: ctx.overlayId, type: ctx.triggerRole });
    }

    if (canonicalKey === "ArrowDown" && config.open.onArrowDown) {
        return OS_OVERLAY_OPEN({ id: ctx.overlayId, type: ctx.triggerRole });
    }

    if (canonicalKey === "ArrowUp" && config.open.onArrowUp) {
        return OS_OVERLAY_OPEN({ id: ctx.overlayId, type: ctx.triggerRole, entry: "last" });
    }

    return null;
}
