/**
 * useOSCore - OS Core Initialization Hook
 *
 * Initializes the CommandEngineStore for app registration.
 * Called once by OS.Root.
 *
 * Note: OS-level keybindings are registered in `1-listeners/osDefaults.ts`
 * and handled by `KeyboardListener → kernel.dispatch()`.
 * The keybinding duplication that was previously here has been removed.
 */

import { CommandRegistry } from "@os/core/command/model/createCommandStore";
import { useCommandEngineStore } from "@os/core/command/store/CommandEngineStore";
import { useLayoutEffect, useMemo } from "react";

export function useOSCore() {
  const isInitialized = useCommandEngineStore((s) => s.isInitialized);
  const initializeOS = useCommandEngineStore((s) => s.initializeOS);

  const osRegistry = useMemo(() => {
    return new CommandRegistry<any>();
  }, []);

  useLayoutEffect(() => {
    if (!isInitialized) {
      initializeOS(osRegistry);
    }
  }, [isInitialized, initializeOS, osRegistry]);
}
