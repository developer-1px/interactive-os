/**
 * App - Application Shell
 * Registers its own commands to CommandEngineStore.
 * Must be used inside OS.Root.
 */

import { Zone } from "@os/app/export/primitives/Zone";
import type { AppDefinition } from "@os/features/application/defineApplication";
import { createEngine } from "@os/features/command/model/createEngine";
import { useCommandEngineStore } from "@os/features/command/store/CommandEngineStore";
import { useInspectorPersistence } from "@os/features/inspector/useInspectorPersistence";
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
  const { registerApp, updateAppState, isInitialized } =
    useCommandEngineStore();

  useEffect(() => {
    if (!isInitialized) return;

    registerApp({
      appId: appDef.id,
      registry: engine.registry,
      dispatch,
      state,
      contextMap: appDef.contextMap,
    });

    // No unregister needed - next registerApp will overwrite
  }, [appDef.id, isInitialized, dispatch]);

  // 4. Update state when it changes
  useEffect(() => {
    if (isInitialized) {
      updateAppState(appDef.id, state);
    }
  }, [state, isInitialized, appDef.id]);

  // 5. Body class for app shell mode
  useEffect(() => {
    document.body.classList.toggle("app-shell", isAppShell);
    return () => document.body.classList.remove("app-shell");
  }, [isAppShell]);

  return (
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
  );
}
