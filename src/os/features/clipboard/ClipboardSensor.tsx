/**
 * ClipboardSensor - Browser Native Clipboard Event Handler
 *
 * Catches native `copy`, `cut`, `paste` DOM events and routes them
 * to the active Zone's bound commands. This replaces per-app
 * ClipboardManager components with OS-level handling.
 *
 * No keybindings needed — the browser fires these events natively
 * when the user presses ⌘C, ⌘X, ⌘V.
 */

import { useEffect } from "react";
import { dispatchToZone } from "@os/features/action/dispatchToZone";

function isInputActive(): boolean {
    const el = document.activeElement;
    return (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el as HTMLElement)?.isContentEditable
    );
}

export function ClipboardSensor() {
    useEffect(() => {
        const handleCopy = (e: ClipboardEvent) => {
            if (isInputActive()) return;
            if (dispatchToZone("copyCommand")) {
                e.preventDefault();
            }
        };

        const handleCut = (e: ClipboardEvent) => {
            if (isInputActive()) return;
            if (dispatchToZone("cutCommand")) {
                e.preventDefault();
            }
        };

        const handlePaste = (e: ClipboardEvent) => {
            if (isInputActive()) return;
            if (dispatchToZone("pasteCommand")) {
                e.preventDefault();
            }
        };

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

ClipboardSensor.displayName = "ClipboardSensor";
