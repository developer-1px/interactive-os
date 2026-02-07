/**
 * OS.Root - Global OS Infrastructure Shell
 *
 * Mounts global singletons (KeyboardSensor, FocusSensor, FocusIntent, FocusSync)
 * exactly once. All App components register their commands to extend
 * the global registry without owning infrastructure.
 */

import { FocusSensor } from "@os/features/focus/pipeline/1-sense/FocusSensor";
import { FocusIntent } from "@os/features/focus/pipeline/2-intent/FocusIntent";
import { FocusSync } from "@os/features/focus/pipeline/5-sync/FocusSync";
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

  return (
    <>
      {/* Global Infrastructure (Singletons) */}
      <KeyboardSensor />
      <KeyboardIntent />

      <FocusSensor />
      <FocusIntent />
      <FocusSync />

      {/* Child Apps */}
      {children}
    </>
  );
}

Root.displayName = "OS.Root";
