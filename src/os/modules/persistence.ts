/**
 * persistence() — App Module for localStorage persistence.
 *
 * Wraps the persistence middleware as an AppModule.
 * Replaces the `persistence: { key }` config in defineApp.
 *
 * Note: The actual middleware implementation currently lives in appSlice.ts.
 * This module delegates to it via the install context.
 *
 * @example
 *   defineApp("todo", INITIAL, { modules: [persistence({ key: "todo-v5" })] });
 */

import type { Middleware } from "@kernel/core/tokens";
import type { AppState } from "@os/kernel";
import { os } from "@os/kernel";
import type { AppModule } from "./types";

export interface PersistenceOptions {
  key: string;
  debounceMs?: number;
}

export function persistence(opts: PersistenceOptions): AppModule {
  return {
    id: "persistence",
    install({ appId, scope }) {
      return createPersistenceMiddleware(appId, scope, opts);
    },
  };
}

// ═══════════════════════════════════════════════════════════════════
// Persistence Middleware (moved from appSlice.ts)
// ═══════════════════════════════════════════════════════════════════

function createPersistenceMiddleware(
  appId: string,
  scope: import("@kernel/core/tokens").ScopeToken,
  config: { key: string; debounceMs?: number },
): Middleware {
  const { key, debounceMs = 300 } = config;
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  let lastSaved: unknown;

  function cancelPendingSave() {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
  }

  os.subscribe(() => {
    const currentAppState = (os.getState() as AppState).apps[appId];
    if (currentAppState !== lastSaved && saveTimeout) {
      cancelPendingSave();
      lastSaved = currentAppState;
    }
  });

  return {
    id: `persistence:${appId}`,
    scope,
    after(ctx) {
      const appState = (ctx.state as AppState).apps[appId];
      if (appState === lastSaved) return ctx;
      lastSaved = appState;

      cancelPendingSave();
      saveTimeout = setTimeout(() => {
        try {
          const freshState = (os.getState() as AppState).apps[appId];
          localStorage.setItem(key, JSON.stringify(freshState));
          lastSaved = freshState;
        } catch {
          // localStorage full or unavailable
        }
      }, debounceMs);

      return ctx;
    },
  };
}
