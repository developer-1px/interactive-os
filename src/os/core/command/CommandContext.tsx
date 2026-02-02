import { createContext, useContext } from "react";

// --- 0. Context for Focus Zones ---
export interface FocusContextValue {
  zoneId: string;
  isActive: boolean;
}
export const FocusContext = createContext<FocusContextValue | null>(null);

import type { BaseCommand } from "@os/ui/types";
import type { CommandRegistry } from "@os/core/command/store";

export interface CommandContextValue<S = unknown> {
  dispatch: (cmd: BaseCommand) => void;
  currentFocusId?: string | number | null;
  activeZone?: string | null;
  registry?: CommandRegistry<S, any, any>;
  ctx?: any;
  state?: S; // Expose full state for advanced consumers (like MockBrains)
}

export const CommandContext = createContext<CommandContextValue<any> | null>(null);

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
