/**
 * ClipboardListener - Browser Native Clipboard Event Handler
 *
 * Catches native `copy`, `cut`, `paste` DOM events and dispatches
 * OS-level clipboard commands. The kernel handles zone resolution
 * and app command delegation — same pattern as KeyboardListener → NAVIGATE.
 *
 * KEY DESIGN DECISION:
 *   Only overrides native clipboard when the active zone explicitly
 *   provides the relevant callback (onCopy/onCut/onPaste).
 *   Otherwise, native browser clipboard behavior is preserved.
 *   This allows normal text selection + copy on pages without clipboard overrides.
 */

import { useEffect } from "react";
import { ZoneRegistry } from "../2-contexts/zoneRegistry";
import { OS_COPY, OS_CUT, OS_PASTE } from "../3-commands/clipboard/clipboard";
import { kernel } from "../kernel";

function isInputActive(): boolean {
  const el = document.activeElement;
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    (el as HTMLElement)?.isContentEditable
  );
}

/**
 * Check if the active zone has a specific clipboard callback.
 * Returns true only when: activeZoneId exists AND zone has the callback.
 */
function canZoneHandle(callback: "onCopy" | "onCut" | "onPaste"): boolean {
  const { activeZoneId } = kernel.getState().os.focus;
  if (!activeZoneId) return false;
  const entry = ZoneRegistry.get(activeZoneId);
  return !!entry?.[callback];
}

export function ClipboardListener() {
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      if (isInputActive()) return;
      if (!canZoneHandle("onCopy")) return; // native copy preserved
      kernel.dispatch(OS_COPY());
      e.preventDefault();
    };

    const handleCut = (e: ClipboardEvent) => {
      if (isInputActive()) return;
      if (!canZoneHandle("onCut")) return; // native cut preserved
      kernel.dispatch(OS_CUT());
      e.preventDefault();
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (isInputActive()) return;
      if (!canZoneHandle("onPaste")) return; // native paste preserved
      kernel.dispatch(OS_PASTE());
      e.preventDefault();
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

ClipboardListener.displayName = "ClipboardListener";
