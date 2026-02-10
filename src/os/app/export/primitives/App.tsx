/**
 * App - Application Shell
 * Registers its own commands to CommandEngineStore.
 * Must be used inside OS.Root.
 */

import { Zone } from "@os/app/export/primitives/Zone";
import type { AppDefinition } from "@os/features/application/defineApplication";
import { createEngine } from "@os/features/command/model/createEngine";
import { useCommandEngineStore } from "@os/features/command/store/CommandEngineStore";
import { AppEngineProvider } from "@os/features/command/ui/AppEngineContext";
import { useInspectorPersistence } from "@inspector/stores/useInspectorPersistence";
import type React from "react";
import { useEffect, useMemo } from "react";

// Default minimal app for pages that don't need custom keybindings
const DEFAULT_APP: AppDefinition<{ ui: { isInspectorOpen: boolean } }> = {
  id: "os-shell",
  name: "OS Shell",
  model: { initial: { ui: { isInspectorOpen: false } } },
  keymap: [],
};

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

  // 3. Register with CommandEngineStore
  const { registerApp, unregisterApp, updateAppState, isInitialized } =
    useCommandEngineStore();

  useEffect(() => {
    if (!isInitialized) return;

    registerApp({
      appId: appDef.id,
      registry: engine.registry,
      dispatch,
      state,
      getState: () => engine.store.getState().state,
      setState: (newState) => engine.store.setState({ state: newState }),
      ...(appDef.contextMap !== undefined
        ? { contextMap: appDef.contextMap }
        : {}),
    });

    return () => unregisterApp(appDef.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Registration lifecycle only.
    // `state` is intentionally excluded: state sync is handled by updateAppState effect.
  }, [
    appDef.id,
    isInitialized,
    dispatch,
    appDef.contextMap,
    engine.registry,
    engine.store.getState,
    engine.store.setState,
    registerApp,
    state,
    unregisterApp,
  ]);

  // 4. Update state when it changes
  useEffect(() => {
    if (isInitialized) {
      updateAppState(appDef.id, state);
    }
  }, [state, isInitialized, appDef.id, updateAppState]);



  const contextValue = useMemo(
    () => ({ appId: appDef.id, state, dispatch, registry: engine.registry }),
    [appDef.id, state, dispatch, engine.registry],
  );

  return (
    <AppEngineProvider value={contextValue}>
      <Zone
        id={appDef.id}
        className={
          isAppShell
            ? "h-full flex flex-col overflow-hidden"
            : "min-h-full flex flex-col"
        }
      >
        {isInitialized ? children : null}
      </Zone>
    </AppEngineProvider>
  );
}
