/**
 * App - Application Shell
 *
 * Creates a command engine for the app and provides state/dispatch
 * via React Context. Children read state via useEngine().
 *
 * Must be used inside OS.Root.
 */

import { useInspectorPersistence } from "@inspector/stores/useInspectorPersistence";
import { Zone } from "@os/6-components/Zone";
import type { AppDefinition } from "@os/core/application/defineApplication";
import { createEngine } from "@os/core/command/model/createEngine";
import type { CommandRegistry } from "@os/core/command/model/createCommandStore";
import type React from "react";
import { createContext, useContext, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════════
// App Engine Context (replaces AppEngineContext.tsx + CommandContext.tsx)
// ═══════════════════════════════════════════════════════════════════

interface AppEngineContextValue<S = any> {
  appId: string;
  state: S;
  dispatch: (cmd: any) => void;
  registry: CommandRegistry<S, any>;
}

const AppEngineContext = createContext<AppEngineContextValue | null>(null);

/**
 * useEngine - Access the nearest App's state and dispatch.
 * Replaces the old CommandContext.tsx useEngine.
 */
export function useEngine<S = any>(): AppEngineContextValue<S> & {
  isInitialized: boolean;
} {
  const ctx = useContext(AppEngineContext) as AppEngineContextValue<S> | null;
  return {
    appId: ctx?.appId ?? "",
    dispatch: ctx?.dispatch ?? (() => { }),
    registry: ctx?.registry ?? (null as any),
    state: ctx?.state ?? (null as any),
    isInitialized: !!ctx,
  };
}

export const useCommandEngine = useEngine;

// ═══════════════════════════════════════════════════════════════════
// Default App Definition
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_APP: AppDefinition<{ ui: { isInspectorOpen: boolean } }> = {
  id: "os-shell",
  name: "OS Shell",
  model: { initial: { ui: { isInspectorOpen: false } } },
  keymap: [],
};

// ═══════════════════════════════════════════════════════════════════
// App Component
// ═══════════════════════════════════════════════════════════════════

export function App<S>({
  definition,
  children,
  isAppShell = false,
}: {
  definition?: AppDefinition<S>;
  children: React.ReactNode;
  isAppShell?: boolean;
}) {
  const appDef = (definition ?? DEFAULT_APP) as AppDefinition<S>;

  // 1. Engine (once per app)
  const engine = useMemo(() => createEngine(appDef), [appDef]);
  useInspectorPersistence(engine.store);

  // 2. State
  const { state, dispatch } = engine.store();

  const contextValue = useMemo(
    () => ({ appId: appDef.id, state, dispatch, registry: engine.registry }),
    [appDef.id, state, dispatch, engine.registry],
  );

  return (
    <AppEngineContext.Provider value={contextValue}>
      <Zone
        id={appDef.id}
        className={
          isAppShell
            ? "h-full flex flex-col overflow-hidden"
            : "min-h-full flex flex-col"
        }
      >
        {children}
      </Zone>
    </AppEngineContext.Provider>
  );
}
