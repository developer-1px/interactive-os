/**
 * ClipboardListener — DOM Adapter for clipboard events.
 *
 * Pipeline: ClipboardEvent → sense (DOM) → resolveClipboard (pure) → dispatch
 *
 * W3C UI Events Module: Clipboard Events (§3.7)
 */

import { useEffect } from "react";
import { ZoneRegistry } from "../../2-contexts/zoneRegistry";
import {
    OS_COPY,
    OS_CUT,
    OS_PASTE,
} from "../../3-commands/clipboard/clipboard";
import { kernel } from "../../kernel";
import { resolveClipboard } from "./resolveClipboard";

// ═══════════════════════════════════════════════════════════════════
// Sense: DOM → Data extraction
// ═══════════════════════════════════════════════════════════════════

function isInputActive(): boolean {
    const el = document.activeElement;
    return (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el as HTMLElement)?.isContentEditable
    );
}

function canZoneHandle(callback: "onCopy" | "onCut" | "onPaste"): boolean {
    const { activeZoneId } = kernel.getState().os.focus;
    if (!activeZoneId) return false;
    const entry = ZoneRegistry.get(activeZoneId);
    return !!entry?.[callback];
}

const COMMAND_MAP = {
    copy: OS_COPY,
    cut: OS_CUT,
    paste: OS_PASTE,
} as const;

const CALLBACK_MAP = {
    copy: "onCopy",
    cut: "onCut",
    paste: "onPaste",
} as const;

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

export function ClipboardListener() {
    useEffect(() => {
        function handleClipboard(
            event: "copy" | "cut" | "paste",
            e: ClipboardEvent,
        ) {
            const result = resolveClipboard({
                event,
                isInputActive: isInputActive(),
                zoneHasCallback: canZoneHandle(CALLBACK_MAP[event]),
            });

            if (result.action === "dispatch") {
                kernel.dispatch(COMMAND_MAP[result.event]());
                e.preventDefault();
            }
        }

        const handleCopy = (e: Event) =>
            handleClipboard("copy", e as ClipboardEvent);
        const handleCut = (e: Event) =>
            handleClipboard("cut", e as ClipboardEvent);
        const handlePaste = (e: Event) =>
            handleClipboard("paste", e as ClipboardEvent);

        window.addEventListener("copy", handleCopy);
        window.addEventListener("cut", handleCut);
        window.addEventListener("paste", handlePaste);

        return () => {
            window.removeEventListener("copy", handleCopy);
            window.removeEventListener("cut", handleCut);
            window.removeEventListener("paste", handlePaste);
        };
    }, []);

    return null;
}

ClipboardListener.displayName = "ClipboardListener";
