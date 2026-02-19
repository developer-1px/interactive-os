/**
 * KeyboardListener — DOM Adapter for keyboard events.
 *
 * Pipeline: KeyboardEvent → sense (DOM) → resolveKeyboard (pure) → dispatch
 *
 * W3C UI Events Module: Keyboard Events (§3.5)
 */

import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import { OS_CHECK } from "@os/3-commands/interaction";
import {
    isEditingElement,
    resolveIsEditingForKey,
} from "@os/keymaps/fieldKeyOwnership";
import { getCanonicalKey } from "@os/keymaps/getCanonicalKey";
import { useEffect } from "react";
import { kernel } from "../../kernel";
import { resolveKeyboard, type KeyboardInput } from "./resolveKeyboard";

// Ensure OS defaults are registered
import "@os/keymaps/osDefaults";

// Register fallback middlewares (side-effect)
import { macFallbackMiddleware } from "@os/keymaps/macFallbackMiddleware";
import { typeaheadFallbackMiddleware } from "@os/keymaps/typeaheadFallbackMiddleware";

kernel.use(macFallbackMiddleware);
kernel.use(typeaheadFallbackMiddleware);

// ═══════════════════════════════════════════════════════════════════
// Sense: DOM → Data extraction
// ═══════════════════════════════════════════════════════════════════

function senseKeyboard(e: KeyboardEvent): KeyboardInput | null {
    const target = e.target as HTMLElement;
    if (!target) return null;

    const canonicalKey = getCanonicalKey(e);

    // DOM queries for focus context
    const focusedEl = document.activeElement as HTMLElement | null;
    const itemEl = focusedEl?.closest?.("[data-item-id]") as HTMLElement | null;

    // Zone state for CHECK resolution
    const focusState = kernel.getState().os?.focus;
    const activeZoneId = focusState?.activeZoneId;
    const entry = activeZoneId ? ZoneRegistry.get(activeZoneId) : null;
    const zone = activeZoneId ? focusState?.zones?.[activeZoneId] : null;

    const isEditing = isEditingElement(target);

    return {
        canonicalKey,
        key: e.key,
        isEditing,
        isFieldActive: isEditing
            ? resolveIsEditingForKey(target, canonicalKey)
            : false,
        isComposing: e.isComposing || e.keyCode === 229,
        isDefaultPrevented: e.defaultPrevented,
        isInspector: !!target.closest("[data-inspector]"),
        isCombobox:
            target instanceof HTMLInputElement &&
            target.getAttribute("role") === "combobox",
        focusedItemRole: itemEl?.getAttribute("role") ?? null,
        focusedItemId: itemEl?.id ?? null,
        activeZoneHasCheck: !!entry?.onCheck,
        activeZoneFocusedItemId: zone?.focusedItemId ?? null,
        elementId:
            target.getAttribute("data-id") ??
            target.getAttribute("data-zone-id") ??
            target.id ??
            undefined,
    };
}

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

export function KeyboardListener() {
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const input = senseKeyboard(e);
            if (!input) return;

            const result = resolveKeyboard(input);

            switch (result.action) {
                case "ignore":
                    return;

                case "check":
                    kernel.dispatch(OS_CHECK({ targetId: result.targetId }), {
                        meta: { input: result.meta },
                    });
                    e.preventDefault();
                    e.stopPropagation();
                    return;

                case "dispatch":
                    kernel.dispatch(result.command, {
                        meta: { input: result.meta },
                    });
                    e.preventDefault();
                    e.stopPropagation();
                    return;

                case "dispatch-callback": {
                    // Build ZoneCursor from current kernel state
                    const { activeZoneId } = kernel.getState().os.focus;
                    if (!activeZoneId) return;
                    const zone =
                        kernel.getState().os.focus.zones[activeZoneId];
                    if (!zone?.focusedItemId) return;

                    const cursor = {
                        focusId: zone.focusedItemId,
                        selection: zone.selection ?? [],
                        anchor: zone.selectionAnchor ?? null,
                    };

                    const cmds = result.callback(cursor);
                    const cmdArray = Array.isArray(cmds) ? cmds : [cmds];
                    for (const cmd of cmdArray) {
                        kernel.dispatch(cmd, {
                            meta: { input: result.meta },
                        });
                    }
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }

                case "fallback":
                    if (kernel.resolveFallback(e)) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    return;
            }
        };

        window.addEventListener("keydown", onKeyDown, { capture: true });
        return () =>
            window.removeEventListener("keydown", onKeyDown, { capture: true });
    }, []);

    return null;
}

KeyboardListener.displayName = "KeyboardListener";
