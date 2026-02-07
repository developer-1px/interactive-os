/**
 * useOSCore - OS Core Initialization Hook
 *
 * Registers OS-level commands to CommandEngineStore.
 * Called once by OS.Root.
 */

import { OS_COMMANDS } from "@os/features/command/definitions/commandsShell";
import { ALL_OS_COMMANDS as OS_IMPL } from "@os/features/command/definitions/osCommands";
import { CommandRegistry } from "@os/features/command/model/createCommandStore";
import { useCommandEngineStore } from "@os/features/command/store/CommandEngineStore";
import { useLayoutEffect, useMemo } from "react";

export function useOSCore() {
  const isInitialized = useCommandEngineStore((s) => s.isInitialized);
  const initializeOS = useCommandEngineStore((s) => s.initializeOS);

  // Create OS-level registry with OS-SPECIFIC commands only
  const osRegistry = useMemo(() => {
    const registry = new CommandRegistry<any>();

    // Only register actual OS commands (Inspector, etc.)
    // Shell commands (NAVIGATE, COPY, PASTE) are interfaces for Apps to implement,
    // they don't need to exist in the OS registry.
    const inspectorCmd = OS_IMPL.find(
      (c) => c.id === OS_COMMANDS.TOGGLE_INSPECTOR,
    );
    if (inspectorCmd) {
      registry.register(inspectorCmd);
    }

    // OS-level keybindings (Global Defaults)
    // These map keys to Command IDs. The Commands themselves are handled by the Active App.
    registry.setKeymap([
      // Inspector (OS Native)
      {
        key: "Meta+I",
        command: OS_COMMANDS.TOGGLE_INSPECTOR,
        allowInInput: true,
      },

      // Navigation (Delegated to App)
      {
        key: "ArrowUp",
        command: OS_COMMANDS.NAVIGATE,
        args: { direction: "UP" },
      },
      {
        key: "ArrowDown",
        command: OS_COMMANDS.NAVIGATE,
        args: { direction: "DOWN" },
      },
      {
        key: "ArrowLeft",
        command: OS_COMMANDS.NAVIGATE,
        args: { direction: "LEFT" },
      },
      {
        key: "ArrowRight",
        command: OS_COMMANDS.NAVIGATE,
        args: { direction: "RIGHT" },
      },

      // Tab Navigation (Delegated to App)
      { key: "Tab", command: "OS_TAB", allowInInput: true },
      { key: "Shift+Tab", command: "OS_TAB_PREV", allowInInput: true },

      // Note: Space key is handled as TOGGLE passthrough (not SELECT)

      // Actions (Delegated to App)
      { key: "Enter", command: OS_COMMANDS.ACTIVATE },
      { key: "Escape", command: OS_COMMANDS.EXIT, allowInInput: true },

      // Field Editing (Delegated to App)
      {
        key: "Meta+Enter",
        command: OS_COMMANDS.FIELD_COMMIT,
        allowInInput: true,
      },

      // Clipboard (Passthrough - only matches when Zone has binding)
      { key: "Meta+C", command: OS_COMMANDS.COPY },
      { key: "Meta+X", command: OS_COMMANDS.CUT },
      { key: "Meta+V", command: OS_COMMANDS.PASTE },

      // Editing (Passthrough - only matches when Zone has binding)
      { key: "Space", command: OS_COMMANDS.TOGGLE },
      { key: "Backspace", command: OS_COMMANDS.DELETE },
      { key: "Delete", command: OS_COMMANDS.DELETE },
      { key: "Meta+Z", command: OS_COMMANDS.UNDO },
      { key: "Meta+Shift+Z", command: OS_COMMANDS.REDO },
    ]);

    return registry;
  }, []);

  useLayoutEffect(() => {
    if (!isInitialized) {
      initializeOS(osRegistry);
    }
  }, [isInitialized, initializeOS, osRegistry]);
}
