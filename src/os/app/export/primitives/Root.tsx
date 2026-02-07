/**
 * OS.Root - Global OS Infrastructure Shell
 *
 * Mounts global singletons for each pipeline:
 * - Keyboard: Sensor → Intent
 * - Focus: Sensor → Intent → Sync
 * - Clipboard: Sensor (DOM events) + Intent (programmatic)
 * - History: Intent (keybinding-based undo/redo)
 */

import { ClipboardIntent } from "@os/features/clipboard/ClipboardIntent";
import { ClipboardSensor } from "@os/features/clipboard/ClipboardSensor";
import { FocusSensor } from "@os/features/focus/pipeline/1-sense/FocusSensor";
import { FocusIntent } from "@os/features/focus/pipeline/2-intent/FocusIntent";
import { useFocusRecovery } from "@os/features/focus/hooks/useFocusRecovery";
import { HistoryIntent } from "@os/features/history/HistoryIntent";
import { KeyboardIntent, KeyboardSensor } from "@os/features/keyboard";
import type React from "react";
import { useOSCore } from "./useOSCore";

export interface RootProps {
  children: React.ReactNode;
}

/**
 * OS.Root - Must wrap all OS.App components.
 * Initializes global infrastructure and OS-level commands.
 */
export function Root({ children }: RootProps) {
  // Initialize OS Core (registers OS commands to global registry)
  useOSCore();

  // OS-level Focus Recovery
  useFocusRecovery();

  return (
    <>
      {/* Keyboard Pipeline */}
      <KeyboardSensor />
      <KeyboardIntent />

      {/* Focus Pipeline */}
      <FocusSensor />
      <FocusIntent />
      {/* FocusSync removed - now handled by primitives and hooks */}

      {/* Clipboard Pipeline (DOM events + programmatic) */}
      <ClipboardSensor />
      <ClipboardIntent />

      {/* History Pipeline (keybinding-based) */}
      <HistoryIntent />

      {/* Child Apps */}
      {children}
    </>
  );
}

Root.displayName = "OS.Root";
