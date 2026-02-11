/**
 * OS.Root - Global OS Infrastructure Shell
 *
 * Mounts global singletons for each pipeline:
 * - Keyboard: Sensor → Intent
 * - Focus: Sensor → Intent → Sync
 * - Clipboard: Sensor (DOM events) + Intent (programmatic)
 * - History: Intent (keybinding-based undo/redo)
 */

// Focus recovery is handled by FocusSensor's MutationObserver (RECOVER command)
import type React from "react";
import { ClipboardIntent } from "@/os-new/1-listeners/clipboard/ClipboardIntent.tsx";
import { ClipboardSensor } from "@/os-new/1-listeners/clipboard/ClipboardSensor.tsx";
import { FocusSensor } from "@/os-new/1-listeners/focus/FocusSensor.tsx";
import { HistoryIntent } from "@/os-new/1-listeners/history/HistoryIntent.tsx";
import { KeyboardListener } from "@/os-new/1-listeners/KeyboardListener.tsx";

// Register kernel effects and contexts (side-effect imports)
import "@/os-new/4-effects";
import "@/os-new/2-contexts";

export interface RootProps {
  children: React.ReactNode;
}

/**
 * OS.Root - Must wrap all OS.App components.
 * Initializes global infrastructure and OS-level commands.
 */
export function Root({ children }: RootProps) {
  // OS-level Focus Recovery
  // Focus recovery handled by FocusSensor MutationObserver

  return (
    <>
      {/* Keyboard Pipeline (Kernel) */}
      <KeyboardListener />

      {/* Focus Pipeline */}
      <FocusSensor />

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
