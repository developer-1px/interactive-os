/**
 * ClipboardListener - Browser Native Clipboard Event Handler
 *
 * Catches native `copy`, `cut`, `paste` DOM events and dispatches
 * OS-level clipboard commands. The kernel handles zone resolution
 * and app command delegation — same pattern as KeyboardListener → NAVIGATE.
 *
 * No keybindings needed — the browser fires these events natively
 * when the user presses ⌘C, ⌘X, ⌘V.
 */

import { useEffect } from "react";
import { kernel } from "../kernel";
import { OS_COPY, OS_CUT, OS_PASTE } from "../3-commands/clipboard/clipboard";

function isInputActive(): boolean {
  const el = document.activeElement;
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    (el as HTMLElement)?.isContentEditable
  );
}

export function ClipboardListener() {
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      if (isInputActive()) return;
      kernel.dispatch(OS_COPY());
      e.preventDefault();
    };

    const handleCut = (e: ClipboardEvent) => {
      if (isInputActive()) return;
      kernel.dispatch(OS_CUT());
      e.preventDefault();
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (isInputActive()) return;
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
