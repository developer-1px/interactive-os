/**
 * OS.Root - Global OS Infrastructure Shell
 *
 * Mounts global listener singletons for the OS pipeline.
 * Each listener maps to a W3C UI Events module:
 * - KeyboardListener: Keyboard Events (§3.5) → keybinding resolve → kernel.dispatch
 * - MouseListener: Mouse Events (§3.4) → mousedown → OS_FOCUS/OS_SELECT/OS_EXPAND
 * - FocusListener: Focus Events (§3.3) → focusin → OS_SYNC_FOCUS
 * - ClipboardListener: Clipboard Events (§3.7) → native copy/cut/paste → Zone routing
 * - InputListener: Input Events → contentEditable text sync → FieldRegistry + onChange
 */

import { ClipboardListener } from "@os/1-listeners/clipboard/ClipboardListener";
import { DragListener } from "@os/1-listeners/drag/DragListener";
import { FocusListener } from "@os/1-listeners/focus/FocusListener";
import { InputListener } from "@os/1-listeners/input/InputListener";
import { KeyboardListener } from "@os/1-listeners/keyboard/KeyboardListener";
import { MouseListener } from "@os/1-listeners/mouse/MouseListener";
import type React from "react";

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
      <MouseListener />
      <FocusListener />
      <ClipboardListener />
      <InputListener />
      <DragListener />
      {children}
    </>
  );
}

Root.displayName = "OS.Root";
