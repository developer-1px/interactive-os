import { createContext, useContext } from "react";

// --- 0. Context for Focus Zones ---
interface FocusContextValue {
  zoneId: string;
  isActive: boolean;
}
export const FocusContext = createContext<FocusContextValue | null>(null);

import type { BaseCommand } from "@os/entities/BaseCommand";
import type { CommandRegistry } from "@os/features/command/model/commandStore";

interface CommandContextValue<S = unknown> {
  dispatch: (cmd: BaseCommand) => void;
  currentFocusId?: string | number | null;
  activeZone?: string | null;
  registry?: CommandRegistry<S, any>;
  ctx?: any;
  state?: S; // Expose full state for advanced consumers (like MockBrains)
  activeKeybindingMap?: Map<string, boolean>;
}

export const CommandContext = createContext<CommandContextValue<any> | null>(null);

export const useEngine = <S = any>() => {
  const ctx = useContext(CommandContext);
  if (!ctx) throw new Error("useEngine must be used within an OS.App");
  return ctx as CommandContextValue<S>;
};

// --- Bridge Pattern for Provider-less Usage ---
let globalEngineHelper: (() => CommandContextValue<any>) | null = null;

export const setGlobalEngine = (hook: () => CommandContextValue<any>) => {
  globalEngineHelper = hook;
};

export const useCommandEngine = <S = unknown>() => {
  const context = useContext(CommandContext);
  if (context) return context as unknown as CommandContextValue<S>;

  if (globalEngineHelper) {
    return globalEngineHelper() as unknown as CommandContextValue<S>;
  }

  throw new Error(
    "Command Engine not initialized. Wrap in Provider or call setGlobalEngine().",
  );
};
