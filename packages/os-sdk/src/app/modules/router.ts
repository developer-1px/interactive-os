/**
 * router() — App Module for TanStack Router integration.
 *
 * Wraps TanStack Router as an AppModule.
 * - Forward sync: activePath change → router.navigate()
 * - Reverse sync: browser back/forward → OS selectDoc dispatch
 * - GO_BACK/GO_FORWARD → router.history.back()/forward()
 *
 * @example
 *   import { router } from "@os-sdk/app/modules/router";
 *   import { appRouter } from "./router";
 *
 *   defineApp("docs-viewer", INITIAL, {
 *     modules: [router({ instance: appRouter, basePath: "/docs" })],
 *   });
 */

import type { Middleware } from "@kernel/core/tokens";
import type { AppModule } from "./types";

export interface RouterInstance {
  navigate: (opts: { to: string }) => void;
  subscribe: (event: string, cb: (state: any) => void) => () => void;
  history: { back: () => void; forward: () => void };
  state: { location: { pathname: string } };
}

export interface RouterOptions {
  instance: RouterInstance;
  basePath?: string;
  pathField?: string;
}

function createRouterMiddleware(
  appId: string,
  scope: import("@kernel/core/tokens").ScopeToken,
  opts: RouterOptions,
): Middleware {
  const { instance, basePath = "", pathField = "activePath" } = opts;
  let lastSyncedPath: string | null = null;

  return {
    id: `router:${appId}`,
    scope,

    after(ctx) {
      const commandType = ctx.command.type;

      // GO_BACK → delegate to router history
      if (commandType === "GO_BACK") {
        instance.history.back();
        return ctx;
      }

      // GO_FORWARD → delegate to router history
      if (commandType === "GO_FORWARD") {
        instance.history.forward();
        return ctx;
      }

      // Forward sync: detect activePath change → navigate
      const effectsState = (ctx.effects as Record<string, unknown> | null)?.[
        "state"
      ] as Record<string, unknown> | undefined;

      if (!effectsState) return ctx;

      const newPath = effectsState[pathField] as string | null;
      if (newPath && newPath !== lastSyncedPath) {
        lastSyncedPath = newPath;
        const to = basePath ? `${basePath}/${newPath}` : `/${newPath}`;
        instance.navigate({ to });
      }

      return ctx;
    },
  };
}

export function router(opts: RouterOptions): AppModule {
  return {
    id: "router",
    install({ appId, scope }) {
      return createRouterMiddleware(appId, scope, opts);
    },
  };
}
