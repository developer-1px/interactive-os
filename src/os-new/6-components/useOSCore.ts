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

import { ALL_OS_COMMANDS as OS_IMPL } from "@os/core/command/definitions/osCommands";
import { CommandRegistry } from "@os/core/command/model/createCommandStore";
import { useCommandEngineStore } from "@os/core/command/store/CommandEngineStore";
import { useLayoutEffect, useMemo } from "react";
import { OS_COMMANDS } from "@/os-new/schema/command/OSCommands";

export function useOSCore() {
  const isInitialized = useCommandEngineStore((s) => s.isInitialized);
  const initializeOS = useCommandEngineStore((s) => s.initializeOS);

  const osRegistry = useMemo(() => {
    const registry = new CommandRegistry<any>();

    // Register Inspector toggle — the only true OS-native command
    const inspectorCmd = OS_IMPL.find(
      (c) => c.id === OS_COMMANDS.TOGGLE_INSPECTOR,
    );
    if (inspectorCmd) {
      registry.register(inspectorCmd);
    }

    return registry;
  }, []);

  useLayoutEffect(() => {
    if (!isInitialized) {
      initializeOS(osRegistry);
    }
  }, [isInitialized, initializeOS, osRegistry]);
}
