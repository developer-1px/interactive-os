/**
 * OS.Root - Global OS Infrastructure Shell
 *
 * Mounts global listener singletons for the OS pipeline:
 * - KeyboardListener: keydown → keybinding resolve → kernel.dispatch
 * - FocusListener: mousedown + focusin + MutationObserver → FOCUS/SYNC_FOCUS/RECOVER
 * - ClipboardListener: native copy/cut/paste → Zone command routing
 */

import type React from "react";
import { ClipboardListener } from "@os/1-listeners/ClipboardListener";
import { FocusListener } from "@os/1-listeners/FocusListener";
import { KeyboardListener } from "@os/1-listeners/KeyboardListener";

// Register kernel effects and contexts (side-effect imports)
import "@os/4-effects";
import "@os/2-contexts";

export interface RootProps {
  children: React.ReactNode;
}

/**
 * OS.Root - Must wrap all OS.App components.
 * Initializes global infrastructure and OS-level commands.
 */
export function Root({ children }: RootProps) {
  return (
    <>
      <KeyboardListener />
      <FocusListener />
      <ClipboardListener />
      {children}
    </>
  );
}

Root.displayName = "OS.Root";

