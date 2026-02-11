/**
 * AppEngineContext - Scoped App Engine Provider
 *
 * Each OS.App provides its own engine (state, dispatch, registry)
 * via React Context. Components read from the nearest context,
 * ensuring app state isolation in a multi-app SPA.
 */

import type { CommandRegistry } from "@os/core/command/model/createCommandStore";
import { createContext, useContext } from "react";

export interface AppEngineContextValue<S = any> {
  appId: string;
  state: S;
  dispatch: (cmd: any) => void;
  registry: CommandRegistry<S, any>;
}

const AppEngineContext = createContext<AppEngineContextValue | null>(null);

export const AppEngineProvider = AppEngineContext.Provider;

/**
 * Read the nearest app's engine from context.
 * Returns null if not inside an OS.App (for OS-level code).
 */
export function useAppEngineContext<
  S = any,
>(): AppEngineContextValue<S> | null {
  return useContext(AppEngineContext) as AppEngineContextValue<S> | null;
}
