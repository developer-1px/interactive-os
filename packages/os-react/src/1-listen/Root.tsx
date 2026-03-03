/**
 * OS.Root - Global OS Infrastructure Shell
 *
 * Mounts global listener singletons for the OS pipeline.
 * Each listener maps to a W3C UI Events module:
 * - KeyboardListener: Keyboard Events (§3.5) → keybinding resolve → kernel.dispatch
 * - PointerListener: Pointer Events (§3.2) → gesture recognizer → CLICK (focus/select) or DRAG
 * - FocusListener: Focus Events (§3.3) → focusin → OS_SYNC_FOCUS
 * - ClipboardListener: Clipboard Events (§3.7) → native copy/cut/paste → Zone routing
 * - InputListener: Input Events → contentEditable text sync → FieldRegistry + onChange
 */

import { ClipboardListener } from "@os-react/1-listen/clipboard/ClipboardListener";
import { FocusListener } from "@os-react/1-listen/focus/FocusListener";
import { InputListener } from "@os-react/1-listen/input/InputListener";
import { KeyboardListener } from "@os-react/1-listen/keyboard/KeyboardListener";
import { PointerListener } from "@os-react/1-listen/pointer/PointerListener";
import type React from "react";

// Register kernel effects and contexts (side-effect imports)
import "@os-core/5-effect";
import "@os-core/3-inject";

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
      <PointerListener />
      <FocusListener />
      <ClipboardListener />
      <InputListener />
      {children}
    </>
  );
}

Root.displayName = "OS.Root";
