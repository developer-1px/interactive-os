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
import { os } from "../../kernel";
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
  const { activeZoneId } = os.getState().os.focus;
  if (!activeZoneId) return false;
  const entry = ZoneRegistry.get(activeZoneId);
  return !!entry?.[callback];
}

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

export function ClipboardListener() {
  useEffect(() => {
    const handleCopy = (e: Event) => {
      const result = resolveClipboard({
        event: "copy",
        isInputActive: isInputActive(),
        zoneHasCallback: canZoneHandle("onCopy"),
      });
      if (result.action === "dispatch") {
        os.dispatch(OS_COPY());
        // No preventDefault — native copy coexists (inspector text selection works)
      }
    };

    const handleCut = (e: Event) => {
      const result = resolveClipboard({
        event: "cut",
        isInputActive: isInputActive(),
        zoneHasCallback: canZoneHandle("onCut"),
      });
      if (result.action === "dispatch") {
        os.dispatch(OS_CUT());
        e.preventDefault();
      }
    };

    const handlePaste = (e: Event) => {
      const result = resolveClipboard({
        event: "paste",
        isInputActive: isInputActive(),
        zoneHasCallback: canZoneHandle("onPaste"),
      });
      if (result.action === "dispatch") {
        os.dispatch(OS_PASTE());
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

ClipboardListener.displayName = "ClipboardListener";
